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
	defaultAIWorkoutModel          = "gpt-4.1-mini"
	defaultAssumedMachinesPerDay   = 6
	averageMinutesPerMachine       = 10
	openAIChatCompletionsURL       = "https://api.openai.com/v1/chat/completions"
	aiWorkoutGenerationTries       = 2
	aiWorkoutMaxToolRounds         = 6
	aiWorkoutSearchToolName        = "search_catalog_machines"
	aiWorkoutSubmitToolName        = "submit_workout_plan"
	aiWorkoutSearchDefaultLimit    = 6
	aiWorkoutSearchMaxLimit        = 12
	aiWorkoutToolChoiceRequired    = "required"
	aiWorkoutGenerationTemperature = 0.2
	generatedWorkoutDescription    = "Gerado automaticamente por IA"
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

	input = normalizeAIWorkoutRequest(input)

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
	messages := buildAIWorkoutMessages(input, previousErr)
	surfacedCatalogByID := make(map[string]models.Machine)

	for round := 0; round < aiWorkoutMaxToolRounds; round++ {
		if err := mapAIWorkoutRequestError(ctx.Err()); err != nil {
			return dtos.GenerateAIWorkoutResponse{}, err
		}

		completion, err := s.createOpenAIChatCompletion(ctx, openAIChatCompletionRequest{
			Model:       s.model,
			Messages:    messages,
			Tools:       buildAIWorkoutTools(surfacedCatalogByID, input.DaysPerWeek),
			ToolChoice:  aiWorkoutToolChoiceRequired,
			Temperature: aiWorkoutGenerationTemperature,
		})
		if err != nil {
			if requestErr := mapAIWorkoutRequestError(err); requestErr != nil {
				return dtos.GenerateAIWorkoutResponse{}, requestErr
			}

			return dtos.GenerateAIWorkoutResponse{}, err
		}

		if refusal := strings.TrimSpace(completion.FirstMessageRefusal()); refusal != "" {
			return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf("a OpenAI recusou a solicitacao: %s", refusal)
		}

		message := completion.FirstMessage()
		if len(message.ToolCalls) == 0 {
			return dtos.GenerateAIWorkoutResponse{}, &retryableWorkoutError{
				message: "a OpenAI nao retornou chamadas de ferramenta",
			}
		}

		assistantMessage := openAIChatCompletionMessage{
			Role:      "assistant",
			Content:   strings.TrimSpace(message.Content),
			ToolCalls: message.ToolCalls,
		}
		messages = append(messages, assistantMessage)

		for _, toolCall := range message.ToolCalls {
			switch toolCall.Function.Name {
			case aiWorkoutSearchToolName:
				toolOutput, surfacedMachines := handleAIWorkoutCatalogSearch(toolCall.Function.Arguments, catalogMachines)
				for _, machine := range surfacedMachines {
					surfacedCatalogByID[machine.ID] = machine
				}

				messages = append(messages, openAIChatCompletionMessage{
					Role:       "tool",
					ToolCallID: toolCall.ID,
					Content:    toolOutput,
				})
			case aiWorkoutSubmitToolName:
				parsed, err := parseAIWorkoutSubmission(toolCall.Function.Arguments)
				if err != nil {
					messages = append(messages, openAIChatCompletionMessage{
						Role:       "tool",
						ToolCallID: toolCall.ID,
						Content:    buildAIWorkoutToolErrorOutput("os argumentos enviados para submit_workout_plan nao formam um JSON valido"),
					})
					continue
				}

				if err := validateGeneratedWorkout(parsed, surfacedCatalogByID, input.DaysPerWeek); err != nil {
					messages = append(messages, openAIChatCompletionMessage{
						Role:       "tool",
						ToolCallID: toolCall.ID,
						Content:    buildAIWorkoutToolErrorOutput(err.Error()),
					})
					continue
				}

				return hydrateGeneratedWorkoutWithCatalog(parsed, catalogByID), nil
			default:
				messages = append(messages, openAIChatCompletionMessage{
					Role:       "tool",
					ToolCallID: toolCall.ID,
					Content:    buildAIWorkoutToolErrorOutput("ferramenta desconhecida"),
				})
			}
		}
	}

	return dtos.GenerateAIWorkoutResponse{}, &retryableWorkoutError{
		message: "a OpenAI nao conseguiu concluir a geracao do treino com as ferramentas disponiveis",
	}
}

