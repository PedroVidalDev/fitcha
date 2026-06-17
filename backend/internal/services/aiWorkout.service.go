package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	dtos "fitcha/internal/dtos/aiWorkout"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"fmt"
	"io"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

const (
	defaultAIWorkoutModel     = "gpt-4.1-mini"
	openAIChatCompletionsURL  = "https://api.openai.com/v1/chat/completions"
	aiWorkoutGenerationTries  = 2
	aiWorkoutResponseSchemaID = "ai_workout_plan"
)

type AIWorkoutService struct {
	db         *gorm.DB
	users      repositories.IUserRepository
	catalog    repositories.IMachineRepository
	httpClient *http.Client
	apiKey     string
	model      string
}

func NewAIWorkoutService(db *gorm.DB, userRepo repositories.IUserRepository, catalogRepo repositories.IMachineRepository) *AIWorkoutService {
	model := strings.TrimSpace(os.Getenv("OPENAI_MODEL"))
	if model == "" {
		model = defaultAIWorkoutModel
	}

	return &AIWorkoutService{
		db:         db,
		users:      userRepo,
		catalog:    catalogRepo,
		httpClient: &http.Client{Timeout: 45 * time.Second},
		apiKey:     strings.TrimSpace(os.Getenv("OPENAI_API_KEY")),
		model:      model,
	}
}

func (s *AIWorkoutService) Generate(ctx context.Context, userID uint, input dtos.GenerateAIWorkoutRequest) (dtos.GenerateAIWorkoutResponse, error) {
	if s.apiKey == "" {
		return dtos.GenerateAIWorkoutResponse{}, errors.New("configure OPENAI_API_KEY para gerar treinos com IA")
	}

	selectedDays, err := normalizeSelectedDays(input.SelectedDays)
	if err != nil {
		return dtos.GenerateAIWorkoutResponse{}, err
	}

	input.SelectedDays = selectedDays
	input.DaysPerWeek = len(selectedDays)

	catalogMachines, err := s.catalog.FindAll()
	if err != nil {
		return dtos.GenerateAIWorkoutResponse{}, errors.New("nao foi possivel carregar o catalogo de maquinas")
	}
	if len(catalogMachines) == 0 {
		return dtos.GenerateAIWorkoutResponse{}, errors.New("nenhuma maquina de catalogo disponivel para a geracao")
	}

	catalogByID := buildCatalogMachineLookup(catalogMachines)

	user, err := s.users.FindByID(userID)
	if err != nil {
		return dtos.GenerateAIWorkoutResponse{}, errors.New("usuario nao encontrado")
	}

	if user.Credits <= 0 {
		return dtos.GenerateAIWorkoutResponse{}, errors.New("voce nao possui creditos suficientes para gerar um treino com IA")
	}

	response, err := s.requestWorkoutPlan(ctx, input, catalogMachines, catalogByID)
	if err != nil {
		if requestErr := mapAIWorkoutRequestError(err); requestErr != nil {
			return dtos.GenerateAIWorkoutResponse{}, requestErr
		}

		return dtos.GenerateAIWorkoutResponse{}, err
	}

	if len(response.Categories) == 0 {
		return dtos.GenerateAIWorkoutResponse{}, errors.New("a IA nao retornou categorias de treino validas")
	}

	workoutInputs := buildGeneratedWorkoutInputs(response, catalogByID)
	remainingCredits := user.Credits

	if err := mapAIWorkoutRequestError(ctx.Err()); err != nil {
		return dtos.GenerateAIWorkoutResponse{}, err
	}

	err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := mapAIWorkoutRequestError(ctx.Err()); err != nil {
			return err
		}

		if _, _, err := replaceWorkoutsInTx(tx, userID, workoutInputs); err != nil {
			return err
		}

		if err := mapAIWorkoutRequestError(ctx.Err()); err != nil {
			return err
		}

		updatedUser, err := repositories.NewUserRepository(tx).ConsumeCredit(userID)
		if err != nil {
			return err
		}

		remainingCredits = updatedUser.Credits
		return nil
	})
	if err != nil {
		if errors.Is(err, repositories.ErrInsufficientCredits) {
			return dtos.GenerateAIWorkoutResponse{}, errors.New("voce nao possui creditos suficientes para concluir esta geracao")
		}

		return dtos.GenerateAIWorkoutResponse{}, err
	}

	response.RemainingCredits = remainingCredits

	return response, nil
}

