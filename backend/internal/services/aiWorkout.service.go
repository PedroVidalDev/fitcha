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
	"log"
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
	knowledge  aiWorkoutKnowledge
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
		knowledge:  mustLoadAIWorkoutKnowledge(),
	}
}

func (s *AIWorkoutService) Generate(ctx context.Context, userID uint, input dtos.GenerateAIWorkoutRequest) (dtos.GenerateAIWorkoutResponse, error) {
	traceID := newAIWorkoutTraceID(userID)
	startedAt := time.Now()

	if s.apiKey == "" {
		logAIWorkoutTrace(traceID, "generate_error", "user_id=%d duration_ms=%d reason=%q", userID, time.Since(startedAt).Milliseconds(), "OPENAI_API_KEY ausente")
		return dtos.GenerateAIWorkoutResponse{}, errors.New("configure OPENAI_API_KEY para gerar treinos com IA")
	}

	input = normalizeAIWorkoutRequest(input)
	logAIWorkoutTrace(
		traceID,
		"generate_start",
		"user_id=%d height=%q weight=%q selected_days=%v days_per_week=%d hours_per_day=%q machines_per_day=%q workout_split=%q intensity=%q goal=%q custom_instructions_len=%d",
		userID,
		input.Height,
		input.Weight,
		input.SelectedDays,
		input.DaysPerWeek,
		input.HoursPerDay,
		input.MachinesPerDay,
		input.WorkoutSplit,
		input.Intensity,
		input.Goal,
		len(input.CustomInstructions),
	)

	selectedDays, err := normalizeSelectedDays(input.SelectedDays)
	if err != nil {
		logAIWorkoutTrace(traceID, "generate_error", "user_id=%d duration_ms=%d reason=%q", userID, time.Since(startedAt).Milliseconds(), err.Error())
		return dtos.GenerateAIWorkoutResponse{}, err
	}

	input.SelectedDays = selectedDays
	input.DaysPerWeek = len(selectedDays)
	logAIWorkoutTrace(traceID, "input_normalized", "user_id=%d selected_days=%v days_per_week=%d", userID, input.SelectedDays, input.DaysPerWeek)

	catalogMachines, err := s.catalog.FindAll()
	if err != nil {
		logAIWorkoutTrace(traceID, "generate_error", "user_id=%d duration_ms=%d reason=%q", userID, time.Since(startedAt).Milliseconds(), "falha ao carregar catalogo")
		return dtos.GenerateAIWorkoutResponse{}, errors.New("nao foi possivel carregar o catalogo de maquinas")
	}
	if len(catalogMachines) == 0 {
		logAIWorkoutTrace(traceID, "generate_error", "user_id=%d duration_ms=%d reason=%q", userID, time.Since(startedAt).Milliseconds(), "catalogo vazio")
		return dtos.GenerateAIWorkoutResponse{}, errors.New("nenhuma maquina de catalogo disponivel para a geracao")
	}
	logAIWorkoutTrace(traceID, "catalog_loaded", "user_id=%d catalog_machine_count=%d", userID, len(catalogMachines))

	catalogByID := buildCatalogMachineLookup(catalogMachines)
	catalogCountsByCategory := buildCatalogMachineCountsByCategory(catalogMachines)

	user, err := s.users.FindByID(userID)
	if err != nil {
		logAIWorkoutTrace(traceID, "generate_error", "user_id=%d duration_ms=%d reason=%q", userID, time.Since(startedAt).Milliseconds(), "usuario nao encontrado")
		return dtos.GenerateAIWorkoutResponse{}, errors.New("usuario nao encontrado")
	}
	logAIWorkoutTrace(traceID, "user_loaded", "user_id=%d credits=%d", userID, user.Credits)

	if user.Credits <= 0 {
		logAIWorkoutTrace(traceID, "generate_error", "user_id=%d duration_ms=%d reason=%q credits=%d", userID, time.Since(startedAt).Milliseconds(), "creditos insuficientes", user.Credits)
		return dtos.GenerateAIWorkoutResponse{}, errors.New("voce nao possui creditos suficientes para gerar um treino com IA")
	}

	blueprint, err := buildAIWorkoutBlueprint(input, s.knowledge)
	if err != nil {
		logAIWorkoutTrace(traceID, "generate_error", "user_id=%d duration_ms=%d reason=%q", userID, time.Since(startedAt).Milliseconds(), err.Error())
		return dtos.GenerateAIWorkoutResponse{}, err
	}
	blueprint, blueprintRelaxations, err := relaxAIWorkoutBlueprintForCatalog(blueprint, catalogCountsByCategory)
	if err != nil {
		logAIWorkoutTrace(traceID, "generate_error", "user_id=%d duration_ms=%d reason=%q", userID, time.Since(startedAt).Milliseconds(), err.Error())
		return dtos.GenerateAIWorkoutResponse{}, err
	}
	estimatedMachinesPerDay := "n/a"
	if value, ok := estimateMachinesPerDayFromHours(input.HoursPerDay); ok {
		estimatedMachinesPerDay = strconv.FormatFloat(value, 'f', -1, 64)
	}
	if len(blueprintRelaxations) > 0 {
		logAIWorkoutTrace(
			traceID,
			"blueprint_relaxed",
			"user_id=%d relaxations=%q catalog_counts=%q",
			userID,
			strings.Join(blueprintRelaxations, " | "),
			formatAIWorkoutCategoryTargets(catalogCountsByCategory),
		)
	}
	logAIWorkoutTrace(
		traceID,
		"blueprint_built",
		"user_id=%d template_key=%q template_name=%q target_exercises_per_workout=%q workout_count=%d estimated_machines_per_day=%q workouts=%q",
		userID,
		blueprint.TemplateKey,
		blueprint.TemplateName,
		formatAIWorkoutBlueprintTargetExercisesSummary(blueprint),
		len(blueprint.Workouts),
		estimatedMachinesPerDay,
		summarizeAIWorkoutBlueprintForLog(blueprint),
	)

	response, err := s.requestWorkoutPlan(ctx, traceID, input, blueprint, catalogMachines, catalogByID)
	if err != nil {
		logAIWorkoutTrace(traceID, "generate_plan_error", "user_id=%d duration_ms=%d err=%q ctx_err=%q", userID, time.Since(startedAt).Milliseconds(), err.Error(), formatAIWorkoutContextError(ctx.Err()))
		if requestErr := mapAIWorkoutRequestError(err); requestErr != nil {
			logAIWorkoutTrace(traceID, "generate_error", "user_id=%d duration_ms=%d mapped_err=%q", userID, time.Since(startedAt).Milliseconds(), requestErr.Error())
			return dtos.GenerateAIWorkoutResponse{}, requestErr
		}

		logAIWorkoutTrace(traceID, "generate_error", "user_id=%d duration_ms=%d reason=%q", userID, time.Since(startedAt).Milliseconds(), err.Error())
		return dtos.GenerateAIWorkoutResponse{}, err
	}

	if len(response.Categories) == 0 {
		logAIWorkoutTrace(traceID, "generate_error", "user_id=%d duration_ms=%d reason=%q", userID, time.Since(startedAt).Milliseconds(), "a IA nao retornou categorias validas")
		return dtos.GenerateAIWorkoutResponse{}, errors.New("a IA nao retornou categorias de treino validas")
	}

	workoutInputs := buildGeneratedWorkoutInputs(response, catalogByID)
	remainingCredits := user.Credits
	logAIWorkoutTrace(traceID, "plan_generated", "user_id=%d generated_categories=%d workout_inputs=%d", userID, len(response.Categories), len(workoutInputs))

	if err := mapAIWorkoutRequestError(ctx.Err()); err != nil {
		logAIWorkoutTrace(traceID, "generate_error", "user_id=%d duration_ms=%d reason=%q ctx_err=%q", userID, time.Since(startedAt).Milliseconds(), err.Error(), formatAIWorkoutContextError(ctx.Err()))
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
			logAIWorkoutTrace(traceID, "generate_error", "user_id=%d duration_ms=%d reason=%q", userID, time.Since(startedAt).Milliseconds(), "creditos insuficientes na conclusao")
			return dtos.GenerateAIWorkoutResponse{}, errors.New("voce nao possui creditos suficientes para concluir esta geracao")
		}

		logAIWorkoutTrace(traceID, "generate_error", "user_id=%d duration_ms=%d reason=%q", userID, time.Since(startedAt).Milliseconds(), err.Error())
		return dtos.GenerateAIWorkoutResponse{}, err
	}

	response.RemainingCredits = remainingCredits
	logAIWorkoutTrace(traceID, "generate_success", "user_id=%d duration_ms=%d generated_categories=%d remaining_credits=%d", userID, time.Since(startedAt).Milliseconds(), len(response.Categories), response.RemainingCredits)

	return response, nil
}