func (s *AIWorkoutService) createOpenAIChatCompletion(ctx context.Context, payload openAIChatCompletionRequest) (openAIChatCompletionResponse, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return openAIChatCompletionResponse{}, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, openAIChatCompletionsURL, bytes.NewReader(body))
	if err != nil {
		return openAIChatCompletionResponse{}, err
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return openAIChatCompletionResponse{}, errors.New("falha ao conectar com a API da OpenAI")
	}
	defer resp.Body.Close()

	rawBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return openAIChatCompletionResponse{}, err
	}

	if resp.StatusCode >= http.StatusBadRequest {
		return openAIChatCompletionResponse{}, fmt.Errorf("falha na OpenAI: %s", extractOpenAIError(rawBody))
	}

	var completion openAIChatCompletionResponse
	if err := json.Unmarshal(rawBody, &completion); err != nil {
		return openAIChatCompletionResponse{}, errors.New("nao foi possivel interpretar a resposta da OpenAI")
	}

	return completion, nil
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

func buildAIWorkoutPrompt(input dtos.GenerateAIWorkoutRequest) string {
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
		fmt.Sprintf("- Tempo desejado por dia (em horas): %s", buildOptionalTextLine(input.HoursPerDay, "nao informado")),
		buildMachinesPerDayPromptLine(input),
		fmt.Sprintf("- Modelo de divisao preferido: %s", buildOptionalTextLine(input.WorkoutSplit, "nenhum modelo especifico")),
		fmt.Sprintf("- Intensidade: %s", intensityMap[input.Intensity]),
		fmt.Sprintf("- Objetivo: %s", goalMap[input.Goal]),
		"",
		"Convencao fixa dos dias da semana: 0=domingo, 1=segunda, 2=terca, 3=quarta, 4=quinta, 5=sexta, 6=sabado.",
		"Nao use outra convencao. Segunda-feira nao e 0.",
		"Considere as observacoes personalizadas do usuario abaixo quando fizer a divisao e a escolha dos exercicios.",
		fmt.Sprintf("- Observacoes personalizadas: %s", buildOptionalTextLine(input.CustomInstructions, "nenhuma")),
		"",
		"Leve em conta o biotipo do usuario (altura e peso) para calibrar as cargas sugeridas.",
		fmt.Sprintf("Distribua os grupos musculares de forma equilibrada entre os %d dias selecionados.", input.DaysPerWeek),
		fmt.Sprintf("Use os dias escolhidos %s apenas para decidir volume, recuperacao e divisao do treino.", selectedDayNames),
		fmt.Sprintf("Use somente estes indices de dias para interpretar a disponibilidade semanal do usuario: %s.", selectedDayIndexes),
		fmt.Sprintf("Retorne exatamente %d treinos, um para cada dia selecionado.", input.DaysPerWeek),
		"Cada item do campo categories representa um treino completo, nao um grupo muscular isolado.",
		"O modelo de divisao preferido, como ABC, deve orientar a organizacao desses treinos, mas nunca aumentar ou reduzir a quantidade total de treinos.",
		"Se o usuario informar tempo por dia, quantidade de maquinas ou um modelo de divisao, respeite essas preferencias quando forem compativeis com o objetivo e os dias disponiveis.",
		buildMachinesPerDayPromptInstruction(input),
		"Se houver um modelo de divisao preferido, como ABC, ABCAB ou fullbody, siga esse formato ou a adaptacao mais proxima possivel.",
		"Categorias disponiveis no catalogo: peito, costas, pernas, ombros, biceps, triceps, core, cardio.",
		"Antes de montar o treino, consulte a ferramenta search_catalog_machines em buscas pequenas e direcionadas.",
		"Use exclusivamente catalogMachineId retornados pela ferramenta.",
		"Cada exercicio precisa apontar para um catalogMachineId valido retornado pela ferramenta.",
		"Se o exercicio ideal nao existir exatamente no catalogo, escolha a opcao mais proxima dentre as retornadas pela ferramenta.",
		"Quando concluir, finalize chamando a ferramenta submit_workout_plan.",
		"Nao inclua dias na resposta final nem crie treinos extras fora dos dias disponiveis.",
		"",
		fmt.Sprintf("No campo categories, monte exatamente %d treinos personalizados e atribua exercicios de musculacao com peso sugerido para 3 series em kg.", input.DaysPerWeek),
		"Cada exercicio precisa ter exatamente 3 pesos em kg.",
	}, "\n")
}