func (s *AIWorkoutService) requestWorkoutPlan(ctx context.Context, input dtos.GenerateAIWorkoutRequest, catalogMachines []models.Machine, catalogByID map[string]models.Machine) (dtos.GenerateAIWorkoutResponse, error) {
	var lastErr error

	for attempt := 0; attempt < aiWorkoutGenerationTries; attempt++ {
		if err := mapAIWorkoutRequestError(ctx.Err()); err != nil {
			return dtos.GenerateAIWorkoutResponse{}, err
		}

		response, err := s.requestWorkoutPlanAttempt(ctx, input, catalogMachines, catalogByID, lastErr)
		if err == nil {
			return response, nil
		}

		if !isRetryableWorkoutError(err) {
			return dtos.GenerateAIWorkoutResponse{}, err
		}

		lastErr = err
	}

	if lastErr != nil {
		return dtos.GenerateAIWorkoutResponse{}, lastErr
	}

	return dtos.GenerateAIWorkoutResponse{}, errors.New("nao foi possivel gerar o treino automaticamente")
}

func (s *AIWorkoutService) requestWorkoutPlanAttempt(ctx context.Context, input dtos.GenerateAIWorkoutRequest, catalogMachines []models.Machine, catalogByID map[string]models.Machine, previousErr error) (dtos.GenerateAIWorkoutResponse, error) {
	payload := openAIChatCompletionRequest{
		Model:    s.model,
		Messages: buildAIWorkoutMessages(input, catalogMachines, previousErr),
		ResponseFormat: &openAIChatCompletionResponseFormat{
			Type: "json_schema",
			JSONSchema: &openAIChatCompletionJSONSchema{
				Name:   aiWorkoutResponseSchemaID,
				Strict: true,
				Schema: buildAIWorkoutResponseSchema(input.SelectedDays, catalogMachines),
			},
		},
		Temperature: 0.3,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return dtos.GenerateAIWorkoutResponse{}, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, openAIChatCompletionsURL, bytes.NewReader(body))
	if err != nil {
		return dtos.GenerateAIWorkoutResponse{}, err
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		if requestErr := mapAIWorkoutRequestError(err); requestErr != nil {
			return dtos.GenerateAIWorkoutResponse{}, requestErr
		}

		return dtos.GenerateAIWorkoutResponse{}, errors.New("falha ao conectar com a API da OpenAI")
	}
	defer resp.Body.Close()

	rawBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return dtos.GenerateAIWorkoutResponse{}, err
	}

	if resp.StatusCode >= http.StatusBadRequest {
		return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf("falha na OpenAI: %s", extractOpenAIError(rawBody))
	}

	var completion openAIChatCompletionResponse
	if err := json.Unmarshal(rawBody, &completion); err != nil {
		return dtos.GenerateAIWorkoutResponse{}, errors.New("nao foi possivel interpretar a resposta da OpenAI")
	}

	if refusal := strings.TrimSpace(completion.FirstMessageRefusal()); refusal != "" {
		return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf("a OpenAI recusou a solicitacao: %s", refusal)
	}

	content := strings.TrimSpace(completion.FirstMessageContent())
	if content == "" {
		return dtos.GenerateAIWorkoutResponse{}, &retryableWorkoutError{
			message: "a OpenAI retornou uma resposta vazia",
		}
	}

	var parsed dtos.GenerateAIWorkoutResponse
	if err := json.Unmarshal([]byte(content), &parsed); err != nil {
		return dtos.GenerateAIWorkoutResponse{}, &retryableWorkoutError{
			message: "a OpenAI retornou um JSON invalido",
		}
	}

	if err := validateGeneratedWorkout(parsed, input.SelectedDays, catalogByID); err != nil {
		return dtos.GenerateAIWorkoutResponse{}, &retryableWorkoutError{message: err.Error()}
	}

	return hydrateGeneratedWorkoutWithCatalog(parsed, catalogByID), nil
}

func mapAIWorkoutRequestError(err error) error {
	if err == nil {
		return nil
	}

	if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
		return errors.New("a solicitacao foi cancelada antes de concluir a geracao")
	}

	return nil
}