func (s *AIWorkoutService) requestWorkoutPlan(ctx context.Context, traceID string, input dtos.GenerateAIWorkoutRequest, blueprint aiWorkoutBlueprint, catalogMachines []models.Machine, catalogByID map[string]models.Machine) (dtos.GenerateAIWorkoutResponse, error) {
	var lastErr error

	for attempt := 0; attempt < aiWorkoutGenerationTries; attempt++ {
		attemptNumber := attempt + 1
		if err := mapAIWorkoutRequestError(ctx.Err()); err != nil {
			logAIWorkoutTrace(traceID, "attempt_canceled", "attempt=%d err=%q ctx_err=%q", attemptNumber, err.Error(), formatAIWorkoutContextError(ctx.Err()))
			return dtos.GenerateAIWorkoutResponse{}, err
		}

		logAIWorkoutTrace(traceID, "attempt_start", "attempt=%d previous_err=%q", attemptNumber, compactAIWorkoutLogText(errorString(lastErr), 500))
		response, err := s.requestWorkoutPlanAttempt(ctx, traceID, attemptNumber, input, blueprint, catalogMachines, catalogByID, lastErr)
		if err == nil {
			logAIWorkoutTrace(traceID, "attempt_success", "attempt=%d generated_categories=%d", attemptNumber, len(response.Categories))
			return response, nil
		}

		if !isRetryableWorkoutError(err) {
			logAIWorkoutTrace(traceID, "attempt_failed", "attempt=%d retryable=false err=%q", attemptNumber, compactAIWorkoutLogText(err.Error(), 500))
			return dtos.GenerateAIWorkoutResponse{}, err
		}

		logAIWorkoutTrace(traceID, "attempt_failed", "attempt=%d retryable=true err=%q", attemptNumber, compactAIWorkoutLogText(err.Error(), 500))
		lastErr = err
	}

	if lastErr != nil {
		logAIWorkoutTrace(traceID, "attempts_exhausted", "err=%q", compactAIWorkoutLogText(lastErr.Error(), 500))
		return dtos.GenerateAIWorkoutResponse{}, lastErr
	}

	logAIWorkoutTrace(traceID, "attempts_exhausted", "err=%q", "nao foi possivel gerar o treino automaticamente")
	return dtos.GenerateAIWorkoutResponse{}, errors.New("nao foi possivel gerar o treino automaticamente")
}