func buildOptionalTextLine(value, fallback string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return fallback
	}

	return trimmed
}

func normalizeAIWorkoutRequest(input dtos.GenerateAIWorkoutRequest) dtos.GenerateAIWorkoutRequest {
	input.Height = strings.TrimSpace(input.Height)
	input.Weight = strings.TrimSpace(input.Weight)
	input.HoursPerDay = strings.TrimSpace(input.HoursPerDay)
	input.MachinesPerDay = strings.TrimSpace(input.MachinesPerDay)
	input.WorkoutSplit = strings.TrimSpace(input.WorkoutSplit)
	input.Intensity = strings.TrimSpace(input.Intensity)
	input.Goal = strings.TrimSpace(input.Goal)
	input.CustomInstructions = strings.TrimSpace(input.CustomInstructions)

	return input
}

func buildMachinesPerDayPromptLine(input dtos.GenerateAIWorkoutRequest) string {
	machinesPerDay := strings.TrimSpace(input.MachinesPerDay)
	if parsedMachinesPerDay, ok := parseOptionalFloat(machinesPerDay); ok {
		if estimatedMachines, hasHours := estimateMachinesPerDayFromHours(input.HoursPerDay); hasHours {
			averageMachines := (parsedMachinesPerDay + estimatedMachines) / 2

			return fmt.Sprintf(
				"- Quantidade desejada de maquinas por dia: %s. O tempo informado sugere cerca de %s maquinas por dia, considerando %d minutos por maquina (3 series). Use uma media entre os dois valores, cerca de %s maquinas por dia.",
				machinesPerDay,
				strconv.FormatFloat(estimatedMachines, 'f', -1, 64),
				averageMinutesPerMachine,
				strconv.FormatFloat(averageMachines, 'f', -1, 64),
			)
		}

		return fmt.Sprintf("- Quantidade desejada de maquinas por dia: %s", machinesPerDay)
	}

	if machinesPerDay != "" {
		return fmt.Sprintf("- Quantidade desejada de maquinas por dia: %s", machinesPerDay)
	}

	if estimatedMachines, ok := estimateMachinesPerDayFromHours(input.HoursPerDay); ok {
		return fmt.Sprintf(
			"- Quantidade desejada de maquinas por dia: nao informada; estime usando 1 maquina a cada %d minutos de treino (3 series). Isso equivale a cerca de %s maquinas por dia.",
			averageMinutesPerMachine,
			strconv.FormatFloat(estimatedMachines, 'f', -1, 64),
		)
	}

	return fmt.Sprintf(
		"- Quantidade desejada de maquinas por dia: nao informada; sem tempo nem quantidade informados, assuma %d maquinas por dia.",
		defaultAssumedMachinesPerDay,
	)
}