func buildAIWorkoutPrompt(input dtos.GenerateAIWorkoutRequest, catalogMachines []models.Machine) string {
	intensityMap := map[string]string{
		"leve":     "iniciante, com volumes baixos e foco em aprendizado dos movimentos",
		"moderado": "intermediario, com volume e carga moderados",
		"intenso":  "avancado, com alto volume, cargas pesadas e tecnicas de intensificacao",
	}

	goalMap := map[string]string{
		"hipertrofia":   "ganho de massa muscular (hipertrofia)",
		"forca":         "aumento de forca maxima",
		"resistencia":   "resistencia muscular e cardiovascular",
		"emagrecimento": "emagrecimento com preservacao de massa magra",
	}

	selectedDayNames := buildSelectedDayNames(input.SelectedDays)
	selectedDayIndexes := buildSelectedDayIndexes(input.SelectedDays)

	return strings.Join([]string{
		"Crie um plano de treino de musculacao com as seguintes especificacoes:",
		"",
		fmt.Sprintf("- Altura: %scm", input.Height),
		fmt.Sprintf("- Peso: %skg", input.Weight),
		fmt.Sprintf("- Dias por semana: %d", input.DaysPerWeek),
		fmt.Sprintf("- Dias exatos escolhidos (indices obrigatorios): %s", selectedDayIndexes),
		fmt.Sprintf("- Dias exatos escolhidos (nomes): %s", selectedDayNames),
		fmt.Sprintf("- Tempo desejado por dia: %s", buildOptionalTextLine(input.HoursPerDay, "nao informado")),
		fmt.Sprintf("- Quantidade desejada de maquinas por dia: %s", buildOptionalTextLine(input.MachinesPerDay, "nao informado")),
		fmt.Sprintf("- Modelo de divisao preferido: %s", buildOptionalTextLine(input.WorkoutSplit, "nenhum modelo especifico")),
		fmt.Sprintf("- Intensidade: %s", intensityMap[input.Intensity]),
		fmt.Sprintf("- Objetivo: %s", goalMap[input.Goal]),
		"",
		"Convencao fixa dos dias da semana: 0=domingo, 1=segunda, 2=terca, 3=quarta, 4=quinta, 5=sexta, 6=sabado.",
		"Nao use outra convencao. Segunda-feira nao e 0.",
		"Considere as observacoes personalizadas do usuario abaixo quando fizer a divisao e a escolha dos exercicios.",
		fmt.Sprintf("- Observacoes personalizadas: %s", buildCustomInstructionsLine(input.CustomInstructions)),
		"",
		"Leve em conta o biotipo do usuario (altura e peso) para calibrar as cargas sugeridas.",
		fmt.Sprintf("Distribua os grupos musculares de forma equilibrada entre os %d dias selecionados.", input.DaysPerWeek),
		fmt.Sprintf("Use somente estes indices de dias: %s.", selectedDayIndexes),
		fmt.Sprintf("Todos os dias selecionados precisam aparecer pelo menos uma vez e nenhum outro dia pode aparecer. Dias selecionados: %s.", selectedDayNames),
		"Se o usuario informar tempo por dia, quantidade de maquinas ou um modelo de divisao, respeite essas preferencias quando forem compativeis com o objetivo e os dias disponiveis.",
		"Se houver um modelo de divisao preferido, como ABC, ABCAB ou fullbody, siga esse formato ou a adaptacao mais proxima possivel.",
		"Use exclusivamente maquinas do catalogo oficial abaixo.",
		"Cada exercicio precisa apontar para um catalogMachineId valido e usar o nome oficial correspondente.",
		"Se o exercicio ideal nao existir exatamente no catalogo, escolha a opcao mais proxima dentre as disponiveis.",
		"",
		buildCatalogMachinesPromptBlock(catalogMachines),
		"",
		"Para cada dia, liste exercicios de musculacao com peso sugerido para 3 series em kg.",
		"Responda somente com os campos do schema fornecido, sem markdown e sem explicacoes.",
		"",
		"Formato obrigatorio:",
		`{"categories":[{"name":"Nome do grupo","days":[1,4],"machines":[{"catalogMachineId":"mach000000000001","name":"Nome oficial do catalogo","sets":[40,35,30]}]}]}`,
		"",
		"Regras:",
		"- Os dias devem ser numeros de 0 a 6.",
		"- Cada exercicio precisa informar um catalogMachineId presente no catalogo permitido.",
		"- O campo name deve repetir o nome oficial do catalogo correspondente ao catalogMachineId.",
		"- Cada exercicio precisa ter exatamente 3 pesos em kg.",
		"- Nao repita dias fora da faixa 0-6.",
		"- Nao inclua texto fora do JSON.",
	}, "\n")
}