func (s *AIWorkoutService) requestWorkoutPlanAttempt(ctx context.Context, traceID string, attemptNumber int, input dtos.GenerateAIWorkoutRequest, blueprint aiWorkoutBlueprint, catalogMachines []models.Machine, catalogByID map[string]models.Machine, previousErr error) (dtos.GenerateAIWorkoutResponse, error) {
	messages := buildAIWorkoutMessages(input, blueprint, s.knowledge, previousErr)
	surfacedCatalogByID := make(map[string]models.Machine)

	for round := 0; round < aiWorkoutMaxToolRounds; round++ {
		roundNumber := round + 1
		if err := mapAIWorkoutRequestError(ctx.Err()); err != nil {
			logAIWorkoutTrace(traceID, "round_canceled", "attempt=%d round=%d err=%q ctx_err=%q", attemptNumber, roundNumber, err.Error(), formatAIWorkoutContextError(ctx.Err()))
			return dtos.GenerateAIWorkoutResponse{}, err
		}

		tools := buildAIWorkoutTools(surfacedCatalogByID, blueprint)
		logAIWorkoutTrace(traceID, "round_start", "attempt=%d round=%d message_count=%d surfaced_machine_count=%d tool_names=%q", attemptNumber, roundNumber, len(messages), len(surfacedCatalogByID), summarizeAIWorkoutToolDefinitionsForLog(tools))
		openAIStartedAt := time.Now()
		completion, err := s.createOpenAIChatCompletion(ctx, openAIChatCompletionRequest{
			Model:       s.model,
			Messages:    messages,
			Tools:       tools,
			ToolChoice:  aiWorkoutToolChoiceRequired,
			Temperature: aiWorkoutGenerationTemperature,
		})
		openAIDurationMs := time.Since(openAIStartedAt).Milliseconds()
		if err != nil {
			logAIWorkoutTrace(traceID, "openai_error", "attempt=%d round=%d duration_ms=%d err=%q", attemptNumber, roundNumber, openAIDurationMs, compactAIWorkoutLogText(err.Error(), 500))
			if requestErr := mapAIWorkoutRequestError(err); requestErr != nil {
				logAIWorkoutTrace(traceID, "openai_error_mapped", "attempt=%d round=%d duration_ms=%d mapped_err=%q", attemptNumber, roundNumber, openAIDurationMs, requestErr.Error())
				return dtos.GenerateAIWorkoutResponse{}, requestErr
			}

			return dtos.GenerateAIWorkoutResponse{}, err
		}
		logAIWorkoutTrace(traceID, "openai_response", "attempt=%d round=%d duration_ms=%d tool_call_count=%d refusal_len=%d", attemptNumber, roundNumber, openAIDurationMs, len(completion.FirstMessage().ToolCalls), len(strings.TrimSpace(completion.FirstMessageRefusal())))

		if refusal := strings.TrimSpace(completion.FirstMessageRefusal()); refusal != "" {
			logAIWorkoutTrace(traceID, "openai_refusal", "attempt=%d round=%d refusal=%q", attemptNumber, roundNumber, compactAIWorkoutLogText(refusal, 500))
			return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf("a OpenAI recusou a solicitacao: %s", refusal)
		}

		message := completion.FirstMessage()
		if len(message.ToolCalls) == 0 {
			logAIWorkoutTrace(traceID, "round_no_tool_calls", "attempt=%d round=%d content_len=%d", attemptNumber, roundNumber, len(strings.TrimSpace(message.Content)))
			return dtos.GenerateAIWorkoutResponse{}, &retryableWorkoutError{
				message: "a OpenAI nao retornou chamadas de ferramenta",
			}
		}
		logAIWorkoutTrace(traceID, "tool_calls_received", "attempt=%d round=%d tool_call_count=%d tool_call_names=%q", attemptNumber, roundNumber, len(message.ToolCalls), summarizeAIWorkoutToolCallsForLog(message.ToolCalls))

		assistantMessage := openAIChatCompletionMessage{
			Role:      "assistant",
			Content:   strings.TrimSpace(message.Content),
			ToolCalls: message.ToolCalls,
		}
		messages = append(messages, assistantMessage)

		for _, toolCall := range message.ToolCalls {
			switch toolCall.Function.Name {
			case aiWorkoutSearchToolName:
				searchArgs, searchArgsErr := parseAIWorkoutCatalogSearchArgs(toolCall.Function.Arguments)
				toolOutput, surfacedMachines := handleAIWorkoutCatalogSearch(toolCall.Function.Arguments, catalogMachines)
				for _, machine := range surfacedMachines {
					surfacedCatalogByID[machine.ID] = machine
				}
				searchResponse := aiWorkoutCatalogSearchResponse{}
				if err := json.Unmarshal([]byte(toolOutput), &searchResponse); err != nil {
					searchResponse.Error = "nao foi possivel interpretar a resposta da busca"
				}
				if searchArgsErr != nil {
					logAIWorkoutTrace(traceID, "tool_search_invalid_args", "attempt=%d round=%d tool_call_id=%q err=%q raw_arguments=%q", attemptNumber, roundNumber, toolCall.ID, compactAIWorkoutLogText(searchArgsErr.Error(), 500), compactAIWorkoutLogText(toolCall.Function.Arguments, 500))
				}
				logAIWorkoutTrace(
					traceID,
					"tool_search_result",
					"attempt=%d round=%d tool_call_id=%q query=%q category_key=%q limit=%d result_count=%d surfaced_machine_count=%d response_error=%q",
					attemptNumber,
					roundNumber,
					toolCall.ID,
					searchArgs.Query,
					searchArgs.CategoryKey,
					searchArgs.Limit,
					len(surfacedMachines),
					len(surfacedCatalogByID),
					compactAIWorkoutLogText(searchResponse.Error, 500),
				)

				messages = append(messages, openAIChatCompletionMessage{
					Role:       "tool",
					ToolCallID: toolCall.ID,
					Content:    toolOutput,
				})
			case aiWorkoutSubmitToolName:
				parsed, err := parseAIWorkoutSubmission(toolCall.Function.Arguments)
				if err != nil {
					logAIWorkoutTrace(traceID, "submit_parse_error", "attempt=%d round=%d tool_call_id=%q err=%q raw_arguments=%q", attemptNumber, roundNumber, toolCall.ID, compactAIWorkoutLogText(err.Error(), 500), compactAIWorkoutLogText(toolCall.Function.Arguments, 500))
					messages = append(messages, openAIChatCompletionMessage{
						Role:       "tool",
						ToolCallID: toolCall.ID,
						Content:    buildAIWorkoutToolErrorOutput("os argumentos enviados para submit_workout_plan nao formam um JSON valido"),
					})
					continue
				}
				logAIWorkoutTrace(traceID, "submit_received", "attempt=%d round=%d tool_call_id=%q category_count=%d category_names=%q", attemptNumber, roundNumber, toolCall.ID, len(parsed.Categories), summarizeAIWorkoutSubmissionForLog(parsed))

				response, err := materializeAIWorkoutSubmission(parsed, surfacedCatalogByID, blueprint)
				if err != nil {
					logAIWorkoutTrace(traceID, "submit_validation_error", "attempt=%d round=%d tool_call_id=%q err=%q", attemptNumber, roundNumber, toolCall.ID, compactAIWorkoutLogText(err.Error(), 800))
					messages = append(messages, openAIChatCompletionMessage{
						Role:       "tool",
						ToolCallID: toolCall.ID,
						Content:    buildAIWorkoutToolErrorOutput(err.Error()),
					})
					continue
				}
				logAIWorkoutTrace(traceID, "submit_accepted", "attempt=%d round=%d tool_call_id=%q category_count=%d", attemptNumber, roundNumber, toolCall.ID, len(response.Categories))

				return hydrateGeneratedWorkoutWithCatalog(response, catalogByID), nil
			default:
				logAIWorkoutTrace(traceID, "tool_unknown", "attempt=%d round=%d tool_call_id=%q tool_name=%q", attemptNumber, roundNumber, toolCall.ID, toolCall.Function.Name)
				messages = append(messages, openAIChatCompletionMessage{
					Role:       "tool",
					ToolCallID: toolCall.ID,
					Content:    buildAIWorkoutToolErrorOutput("ferramenta desconhecida"),
				})
			}
		}
	}

	logAIWorkoutTrace(traceID, "rounds_exhausted", "attempt=%d max_rounds=%d", attemptNumber, aiWorkoutMaxToolRounds)
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

func buildAIWorkoutPrompt(input dtos.GenerateAIWorkoutRequest, blueprint aiWorkoutBlueprint, knowledge aiWorkoutKnowledge) string {
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
		fmt.Sprintf("Use os dias escolhidos %s apenas para decidir volume e recuperacao entre sessoes.", selectedDayNames),
		fmt.Sprintf("Use somente estes indices de dias para interpretar a disponibilidade semanal do usuario: %s.", selectedDayIndexes),
		fmt.Sprintf("Retorne exatamente %d treinos, um para cada dia selecionado.", len(blueprint.Workouts)),
		"No campo categories, cada chave deve ser exatamente o nome de um treino do blueprint.",
		"O blueprint abaixo ja foi escolhido localmente a partir de regras e fontes estudadas. Nao altere essa divisao.",
		"Use exatamente os nomes de treino do blueprint e siga a mesma ordem.",
		"Cada treino deve ter exatamente a quantidade total de exercicios definida no blueprint.",
		"Cada treino deve cumprir exatamente as cotas obrigatorias por categoria definidas no blueprint.",
		"Se o usuario informar tempo por dia ou quantidade de maquinas, respeite essas preferencias quando forem compativeis com o blueprint.",
		buildMachinesPerDayPromptInstruction(input),
		"Categorias disponiveis no catalogo: peito, costas, pernas, ombros, biceps, triceps, core, cardio.",
		"O nome de cada treino deve refletir apenas os grupos musculares realmente trabalhados pelos exercicios escolhidos.",
		"Se o nome de um treino citar mais de um grupo muscular, inclua pelo menos 1 exercicio de cada grupo citado.",
		`Exemplo: "ombros e peito" precisa ter ao menos 1 exercicio de ombros e 1 de peito.`,
		`Exemplo: "costas, biceps e core" precisa ter ao menos 1 exercicio de costas, 1 de biceps e 1 de core.`,
		"Nao cite no titulo um grupo muscular que nao apareca nos exercicios daquele treino.",
		"Quando combinar varios grupos no mesmo treino, mantenha o primeiro grupo citado como foco principal e distribua os demais como complementares, sem deixar nenhum zerado.",
		"Antes de montar o treino, consulte a ferramenta search_catalog_machines em buscas pequenas e direcionadas, sempre uma categoria por vez.",
		"Use exclusivamente catalogMachineId retornados pela ferramenta.",
		"Cada exercicio precisa apontar para um catalogMachineId valido retornado pela ferramenta.",
		"Escolha exercicios de forma coerente com o blueprint: primeiro os compostos e depois os acessorios, sempre que o catalogo permitir.",
		"Se o exercicio ideal nao existir exatamente no catalogo, escolha a opcao mais proxima dentre as retornadas pela ferramenta.",
		"No submit_workout_plan, o campo categories deve ser um objeto indexado pelo nome exato de cada treino do blueprint.",
		"Em cada treino dentro de categories, use as categorias obrigatorias como chaves e coloque nelas somente maquinas da propria categoria, com a quantidade exata exigida.",
		"Antes de chamar submit_workout_plan, confira se cada treino cumpre exatamente os grupos musculares prometidos no proprio titulo.",
		"Quando concluir, finalize chamando a ferramenta submit_workout_plan.",
		"Nao inclua dias na resposta final nem crie treinos extras fora dos dias disponiveis.",
		"",
		buildAIWorkoutBlueprintPrompt(blueprint),
		"",
		buildAIWorkoutKnowledgePrompt(knowledge, input, blueprint),
		"",
		fmt.Sprintf("No campo categories, monte exatamente %d treinos personalizados, usando como chaves os nomes exatos dos treinos do blueprint, e atribua exercicios de musculacao com peso sugerido para 3 series em kg.", len(blueprint.Workouts)),
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

func buildCatalogMachineCountsByCategory(catalogMachines []models.Machine) map[string]int {
	countsByCategory := make(map[string]int, len(allMachineCategoryKeys()))
	for _, machine := range catalogMachines {
		categoryKey := strings.TrimSpace(machine.CategoryKey)
		if categoryKey == "" {
			continue
		}

		countsByCategory[categoryKey]++
	}

	return countsByCategory
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

func materializeAIWorkoutSubmission(submission aiWorkoutSubmission, surfacedCatalogByID map[string]models.Machine, blueprint aiWorkoutBlueprint) (dtos.GenerateAIWorkoutResponse, error) {
	if len(submission.Categories) != len(blueprint.Workouts) {
		return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf(
			"a IA deve retornar exatamente %d treinos, mas retornou %d",
			len(blueprint.Workouts),
			len(submission.Categories),
		)
	}

	unexpectedWorkoutNames := make([]string, 0)
	allowedWorkoutNames := make(map[string]struct{}, len(blueprint.Workouts))
	for _, workout := range blueprint.Workouts {
		allowedWorkoutNames[workout.Name] = struct{}{}
	}
	for workoutName := range submission.Categories {
		if _, ok := allowedWorkoutNames[workoutName]; !ok {
			unexpectedWorkoutNames = append(unexpectedWorkoutNames, workoutName)
		}
	}
	sort.Strings(unexpectedWorkoutNames)
	if len(unexpectedWorkoutNames) > 0 {
		return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf(
			"o campo categories retornou treinos inesperados: %s",
			strings.Join(unexpectedWorkoutNames, ", "),
		)
	}

	response := dtos.GenerateAIWorkoutResponse{
		Categories: make([]dtos.GeneratedCategory, 0, len(submission.Categories)),
	}

	for _, expectedWorkout := range blueprint.Workouts {
		groupedMachines, ok := submission.Categories[expectedWorkout.Name]
		if !ok {
			return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf(
				`o campo categories nao retornou o treino obrigatorio %q`,
				expectedWorkout.Name,
			)
		}
		if len(groupedMachines) == 0 {
			return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf(
				`o treino %q nao retornou grupos de categorias em categories`,
				expectedWorkout.Name,
			)
		}

		unexpectedCategoryKeys := make([]string, 0)
		for categoryKey := range groupedMachines {
			if _, ok := expectedWorkout.CategoryTargets[categoryKey]; !ok {
				unexpectedCategoryKeys = append(unexpectedCategoryKeys, categoryKey)
			}
		}
		sort.Strings(unexpectedCategoryKeys)
		if len(unexpectedCategoryKeys) > 0 {
			return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf(
				`o treino %q retornou categorias inesperadas em categories: %s`,
				expectedWorkout.Name,
				strings.Join(unexpectedCategoryKeys, ", "),
			)
		}

		flattenedMachines := make([]dtos.GeneratedMachine, 0, expectedWorkout.TargetExercises)
		categoryMachineSet := make(map[string]struct{}, expectedWorkout.TargetExercises)
		for _, categoryKey := range orderedAIWorkoutBlueprintCategoryKeys(expectedWorkout) {
			expectedCount := expectedWorkout.CategoryTargets[categoryKey]
			machines, ok := groupedMachines[categoryKey]
			if !ok {
				return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf(
					`o treino %q nao retornou o grupo obrigatorio %q em categories`,
					expectedWorkout.Name,
					categoryKey,
				)
			}
			if len(machines) != expectedCount {
				return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf(
					`o grupo %q do treino %q deveria conter exatamente %d exercicios, mas retornou %d`,
					categoryKey,
					expectedWorkout.Name,
					expectedCount,
					len(machines),
				)
			}

			for _, machine := range machines {
				catalogMachineID := strings.TrimSpace(machine.CatalogMachineID)
				if catalogMachineID == "" {
					return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf(
						`o treino %q retornou um exercicio sem catalogMachineId no grupo %q`,
						expectedWorkout.Name,
						categoryKey,
					)
				}

				catalogMachine, ok := surfacedCatalogByID[catalogMachineID]
				if !ok {
					return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf(
						"a IA retornou uma maquina fora do catalogo permitido: %s",
						catalogMachineID,
					)
				}

				if strings.TrimSpace(catalogMachine.CategoryKey) != categoryKey {
					return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf(
						`a IA colocou a maquina %q no grupo %q, mas a categoria real dela e %q`,
						catalogMachineID,
						categoryKey,
						catalogMachine.CategoryKey,
					)
				}

				if _, exists := categoryMachineSet[catalogMachineID]; exists {
					return dtos.GenerateAIWorkoutResponse{}, fmt.Errorf(
						"a IA retornou maquinas duplicadas na categoria %q: %s",
						expectedWorkout.Name,
						catalogMachineID,
					)
				}
				categoryMachineSet[catalogMachineID] = struct{}{}

				if len(machine.Sets) != 3 {
					return dtos.GenerateAIWorkoutResponse{}, errors.New("a IA retornou um exercicio sem 3 series")
				}

				flattenedMachines = append(flattenedMachines, dtos.GeneratedMachine{
					CatalogMachineID: catalogMachineID,
					Sets:             append([]float64(nil), machine.Sets...),
				})
			}
		}

		response.Categories = append(response.Categories, dtos.GeneratedCategory{
			Name:     strings.TrimSpace(expectedWorkout.Name),
			Machines: flattenedMachines,
		})
	}

	if err := validateGeneratedWorkout(response, surfacedCatalogByID, blueprint); err != nil {
		return dtos.GenerateAIWorkoutResponse{}, err
	}

	return response, nil
}

func validateGeneratedWorkout(response dtos.GenerateAIWorkoutResponse, catalogByID map[string]models.Machine, blueprint aiWorkoutBlueprint) error {
	if len(response.Categories) != len(blueprint.Workouts) {
		return fmt.Errorf(
			"a IA deve retornar exatamente %d treinos, mas retornou %d",
			len(blueprint.Workouts),
			len(response.Categories),
		)
	}

	for index, category := range response.Categories {
		expectedWorkout := blueprint.Workouts[index]
		if strings.TrimSpace(category.Name) == "" {
			return errors.New("a IA retornou uma categoria sem nome")
		}

		if normalizeGeneratedWorkoutText(category.Name) != normalizeGeneratedWorkoutText(expectedWorkout.Name) {
			return fmt.Errorf(
				`a IA alterou o nome do treino na posicao %d: esperado %q, recebido %q`,
				index+1,
				expectedWorkout.Name,
				category.Name,
			)
		}

		if len(category.Machines) == 0 {
			return errors.New("a IA retornou uma categoria sem exercicios")
		}
		if len(category.Machines) != expectedWorkout.TargetExercises {
			return fmt.Errorf(
				`o treino %q deveria conter exatamente %d exercicios, mas retornou %d`,
				category.Name,
				expectedWorkout.TargetExercises,
				len(category.Machines),
			)
		}

		categoryMachineSet := make(map[string]struct{}, len(category.Machines))
		categoryMachineCounts := make(map[string]int)
		for _, machine := range category.Machines {
			catalogMachineID := strings.TrimSpace(machine.CatalogMachineID)
			if catalogMachineID == "" {
				return errors.New("a IA retornou um exercicio sem catalogMachineId")
			}

			catalogMachine, ok := catalogByID[catalogMachineID]
			if !ok {
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
			categoryMachineCounts[strings.TrimSpace(catalogMachine.CategoryKey)]++

			if len(machine.Sets) != 3 {
				return errors.New("a IA retornou um exercicio sem 3 series")
			}
		}

		if err := validateGeneratedWorkoutBlueprintCoverage(expectedWorkout, categoryMachineCounts); err != nil {
			return err
		}
		if err := validateGeneratedWorkoutTitleCoverage(category.Name, categoryMachineCounts); err != nil {
			return err
		}
	}

	return nil
}

func buildAIWorkoutMessages(input dtos.GenerateAIWorkoutRequest, blueprint aiWorkoutBlueprint, knowledge aiWorkoutKnowledge, previousErr error) []openAIChatCompletionMessage {
	messages := []openAIChatCompletionMessage{
		{
			Role: "system",
			Content: strings.Join([]string{
				"Voce e um personal trainer especialista em musculacao.",
				"Voce esta na etapa de selecao de exercicios de um pipeline. A divisao semanal nao deve ser reinventada.",
				"Use obrigatoriamente a convencao de dias 0=domingo, 1=segunda, 2=terca, 3=quarta, 4=quinta, 5=sexta, 6=sabado ao interpretar a disponibilidade do usuario.",
				"O campo categories deve conter exatamente as chaves dos treinos do blueprint, sem treinos extras nem faltantes.",
				"Cada chave de categories representa um treino completo, nao um grupo muscular isolado.",
				"Use exatamente os nomes de treino e as cotas por categoria definidas no blueprint.",
				"O titulo de cada treino deve corresponder aos grupos musculares realmente presentes nos exercicios.",
				"Se o titulo citar peito, costas, pernas, ombros, biceps, triceps, core ou cardio, inclua pelo menos 1 exercicio da categoria citada.",
				"Busque maquinas apenas com a ferramenta search_catalog_machines, uma categoria por vez.",
				"No submit_workout_plan, use um objeto categories indexado pelos nomes exatos dos treinos do blueprint.",
				"Dentro de cada treino em categories, use as categorias obrigatorias como chaves e coloque nelas somente maquinas da propria categoria, com a quantidade exata pedida.",
				"Finalize sempre chamando a ferramenta submit_workout_plan.",
			}, "\n"),
		},
		{
			Role:    "user",
			Content: buildAIWorkoutPrompt(input, blueprint, knowledge),
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
			"Consulte novamente a ferramenta search_catalog_machines se precisar de mais opcoes, sempre uma categoria por vez.",
			"Use apenas catalogMachineId retornados pela ferramenta.",
			"Reenvie o treino final usando o objeto categories indexado pelos nomes exatos dos treinos e separado pelas categorias obrigatorias.",
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
	CategoryKey string `json:"categoryKey,omitempty"`
	Query       string `json:"query,omitempty"`
	Limit       int    `json:"limit,omitempty"`
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

type aiWorkoutSubmission struct {
	Categories map[string]map[string][]aiWorkoutSubmissionMachine `json:"categories"`
}

type aiWorkoutSubmissionMachine struct {
	CatalogMachineID string    `json:"catalogMachineId"`
	Sets             []float64 `json:"sets"`
}

func (r openAIChatCompletionResponse) FirstMessageRefusal() string {
	return r.FirstMessage().Refusal
}

func buildAIWorkoutTools(surfacedCatalogByID map[string]models.Machine, blueprint aiWorkoutBlueprint) []openAIChatCompletionTool {
	tools := []openAIChatCompletionTool{
		{
			Type: "function",
			Function: openAIChatCompletionToolFunction{
				Name:        aiWorkoutSearchToolName,
				Description: "Busca maquinas de uma unica categoria do catalogo oficial para montar o treino. A query prioriza resultados pelo nome ou alias; se nao houver correspondencia textual, retorna opcoes disponiveis da categoria informada.",
				Strict:      true,
				Parameters:  buildAIWorkoutSearchToolSchema(),
			},
		},
	}

	if !canBuildAIWorkoutSubmitTool(surfacedCatalogByID, blueprint) {
		return tools
	}

	tools = append(tools, openAIChatCompletionTool{
		Type: "function",
		Function: openAIChatCompletionToolFunction{
			Name:        aiWorkoutSubmitToolName,
			Description: "Envia o treino final agrupando as maquinas por categoria obrigatoria e usando apenas catalogMachineId ja retornados pela busca.",
			Strict:      true,
			Parameters:  buildAIWorkoutSubmitToolSchema(surfacedCatalogByID, blueprint),
		},
	})

	return tools
}

func buildAIWorkoutSearchToolSchema() map[string]any {
	return map[string]any{
		"type":                 "object",
		"additionalProperties": false,
		"required":             []string{"categoryKey", "query", "limit"},
		"properties": map[string]any{
			"categoryKey": map[string]any{
				"type": "string",
				"enum": allMachineCategoryKeys(),
			},
			"query": map[string]any{
				"type":      "string",
				"minLength": 1,
			},
			"limit": map[string]any{
				"type":    "integer",
				"minimum": 1,
				"maximum": aiWorkoutSearchMaxLimit,
			},
		},
	}
}

func buildAIWorkoutSubmitToolSchema(surfacedCatalogByID map[string]models.Machine, blueprint aiWorkoutBlueprint) map[string]any {
	surfacedMachineIDsByCategory := buildSurfacedCatalogMachineIDsByCategory(surfacedCatalogByID)
	workoutNames := blueprint.workoutNames()
	workoutProperties := make(map[string]any, len(blueprint.Workouts))
	for _, workout := range blueprint.Workouts {
		workoutProperties[workout.Name] = buildAIWorkoutSubmitWorkoutSchema(workout, surfacedMachineIDsByCategory)
	}

	return map[string]any{
		"type":                 "object",
		"additionalProperties": false,
		"required":             []string{"categories"},
		"properties": map[string]any{
			"categories": map[string]any{
				"type":                 "object",
				"additionalProperties": false,
				"required":             workoutNames,
				"properties":           workoutProperties,
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

func parseAIWorkoutSubmission(arguments string) (aiWorkoutSubmission, error) {
	var submission aiWorkoutSubmission
	if err := json.Unmarshal([]byte(arguments), &submission); err != nil {
		return aiWorkoutSubmission{}, err
	}

	return submission, nil
}

func searchAIWorkoutCatalogMachines(catalogMachines []models.Machine, args aiWorkoutCatalogSearchArgs) ([]models.Machine, error) {
	normalizedQuery := normalizeGeneratedWorkoutText(args.Query)
	categoryKey, err := normalizeAIWorkoutSearchCategory(args.CategoryKey)
	if err != nil {
		return nil, err
	}

	if normalizedQuery == "" && categoryKey == "" {
		return nil, errors.New("informe categoryKey e query para buscar maquinas")
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
	categoryCandidates := make([]scoredMachine, 0, len(catalogMachines))
	for _, machine := range catalogMachines {
		if categoryKey != "" && strings.TrimSpace(machine.CategoryKey) != categoryKey {
			continue
		}
		categoryCandidates = append(categoryCandidates, scoredMachine{machine: machine, score: 1})

		score := scoreAIWorkoutCatalogMachine(machine, normalizedQuery)
		if normalizedQuery != "" && score == 0 {
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

	if len(scored) == 0 && categoryKey != "" {
		scored = categoryCandidates
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

func normalizeAIWorkoutSearchCategory(value string) (string, error) {
	categoryKey := strings.TrimSpace(value)
	if categoryKey == "" {
		return "", nil
	}

	for _, validCategoryKey := range allMachineCategoryKeys() {
		if categoryKey == validCategoryKey {
			return categoryKey, nil
		}
	}

	return "", fmt.Errorf("categoria de busca invalida: %s", categoryKey)
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
		string(models.MachineCategoryAntebraco),
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

func canBuildAIWorkoutSubmitTool(surfacedCatalogByID map[string]models.Machine, blueprint aiWorkoutBlueprint) bool {
	if len(surfacedCatalogByID) == 0 {
		return false
	}

	surfacedMachineIDsByCategory := buildSurfacedCatalogMachineIDsByCategory(surfacedCatalogByID)
	requiredCountsByCategory := buildRequiredAIWorkoutSurfacedCountsByCategory(blueprint)
	for categoryKey, requiredCount := range requiredCountsByCategory {
		if len(surfacedMachineIDsByCategory[categoryKey]) < requiredCount {
			return false
		}
	}

	return true
}

func buildAIWorkoutSubmitWorkoutSchema(workout aiWorkoutBlueprintWorkout, surfacedMachineIDsByCategory map[string][]string) map[string]any {
	groupedMachineProperties := make(map[string]any, len(workout.CategoryTargets))
	requiredCategoryKeys := orderedAIWorkoutBlueprintCategoryKeys(workout)
	for _, categoryKey := range requiredCategoryKeys {
		groupedMachineProperties[categoryKey] = map[string]any{
			"type":     "array",
			"minItems": workout.CategoryTargets[categoryKey],
			"maxItems": workout.CategoryTargets[categoryKey],
			"items": map[string]any{
				"type":                 "object",
				"additionalProperties": false,
				"required":             []string{"catalogMachineId", "sets"},
				"properties": map[string]any{
					"catalogMachineId": map[string]any{
						"type": "string",
						"enum": surfacedMachineIDsByCategory[categoryKey],
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
		}
	}

	return map[string]any{
		"type":                 "object",
		"additionalProperties": false,
		"required":             requiredCategoryKeys,
		"properties":           groupedMachineProperties,
	}
}

func buildSurfacedCatalogMachineIDsByCategory(surfacedCatalogByID map[string]models.Machine) map[string][]string {
	idsByCategory := make(map[string][]string, len(allMachineCategoryKeys()))
	for _, machine := range surfacedCatalogByID {
		categoryKey := strings.TrimSpace(machine.CategoryKey)
		if categoryKey == "" {
			continue
		}

		idsByCategory[categoryKey] = append(idsByCategory[categoryKey], machine.ID)
	}

	for categoryKey := range idsByCategory {
		sort.Strings(idsByCategory[categoryKey])
	}

	return idsByCategory
}

func buildRequiredAIWorkoutSurfacedCountsByCategory(blueprint aiWorkoutBlueprint) map[string]int {
	requiredCounts := make(map[string]int)
	for _, workout := range blueprint.Workouts {
		for categoryKey, count := range workout.CategoryTargets {
			if count > requiredCounts[categoryKey] {
				requiredCounts[categoryKey] = count
			}
		}
	}

	return requiredCounts
}

func orderedAIWorkoutBlueprintCategoryKeys(workout aiWorkoutBlueprintWorkout) []string {
	ordered := make([]string, 0, len(workout.CategoryTargets))
	seen := make(map[string]struct{}, len(workout.CategoryTargets))
	for _, categoryKey := range dedupeStrings(append(append([]string(nil), workout.PrimaryCategories...), workout.SecondaryCategories...)) {
		if _, ok := workout.CategoryTargets[categoryKey]; !ok {
			continue
		}
		if _, exists := seen[categoryKey]; exists {
			continue
		}

		seen[categoryKey] = struct{}{}
		ordered = append(ordered, categoryKey)
	}

	if len(ordered) == len(workout.CategoryTargets) {
		return ordered
	}

	remaining := make([]string, 0, len(workout.CategoryTargets)-len(ordered))
	for categoryKey := range workout.CategoryTargets {
		if _, exists := seen[categoryKey]; exists {
			continue
		}

		remaining = append(remaining, categoryKey)
	}
	sort.Strings(remaining)

	return append(ordered, remaining...)
}

func newAIWorkoutTraceID(userID uint) string {
	return fmt.Sprintf("u%d-%d", userID, time.Now().UnixNano())
}

func logAIWorkoutTrace(traceID, stage, format string, args ...any) {
	message := strings.TrimSpace(fmt.Sprintf(format, args...))
	if message == "" {
		log.Printf("ai_workout_generate trace=%s stage=%s", traceID, stage)
		return
	}

	log.Printf("ai_workout_generate trace=%s stage=%s %s", traceID, stage, message)
}

func summarizeAIWorkoutBlueprintForLog(blueprint aiWorkoutBlueprint) string {
	if len(blueprint.Workouts) == 0 {
		return "nenhum treino"
	}

	parts := make([]string, 0, len(blueprint.Workouts))
	for _, workout := range blueprint.Workouts {
		parts = append(parts, fmt.Sprintf("%s(exercicios=%d;cotas=%s)", workout.Name, workout.TargetExercises, formatAIWorkoutCategoryTargets(workout.CategoryTargets)))
	}

	return strings.Join(parts, " | ")
}

func summarizeAIWorkoutToolDefinitionsForLog(tools []openAIChatCompletionTool) string {
	if len(tools) == 0 {
		return "nenhuma"
	}

	names := make([]string, 0, len(tools))
	for _, tool := range tools {
		names = append(names, strings.TrimSpace(tool.Function.Name))
	}

	return strings.Join(names, ",")
}

func summarizeAIWorkoutToolCallsForLog(toolCalls []openAIChatCompletionToolCall) string {
	if len(toolCalls) == 0 {
		return "nenhuma"
	}

	names := make([]string, 0, len(toolCalls))
	for _, toolCall := range toolCalls {
		names = append(names, strings.TrimSpace(toolCall.Function.Name))
	}

	return strings.Join(names, ",")
}

func summarizeAIWorkoutSubmissionForLog(submission aiWorkoutSubmission) string {
	if len(submission.Categories) == 0 {
		return "nenhuma"
	}

	parts := make([]string, 0, len(submission.Categories))
	workoutNames := make([]string, 0, len(submission.Categories))
	for workoutName := range submission.Categories {
		workoutNames = append(workoutNames, workoutName)
	}
	sort.Strings(workoutNames)

	for _, workoutName := range workoutNames {
		groupedMachines := submission.Categories[workoutName]
		groupParts := make([]string, 0, len(groupedMachines))
		for _, categoryKey := range sortedAIWorkoutSubmissionGroupKeys(groupedMachines) {
			groupParts = append(groupParts, fmt.Sprintf("%s=%d", categoryKey, len(groupedMachines[categoryKey])))
		}

		parts = append(parts, fmt.Sprintf("%s(%s)", strings.TrimSpace(workoutName), strings.Join(groupParts, ",")))
	}

	return strings.Join(parts, " | ")
}

func sortedAIWorkoutSubmissionGroupKeys(groupedMachines map[string][]aiWorkoutSubmissionMachine) []string {
	keys := make([]string, 0, len(groupedMachines))
	for categoryKey := range groupedMachines {
		keys = append(keys, categoryKey)
	}
	sort.Strings(keys)

	return keys
}

func formatAIWorkoutContextError(err error) string {
	if err == nil {
		return ""
	}

	return compactAIWorkoutLogText(err.Error(), 300)
}

func compactAIWorkoutLogText(value string, limit int) string {
	normalized := strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
	if limit <= 0 || len(normalized) <= limit {
		return normalized
	}

	if limit <= 3 {
		return normalized[:limit]
	}

	return normalized[:limit-3] + "..."
}

func errorString(err error) string {
	if err == nil {
		return ""
	}

	return err.Error()
}

func min(left, right int) int {
	if left < right {
		return left
	}

	return right
}

func validateGeneratedWorkoutTitleCoverage(categoryName string, machineCounts map[string]int) error {
	requiredCategories := extractMentionedWorkoutCategories(categoryName)
	if len(requiredCategories) == 0 {
		return nil
	}

	missing := make([]string, 0, len(requiredCategories))
	for _, categoryKey := range requiredCategories {
		if machineCounts[categoryKey] == 0 {
			missing = append(missing, categoryKey)
		}
	}

	if len(missing) == 0 {
		return nil
	}

	present := make([]string, 0, len(machineCounts))
	for _, categoryKey := range allMachineCategoryKeys() {
		if machineCounts[categoryKey] > 0 {
			present = append(present, categoryKey)
		}
	}

	return fmt.Errorf(
		`o treino %q cita os grupos %s no titulo, mas os exercicios cobrem apenas %s; faltam exercicios de %s`,
		strings.TrimSpace(categoryName),
		formatWorkoutCategoryList(requiredCategories),
		formatWorkoutCategoryList(present),
		formatWorkoutCategoryList(missing),
	)
}

func validateGeneratedWorkoutBlueprintCoverage(expectedWorkout aiWorkoutBlueprintWorkout, machineCounts map[string]int) error {
	unexpected := make([]string, 0)
	mismatches := make([]string, 0)
	checked := make(map[string]struct{}, len(machineCounts))

	for categoryKey, actualCount := range machineCounts {
		checked[categoryKey] = struct{}{}
		expectedCount, ok := expectedWorkout.CategoryTargets[categoryKey]
		if !ok {
			unexpected = append(unexpected, categoryKey)
			continue
		}

		if actualCount != expectedCount {
			mismatches = append(mismatches, fmt.Sprintf("%s esperado=%d recebido=%d", categoryKey, expectedCount, actualCount))
		}
	}

	for categoryKey, expectedCount := range expectedWorkout.CategoryTargets {
		if _, alreadyChecked := checked[categoryKey]; alreadyChecked {
			continue
		}
		actualCount := machineCounts[categoryKey]
		if actualCount != expectedCount {
			mismatches = append(mismatches, fmt.Sprintf("%s esperado=%d recebido=%d", categoryKey, expectedCount, actualCount))
		}
	}

	sort.Strings(unexpected)
	sort.Strings(mismatches)

	if len(unexpected) == 0 && len(mismatches) == 0 {
		return nil
	}

	parts := []string{
		fmt.Sprintf("o treino %q nao respeitou as cotas do blueprint", expectedWorkout.Name),
		fmt.Sprintf("cotas esperadas: %s", formatAIWorkoutCategoryTargets(expectedWorkout.CategoryTargets)),
		fmt.Sprintf("cobertura recebida: %s", formatAIWorkoutCategoryTargets(machineCounts)),
	}

	if len(unexpected) > 0 {
		parts = append(parts, fmt.Sprintf("categorias inesperadas: %s", strings.Join(unexpected, ", ")))
	}
	if len(mismatches) > 0 {
		parts = append(parts, fmt.Sprintf("diferencas: %s", strings.Join(mismatches, "; ")))
	}

	return errors.New(strings.Join(parts, " | "))
}

func extractMentionedWorkoutCategories(categoryName string) []string {
	normalizedName := normalizeWorkoutTitleText(categoryName)
	if normalizedName == "" {
		return nil
	}

	categoryAliases := map[string][]string{
		string(models.MachineCategoryPeito):     {"peito", "peitoral", "peitorais"},
		string(models.MachineCategoryCostas):    {"costas", "dorsal", "dorsais", "dorso"},
		string(models.MachineCategoryPernas):    {"perna", "pernas", "quadriceps", "posterior", "posteriores", "gluteo", "gluteos", "panturrilha", "panturrilhas"},
		string(models.MachineCategoryOmbros):    {"ombro", "ombros", "deltoide", "deltoides"},
		string(models.MachineCategoryBiceps):    {"biceps", "bicep"},
		string(models.MachineCategoryTriceps):   {"triceps", "tricep"},
		string(models.MachineCategoryAntebraco): {"antebraco", "antebraço", "punho", "pegada", "grip"},
		string(models.MachineCategoryCore):      {"core", "abdomen", "abdome", "abdominal", "abdominais", "obliquo", "obliquos", "lombar"},
		string(models.MachineCategoryCardio):    {"cardio", "aerobico", "aerobicos", "condicionamento"},
	}

	type categoryMatch struct {
		key   string
		index int
	}

	matches := make([]categoryMatch, 0, len(categoryAliases))
	for _, categoryKey := range allMachineCategoryKeys() {
		aliases := categoryAliases[categoryKey]
		matchIndex := -1
		for _, alias := range aliases {
			currentIndex := strings.Index(normalizedName, alias)
			if currentIndex == -1 {
				continue
			}

			if matchIndex == -1 || currentIndex < matchIndex {
				matchIndex = currentIndex
			}
		}

		if matchIndex >= 0 {
			matches = append(matches, categoryMatch{
				key:   categoryKey,
				index: matchIndex,
			})
		}
	}

	sort.SliceStable(matches, func(i, j int) bool {
		if matches[i].index == matches[j].index {
			return matches[i].key < matches[j].key
		}

		return matches[i].index < matches[j].index
	})

	result := make([]string, 0, len(matches))
	for _, match := range matches {
		result = append(result, match.key)
	}

	return result
}

func normalizeWorkoutTitleText(value string) string {
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

	return normalizeGeneratedWorkoutText(replacer.Replace(strings.TrimSpace(value)))
}

func formatWorkoutCategoryList(categoryKeys []string) string {
	if len(categoryKeys) == 0 {
		return "nenhum grupo"
	}

	return "[" + strings.Join(categoryKeys, ", ") + "]"
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