func buildMachinesPerDayPromptInstruction(input dtos.GenerateAIWorkoutRequest) string {
	machinesPerDay := strings.TrimSpace(input.MachinesPerDay)
	if parsedMachinesPerDay, ok := parseOptionalFloat(machinesPerDay); ok {
		if estimatedMachines, hasHours := estimateMachinesPerDayFromHours(input.HoursPerDay); hasHours {
			averageMachines := (parsedMachinesPerDay + estimatedMachines) / 2

			return fmt.Sprintf(
				"Como o usuario informou tempo e quantidade de maquinas, compare a quantidade informada com a estimativa derivada do tempo usando 1 maquina a cada %d minutos, e trabalhe com uma media entre os dois sinais, em torno de %s maquinas por dia.",
				averageMinutesPerMachine,
				strconv.FormatFloat(averageMachines, 'f', -1, 64),
			)
		}

		return "Como o usuario informou a quantidade de maquinas por dia, respeite esse numero como preferencia principal."
	}

	if machinesPerDay != "" {
		return "Como o usuario informou a quantidade de maquinas por dia, respeite esse numero como preferencia principal."
	}

	if _, ok := estimateMachinesPerDayFromHours(input.HoursPerDay); ok {
		return fmt.Sprintf(
			"Como o usuario nao informou a quantidade de maquinas, estime esse volume a partir do tempo desejado por dia, usando 1 maquina a cada %d minutos para completar 3 series.",
			averageMinutesPerMachine,
		)
	}

	return fmt.Sprintf(
		"Como o usuario nao informou nem tempo nem quantidade de maquinas, assuma %d maquinas por dia como referencia padrao.",
		defaultAssumedMachinesPerDay,
	)
}

func estimateMachinesPerDayFromHours(hoursPerDay string) (float64, bool) {
	parsedHours, ok := parseOptionalFloat(hoursPerDay)
	if !ok || parsedHours <= 0 {
		return 0, false
	}

	return (parsedHours * 60) / averageMinutesPerMachine, true
}

func parseOptionalFloat(value string) (float64, bool) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return 0, false
	}

	parsed, err := strconv.ParseFloat(strings.ReplaceAll(trimmed, ",", "."), 64)
	if err != nil {
		return 0, false
	}

	return parsed, true
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
			Description: generatedWorkoutDescription,
			Machines:    machines,
		})
	}

	return workouts
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