func buildCatalogMachinesPromptBlock(catalogMachines []models.Machine) string {
	if len(catalogMachines) == 0 {
		return "Catalogo permitido: nenhum equipamento disponivel."
	}

	lines := []string{"Catalogo permitido por categoria:"}
	currentCategory := ""

	for _, machine := range catalogMachines {
		categoryKey := strings.TrimSpace(machine.CategoryKey)
		if categoryKey != currentCategory {
			lines = append(lines, fmt.Sprintf("%s:", strings.ToUpper(categoryKey)))
			currentCategory = categoryKey
		}

		aliasText := ""
		if len(machine.Aliases) > 0 {
			aliasText = fmt.Sprintf(" | aliases: %s", strings.Join(machine.Aliases, ", "))
		}

		lines = append(lines, fmt.Sprintf("- %s | %s%s", machine.ID, machine.Name, aliasText))
	}

	return strings.Join(lines, "\n")
}

func buildCustomInstructionsLine(value string) string {
	return buildOptionalTextLine(value, "nenhuma")
}

func buildOptionalTextLine(value, fallback string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return fallback
	}

	return trimmed
}

func buildSelectedDayNames(days []int) string {
	dayNames := map[int]string{
		0: "domingo",
		1: "segunda",
		2: "terca",
		3: "quarta",
		4: "quinta",
		5: "sexta",
		6: "sabado",
	}

	labels := make([]string, 0, len(days))
	for _, day := range days {
		label, ok := dayNames[day]
		if !ok {
			continue
		}

		labels = append(labels, label)
	}

	if len(labels) == 0 {
		return "nenhum dia valido informado"
	}

	return strings.Join(labels, ", ")
}

func buildSelectedDayIndexes(days []int) string {
	indexes := make([]string, 0, len(days))
	for _, day := range days {
		indexes = append(indexes, fmt.Sprintf("%d", day))
	}

	return "[" + strings.Join(indexes, ", ") + "]"
}

func buildCatalogMachineLookup(catalogMachines []models.Machine) map[string]models.Machine {
	lookup := make(map[string]models.Machine, len(catalogMachines))

	for _, machine := range catalogMachines {
		lookup[machine.ID] = machine
	}

	return lookup
}

func hydrateGeneratedWorkoutWithCatalog(response dtos.GenerateAIWorkoutResponse, catalogByID map[string]models.Machine) dtos.GenerateAIWorkoutResponse {
	hydrated := dtos.GenerateAIWorkoutResponse{
		Categories:       make([]dtos.GeneratedCategory, 0, len(response.Categories)),
		RemainingCredits: response.RemainingCredits,
	}

	for _, category := range response.Categories {
		hydratedCategory := dtos.GeneratedCategory{
			Name:     category.Name,
			Days:     append([]int(nil), category.Days...),
			Machines: make([]dtos.GeneratedMachine, 0, len(category.Machines)),
		}

		for _, machine := range category.Machines {
			hydratedMachine := dtos.GeneratedMachine{
				CatalogMachineID: strings.TrimSpace(machine.CatalogMachineID),
				Sets:             append([]float64(nil), machine.Sets...),
			}

			if catalogMachine, ok := catalogByID[hydratedMachine.CatalogMachineID]; ok {
				hydratedMachine.Name = catalogMachine.Name
			} else {
				hydratedMachine.Name = strings.TrimSpace(machine.Name)
			}

			hydratedCategory.Machines = append(hydratedCategory.Machines, hydratedMachine)
		}

		hydrated.Categories = append(hydrated.Categories, hydratedCategory)
	}

	return hydrated
}

func buildGeneratedWorkoutInputs(response dtos.GenerateAIWorkoutResponse, catalogByID map[string]models.Machine) []ReplaceWorkoutInput {
	workouts := make([]ReplaceWorkoutInput, 0, len(response.Categories))

	for _, category := range response.Categories {
		machines := make([]CreateWorkoutMachineInput, 0, len(category.Machines))

		for _, machine := range category.Machines {
			catalogMachine, ok := catalogByID[strings.TrimSpace(machine.CatalogMachineID)]
			if !ok {
				continue
			}

			machines = append(machines, CreateWorkoutMachineInput{
				CatalogMachineID: catalogMachine.ID,
				Description:      buildGeneratedMachineDescription(category.Name, machine.Sets),
			})
		}

		workouts = append(workouts, ReplaceWorkoutInput{
			Title:       strings.TrimSpace(category.Name),
			Description: buildGeneratedWorkoutDescription(category.Days),
			Machines:    machines,
		})
	}

	return workouts
}

func buildGeneratedWeekInputs(response dtos.GenerateAIWorkoutResponse, catalogByID map[string]models.Machine) map[int][]CreateWorkoutMachineInput {
	generatedDays := make(map[int][]CreateWorkoutMachineInput, 7)

	for dayIndex := 0; dayIndex < 7; dayIndex++ {
		generatedDays[dayIndex] = []CreateWorkoutMachineInput{}
	}

	for _, category := range response.Categories {
		for _, dayIndex := range category.Days {
			if dayIndex < 0 || dayIndex > 6 {
				continue
			}

			for _, machine := range category.Machines {
				catalogMachine, ok := catalogByID[strings.TrimSpace(machine.CatalogMachineID)]
				if !ok {
					continue
				}

				generatedDays[dayIndex] = append(generatedDays[dayIndex], CreateWorkoutMachineInput{
					CatalogMachineID: catalogMachine.ID,
					Description:      buildGeneratedMachineDescription(category.Name, machine.Sets),
				})
			}
		}
	}

	return generatedDays
}

func buildGeneratedWorkoutDescription(days []int) string {
	labels := buildSelectedDayNames(days)
	if strings.TrimSpace(labels) == "" || labels == "nenhum dia valido informado" {
		return "Gerado automaticamente por IA"
	}

	return fmt.Sprintf("Gerado automaticamente por IA. Dias sugeridos anteriormente: %s", labels)
}

func buildGeneratedMachineDescription(categoryName string, sets []float64) string {
	formattedSets := make([]string, 0, len(sets))
	for _, weight := range sets {
		formattedSets = append(formattedSets, strconv.FormatFloat(weight, 'f', -1, 64))
	}

	return fmt.Sprintf(
		"%s - Series sugeridas (kg): %s",
		strings.TrimSpace(categoryName),
		strings.Join(formattedSets, " / "),
	)
}

func inferGeneratedMachineCategoryKey(categoryName, machineName string) string {
	categoryAliases := map[string][]string{
		"peito":   {"peito", "supino", "crucifixo", "chest", "peitoral"},
		"costas":  {"costas", "remada", "puxada", "barra", "pulldown", "rowing", "back"},
		"pernas":  {"perna", "pernas", "quadriceps", "posterior", "gluteo", "gluteos", "leg", "panturrilha", "agachamento", "cadeira", "mesa flexora"},
		"ombros":  {"ombro", "ombros", "shoulder", "desenvolvimento", "elevacao lateral"},
		"biceps":  {"biceps", "rosca", "curl"},
		"triceps": {"triceps", "corda", "testa", "pulley"},
		"core":    {"core", "abdomen", "abdominal", "prancha", "lombar"},
		"cardio":  {"cardio", "esteira", "bike", "bicicleta", "eliptico", "corrida"},
	}

	haystack := normalizeGeneratedWorkoutText(categoryName + " " + machineName)

	for categoryKey, aliases := range categoryAliases {
		for _, alias := range aliases {
			if strings.Contains(haystack, normalizeGeneratedWorkoutText(alias)) {
				return categoryKey
			}
		}
	}

	return "peito"
}

func normalizeGeneratedWorkoutText(value string) string {
	replacer := strings.NewReplacer(
		"á", "a",
		"à", "a",
		"ã", "a",
		"â", "a",
		"ä", "a",
		"é", "e",
		"è", "e",
		"ê", "e",
		"ë", "e",
		"í", "i",
		"ì", "i",
		"î", "i",
		"ï", "i",
		"ó", "o",
		"ò", "o",
		"õ", "o",
		"ô", "o",
		"ö", "o",
		"ú", "u",
		"ù", "u",
		"û", "u",
		"ü", "u",
		"ç", "c",
	)

	return strings.ToLower(replacer.Replace(strings.TrimSpace(value)))
}