func validateGeneratedWorkout(response dtos.GenerateAIWorkoutResponse, catalogByID map[string]models.Machine, expectedWorkoutCount int) error {
	if expectedWorkoutCount > 0 && len(response.Categories) != expectedWorkoutCount {
		return fmt.Errorf(
			"a IA deve retornar exatamente %d treinos, mas retornou %d",
			expectedWorkoutCount,
			len(response.Categories),
		)
	}

	for _, category := range response.Categories {
		if strings.TrimSpace(category.Name) == "" {
			return errors.New("a IA retornou uma categoria sem nome")
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

	return nil
}

func buildAIWorkoutMessages(input dtos.GenerateAIWorkoutRequest, previousErr error) []openAIChatCompletionMessage {
	messages := []openAIChatCompletionMessage{
		{
			Role: "system",
			Content: strings.Join([]string{
				"Voce e um personal trainer especialista em musculacao.",
				"Use obrigatoriamente a convencao de dias 0=domingo, 1=segunda, 2=terca, 3=quarta, 4=quinta, 5=sexta, 6=sabado ao interpretar a disponibilidade do usuario.",
				"A quantidade de itens enviados no campo categories deve ser exatamente igual a quantidade de dias selecionados pelo usuario.",
				"Cada item de categories representa um treino completo, nao um grupo muscular isolado.",
				"Busque maquinas apenas com a ferramenta search_catalog_machines.",
				"Finalize sempre chamando a ferramenta submit_workout_plan.",
			}, "\n"),
		},
		{
			Role:    "user",
			Content: buildAIWorkoutPrompt(input),
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
			"Consulte novamente a ferramenta search_catalog_machines se precisar de mais opcoes.",
			"Use apenas catalogMachineId retornados pela ferramenta.",
			"Reenvie o treino final chamando submit_workout_plan.",
		}, "\n"),
	})

	return messages
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

func (r openAIChatCompletionResponse) FirstMessage() openAIChatCompletionResponseMessage {
	if len(r.Choices) == 0 {
		return openAIChatCompletionResponseMessage{}
	}

	return r.Choices[0].Message
}

type openAIChatCompletionRequest struct {
	Model       string                        `json:"model"`
	Messages    []openAIChatCompletionMessage `json:"messages"`
	Tools       []openAIChatCompletionTool    `json:"tools,omitempty"`
	ToolChoice  string                        `json:"tool_choice,omitempty"`
	Temperature float64                       `json:"temperature,omitempty"`
}

type openAIChatCompletionMessage struct {
	Role       string                         `json:"role"`
	Content    string                         `json:"content,omitempty"`
	ToolCallID string                         `json:"tool_call_id,omitempty"`
	ToolCalls  []openAIChatCompletionToolCall `json:"tool_calls,omitempty"`
}

type openAIChatCompletionTool struct {
	Type     string                           `json:"type"`
	Function openAIChatCompletionToolFunction `json:"function"`
}

type openAIChatCompletionToolFunction struct {
	Name        string         `json:"name"`
	Description string         `json:"description,omitempty"`
	Parameters  map[string]any `json:"parameters,omitempty"`
	Strict      bool           `json:"strict,omitempty"`
}

type openAIChatCompletionResponseMessage struct {
	Content   string                         `json:"content"`
	Refusal   string                         `json:"refusal"`
	ToolCalls []openAIChatCompletionToolCall `json:"tool_calls,omitempty"`
}

type openAIChatCompletionToolCall struct {
	ID       string                             `json:"id"`
	Type     string                             `json:"type"`
	Function openAIChatCompletionToolCallTarget `json:"function"`
}

type openAIChatCompletionToolCallTarget struct {
	Name      string `json:"name"`
	Arguments string `json:"arguments"`
}

type aiWorkoutCatalogSearchArgs struct {
	CategoryKeys []string `json:"categoryKeys,omitempty"`
	Query        string   `json:"query,omitempty"`
	Limit        int      `json:"limit,omitempty"`
}

type aiWorkoutCatalogSearchResponse struct {
	Machines []aiWorkoutCatalogMachineSummary `json:"machines,omitempty"`
	Error    string                           `json:"error,omitempty"`
}

type aiWorkoutCatalogMachineSummary struct {
	CatalogMachineID string   `json:"catalogMachineId"`
	Name             string   `json:"name"`
	CategoryKey      string   `json:"categoryKey"`
	Aliases          []string `json:"aliases,omitempty"`
}

func (r openAIChatCompletionResponse) FirstMessageRefusal() string {
	return r.FirstMessage().Refusal
}

func buildAIWorkoutTools(surfacedCatalogByID map[string]models.Machine, expectedWorkoutCount int) []openAIChatCompletionTool {
	tools := []openAIChatCompletionTool{
		{
			Type: "function",
			Function: openAIChatCompletionToolFunction{
				Name:        aiWorkoutSearchToolName,
				Description: "Busca um subconjunto pequeno de maquinas do catalogo oficial para montar o treino.",
				Strict:      true,
				Parameters:  buildAIWorkoutSearchToolSchema(),
			},
		},
	}

	if len(surfacedCatalogByID) == 0 {
		return tools
	}

	tools = append(tools, openAIChatCompletionTool{
		Type: "function",
		Function: openAIChatCompletionToolFunction{
			Name:        aiWorkoutSubmitToolName,
			Description: "Envia o treino final usando apenas catalogMachineId ja retornados pela busca.",
			Strict:      true,
			Parameters:  buildAIWorkoutSubmitToolSchema(surfacedCatalogByID, expectedWorkoutCount),
		},
	})

	return tools
}

func buildAIWorkoutSearchToolSchema() map[string]any {
	return map[string]any{
		"type":                 "object",
		"additionalProperties": false,
		"required":             []string{"categoryKeys", "query", "limit"},
		"properties": map[string]any{
			"categoryKeys": map[string]any{
				"type": "array",
				"items": map[string]any{
					"type": "string",
					"enum": allMachineCategoryKeys(),
				},
			},
			"query": map[string]any{
				"type": "string",
			},
			"limit": map[string]any{
				"type":    "integer",
				"minimum": 1,
				"maximum": aiWorkoutSearchMaxLimit,
			},
		},
	}
}

func buildAIWorkoutSubmitToolSchema(surfacedCatalogByID map[string]models.Machine, expectedWorkoutCount int) map[string]any {
	return map[string]any{
		"type":                 "object",
		"additionalProperties": false,
		"required":             []string{"categories"},
		"properties": map[string]any{
			"categories": map[string]any{
				"type":     "array",
				"minItems": expectedWorkoutCount,
				"maxItems": expectedWorkoutCount,
				"items": map[string]any{
					"type":                 "object",
					"additionalProperties": false,
					"required":             []string{"name", "machines"},
					"properties": map[string]any{
						"name": map[string]any{
							"type":      "string",
							"minLength": 1,
						},
						"machines": map[string]any{
							"type":     "array",
							"minItems": 1,
							"items": map[string]any{
								"type":                 "object",
								"additionalProperties": false,
								"required":             []string{"catalogMachineId", "sets"},
								"properties": map[string]any{
									"catalogMachineId": map[string]any{
										"type": "string",
										"enum": sortedCatalogMachineIDs(surfacedCatalogByID),
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

func handleAIWorkoutCatalogSearch(arguments string, catalogMachines []models.Machine) (string, []models.Machine) {
	args, err := parseAIWorkoutCatalogSearchArgs(arguments)
	if err != nil {
		return buildAIWorkoutToolResponse(aiWorkoutCatalogSearchResponse{
			Error: "os argumentos enviados para search_catalog_machines nao formam um JSON valido",
		}), nil
	}

	machines, err := searchAIWorkoutCatalogMachines(catalogMachines, args)
	if err != nil {
		return buildAIWorkoutToolResponse(aiWorkoutCatalogSearchResponse{Error: err.Error()}), nil
	}

	response := aiWorkoutCatalogSearchResponse{
		Machines: make([]aiWorkoutCatalogMachineSummary, 0, len(machines)),
	}

	for _, machine := range machines {
		response.Machines = append(response.Machines, aiWorkoutCatalogMachineSummary{
			CatalogMachineID: machine.ID,
			Name:             machine.Name,
			CategoryKey:      machine.CategoryKey,
			Aliases:          append([]string(nil), machine.Aliases...),
		})
	}

	return buildAIWorkoutToolResponse(response), machines
}

func parseAIWorkoutCatalogSearchArgs(arguments string) (aiWorkoutCatalogSearchArgs, error) {
	var args aiWorkoutCatalogSearchArgs
	if err := json.Unmarshal([]byte(arguments), &args); err != nil {
		return aiWorkoutCatalogSearchArgs{}, err
	}

	return args, nil
}

func parseAIWorkoutSubmission(arguments string) (dtos.GenerateAIWorkoutResponse, error) {
	var response dtos.GenerateAIWorkoutResponse
	if err := json.Unmarshal([]byte(arguments), &response); err != nil {
		return dtos.GenerateAIWorkoutResponse{}, err
	}

	return response, nil
}

func searchAIWorkoutCatalogMachines(catalogMachines []models.Machine, args aiWorkoutCatalogSearchArgs) ([]models.Machine, error) {
	normalizedQuery := normalizeGeneratedWorkoutText(args.Query)
	categoryFilter, err := normalizeAIWorkoutSearchCategories(args.CategoryKeys)
	if err != nil {
		return nil, err
	}

	if normalizedQuery == "" && len(categoryFilter) == 0 {
		return nil, errors.New("informe ao menos categoryKeys ou query para buscar maquinas")
	}

	limit := args.Limit
	if limit <= 0 {
		limit = aiWorkoutSearchDefaultLimit
	}
	if limit > aiWorkoutSearchMaxLimit {
		limit = aiWorkoutSearchMaxLimit
	}

	type scoredMachine struct {
		machine models.Machine
		score   int
	}

	scored := make([]scoredMachine, 0, len(catalogMachines))
	for _, machine := range catalogMachines {
		if len(categoryFilter) > 0 {
			if _, ok := categoryFilter[strings.TrimSpace(machine.CategoryKey)]; !ok {
				continue
			}
		}

		score := scoreAIWorkoutCatalogMachine(machine, normalizedQuery)
		if normalizedQuery != "" && score == 0 && len(categoryFilter) == 0 {
			continue
		}

		if score == 0 {
			score = 1
		}

		scored = append(scored, scoredMachine{
			machine: machine,
			score:   score,
		})
	}

	if len(scored) == 0 {
		return []models.Machine{}, nil
	}

	sort.SliceStable(scored, func(i, j int) bool {
		if scored[i].score == scored[j].score {
			if scored[i].machine.CategoryKey == scored[j].machine.CategoryKey {
				return scored[i].machine.Name < scored[j].machine.Name
			}

			return scored[i].machine.CategoryKey < scored[j].machine.CategoryKey
		}

		return scored[i].score > scored[j].score
	})

	limit = min(limit, len(scored))
	result := make([]models.Machine, 0, limit)
	for _, candidate := range scored[:limit] {
		result = append(result, candidate.machine)
	}

	return result, nil
}

func normalizeAIWorkoutSearchCategories(values []string) (map[string]struct{}, error) {
	if len(values) == 0 {
		return map[string]struct{}{}, nil
	}

	validCategories := make(map[string]struct{}, len(allMachineCategoryKeys()))
	for _, value := range allMachineCategoryKeys() {
		validCategories[value] = struct{}{}
	}

	filter := make(map[string]struct{}, len(values))
	for _, value := range values {
		categoryKey := strings.TrimSpace(value)
		if _, ok := validCategories[categoryKey]; !ok {
			return nil, fmt.Errorf("categoria de busca invalida: %s", categoryKey)
		}

		filter[categoryKey] = struct{}{}
	}

	return filter, nil
}

func scoreAIWorkoutCatalogMachine(machine models.Machine, normalizedQuery string) int {
	if normalizedQuery == "" {
		return 1
	}

	name := normalizeGeneratedWorkoutText(machine.Name)
	slug := normalizeGeneratedWorkoutText(machine.Slug)
	category := normalizeGeneratedWorkoutText(machine.CategoryKey)
	score := 0

	if strings.Contains(name, normalizedQuery) {
		score += 90
	}
	if slug != "" && strings.Contains(slug, normalizedQuery) {
		score += 70
	}
	if category != "" && strings.Contains(normalizedQuery, category) {
		score += 20
	}

	for _, alias := range machine.Aliases {
		if strings.Contains(normalizeGeneratedWorkoutText(alias), normalizedQuery) {
			score += 60
		}
	}

	for _, token := range strings.Fields(normalizedQuery) {
		if strings.Contains(name, token) {
			score += 18
		}
		if slug != "" && strings.Contains(slug, token) {
			score += 14
		}
		if category != "" && strings.Contains(category, token) {
			score += 6
		}

		for _, alias := range machine.Aliases {
			if strings.Contains(normalizeGeneratedWorkoutText(alias), token) {
				score += 10
				break
			}
		}
	}

	return score
}

func allMachineCategoryKeys() []string {
	return []string{
		string(models.MachineCategoryPeito),
		string(models.MachineCategoryCostas),
		string(models.MachineCategoryPernas),
		string(models.MachineCategoryOmbros),
		string(models.MachineCategoryBiceps),
		string(models.MachineCategoryTriceps),
		string(models.MachineCategoryCore),
		string(models.MachineCategoryCardio),
	}
}

func sortedCatalogMachineIDs(catalogByID map[string]models.Machine) []string {
	ids := make([]string, 0, len(catalogByID))
	for machineID := range catalogByID {
		ids = append(ids, machineID)
	}

	sort.Strings(ids)
	return ids
}

func buildAIWorkoutToolResponse(value any) string {
	raw, err := json.Marshal(value)
	if err != nil {
		return `{"error":"nao foi possivel serializar a resposta da ferramenta"}`
	}

	return string(raw)
}

func buildAIWorkoutToolErrorOutput(message string) string {
	return buildAIWorkoutToolResponse(map[string]string{
		"error": strings.TrimSpace(message),
	})
}

func min(left, right int) int {
	if left < right {
		return left
	}

	return right
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