func validateGeneratedWorkout(response dtos.GenerateAIWorkoutResponse, allowedDays []int, catalogByID map[string]models.Machine) error {
	allowedDaySet := make(map[int]struct{}, len(allowedDays))
	seenDaySet := make(map[int]struct{}, len(allowedDays))
	for _, day := range allowedDays {
		allowedDaySet[day] = struct{}{}
	}

	for _, category := range response.Categories {
		if strings.TrimSpace(category.Name) == "" {
			return errors.New("a IA retornou uma categoria sem nome")
		}

		if len(category.Days) == 0 {
			return errors.New("a IA retornou uma categoria sem dias de treino")
		}

		categoryDaySet := make(map[int]struct{}, len(category.Days))
		for _, day := range category.Days {
			if day < 0 || day > 6 {
				return errors.New("a IA retornou um dia de treino fora do intervalo permitido")
			}

			if _, ok := allowedDaySet[day]; !ok {
				return fmt.Errorf(
					"a IA retornou um dia fora da selecao informada pelo usuario: %s. Dias permitidos: %s",
					buildSelectedDayNames([]int{day}),
					buildSelectedDayNames(allowedDays),
				)
			}

			if _, ok := categoryDaySet[day]; ok {
				return fmt.Errorf(
					"a IA retornou dias duplicados na categoria %q: %s",
					category.Name,
					buildSelectedDayNames([]int{day}),
				)
			}

			categoryDaySet[day] = struct{}{}
			seenDaySet[day] = struct{}{}
		}

		if len(category.Machines) == 0 {
			return errors.New("a IA retornou uma categoria sem exercicios")
		}

		categoryMachineSet := make(map[string]struct{}, len(category.Machines))
		for _, machine := range category.Machines {
			catalogMachineID := strings.TrimSpace(machine.CatalogMachineID)
			if catalogMachineID == "" {
				return errors.New("a IA retornou um exercicio sem catalogMachineId")
			}

			if _, ok := catalogByID[catalogMachineID]; !ok {
				return fmt.Errorf("a IA retornou uma maquina fora do catalogo permitido: %s", catalogMachineID)
			}

			if strings.TrimSpace(machine.Name) == "" {
				return errors.New("a IA retornou um exercicio sem nome")
			}

			if _, ok := categoryMachineSet[catalogMachineID]; ok {
				return fmt.Errorf(
					"a IA retornou maquinas duplicadas na categoria %q: %s",
					category.Name,
					catalogMachineID,
				)
			}
			categoryMachineSet[catalogMachineID] = struct{}{}

			if len(machine.Sets) != 3 {
				return errors.New("a IA retornou um exercicio sem 3 series")
			}
		}
	}

	missingDays := make([]int, 0, len(allowedDays))
	for _, day := range allowedDays {
		if _, ok := seenDaySet[day]; ok {
			continue
		}

		missingDays = append(missingDays, day)
	}

	if len(missingDays) > 0 {
		return fmt.Errorf(
			"a IA nao distribuiu treino para todos os dias escolhidos. Dias sem treino: %s",
			buildSelectedDayNames(missingDays),
		)
	}

	return nil
}

func buildAIWorkoutMessages(input dtos.GenerateAIWorkoutRequest, catalogMachines []models.Machine, previousErr error) []openAIChatCompletionMessage {
	messages := []openAIChatCompletionMessage{
		{
			Role: "system",
			Content: strings.Join([]string{
				"Voce e um personal trainer especialista em musculacao.",
				"Siga rigorosamente o schema de resposta fornecido.",
				"Use obrigatoriamente a convencao de dias 0=domingo, 1=segunda, 2=terca, 3=quarta, 4=quinta, 5=sexta, 6=sabado.",
				"Use somente maquinas do catalogo informado pelo usuario e sempre devolva catalogMachineId valido.",
			}, "\n"),
		},
		{
			Role:    "user",
			Content: buildAIWorkoutPrompt(input, catalogMachines),
		},
	}

	if previousErr == nil {
		return messages
	}

	messages = append(messages, openAIChatCompletionMessage{
		Role: "user",
		Content: strings.Join([]string{
			"A tentativa anterior foi rejeitada.",
			fmt.Sprintf("Erro encontrado: %s.", previousErr.Error()),
			fmt.Sprintf("Corrija o treino usando somente os dias permitidos: %s.", buildSelectedDayIndexes(input.SelectedDays)),
			"Use apenas catalogMachineId presentes no catalogo permitido.",
			"Garanta que todos os dias escolhidos aparecam pelo menos uma vez nas categorias.",
			"Reescreva a resposta inteira no schema correto.",
		}, "\n"),
	})

	return messages
}

func buildAIWorkoutResponseSchema(allowedDays []int, catalogMachines []models.Machine) map[string]any {
	dayEnum := make([]int, 0, len(allowedDays))
	for _, day := range allowedDays {
		dayEnum = append(dayEnum, day)
	}

	catalogMachineIDs := make([]string, 0, len(catalogMachines))
	for _, machine := range catalogMachines {
		catalogMachineIDs = append(catalogMachineIDs, machine.ID)
	}

	return map[string]any{
		"type":                 "object",
		"additionalProperties": false,
		"required":             []string{"categories"},
		"properties": map[string]any{
			"categories": map[string]any{
				"type":     "array",
				"minItems": 1,
				"items": map[string]any{
					"type":                 "object",
					"additionalProperties": false,
					"required":             []string{"name", "days", "machines"},
					"properties": map[string]any{
						"name": map[string]any{
							"type":      "string",
							"minLength": 1,
						},
						"days": map[string]any{
							"type":     "array",
							"minItems": 1,
							"maxItems": len(allowedDays),
							"items": map[string]any{
								"type": "integer",
								"enum": dayEnum,
							},
						},
						"machines": map[string]any{
							"type":     "array",
							"minItems": 1,
							"items": map[string]any{
								"type":                 "object",
								"additionalProperties": false,
								"required":             []string{"catalogMachineId", "name", "sets"},
								"properties": map[string]any{
									"catalogMachineId": map[string]any{
										"type": "string",
										"enum": catalogMachineIDs,
									},
									"name": map[string]any{
										"type":      "string",
										"minLength": 1,
									},
									"sets": map[string]any{
										"type":     "array",
										"minItems": 3,
										"maxItems": 3,
										"items": map[string]any{
											"type":    "number",
											"minimum": 0,
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}
}

func normalizeSelectedDays(days []int) ([]int, error) {
	if len(days) == 0 {
		return nil, errors.New("informe ao menos um dia para gerar o treino")
	}

	uniqueDays := make(map[int]struct{}, len(days))
	normalized := make([]int, 0, len(days))

	for _, day := range days {
		if day < 0 || day > 6 {
			return nil, errors.New("foi informado um dia invalido para a geracao do treino")
		}

		if _, exists := uniqueDays[day]; exists {
			continue
		}

		uniqueDays[day] = struct{}{}
		normalized = append(normalized, day)
	}

	sort.Ints(normalized)

	return normalized, nil
}

type retryableWorkoutError struct {
	message string
}

func (e *retryableWorkoutError) Error() string {
	return e.message
}

func isRetryableWorkoutError(err error) bool {
	var target *retryableWorkoutError
	return errors.As(err, &target)
}

type openAIChatCompletionResponse struct {
	Choices []struct {
		Message openAIChatCompletionResponseMessage `json:"message"`
	} `json:"choices"`
}

func (r openAIChatCompletionResponse) FirstMessageContent() string {
	if len(r.Choices) == 0 {
		return ""
	}

	return r.Choices[0].Message.Content
}

func (r openAIChatCompletionResponse) FirstMessageRefusal() string {
	if len(r.Choices) == 0 {
		return ""
	}

	return r.Choices[0].Message.Refusal
}

type openAIChatCompletionRequest struct {
	Model          string                              `json:"model"`
	Messages       []openAIChatCompletionMessage       `json:"messages"`
	ResponseFormat *openAIChatCompletionResponseFormat `json:"response_format,omitempty"`
	Temperature    float64                             `json:"temperature,omitempty"`
}

type openAIChatCompletionMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIChatCompletionResponseFormat struct {
	Type       string                          `json:"type"`
	JSONSchema *openAIChatCompletionJSONSchema `json:"json_schema,omitempty"`
}

type openAIChatCompletionJSONSchema struct {
	Name   string         `json:"name"`
	Strict bool           `json:"strict"`
	Schema map[string]any `json:"schema"`
}

type openAIChatCompletionResponseMessage struct {
	Content string `json:"content"`
	Refusal string `json:"refusal"`
}

func extractOpenAIError(body []byte) string {
	var parsed struct {
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(body, &parsed); err == nil && strings.TrimSpace(parsed.Error.Message) != "" {
		return parsed.Error.Message
	}

	message := strings.TrimSpace(string(body))
	if message == "" {
		return "erro desconhecido"
	}

	return message
}
