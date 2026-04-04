package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	dtos "fitcha/internal/dtos/aiWorkout"
	"fitcha/internal/repositories"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type AIWorkoutService struct {
	plans      repositories.IPlanRepository
	httpClient *http.Client
	apiKey     string
	model      string
}

func NewAIWorkoutService(planRepo repositories.IPlanRepository) *AIWorkoutService {
	model := strings.TrimSpace(os.Getenv("OPENAI_MODEL"))
	if model == "" {
		model = "gpt-4.1-mini"
	}

	return &AIWorkoutService{
		plans:      planRepo,
		httpClient: &http.Client{Timeout: 45 * time.Second},
		apiKey:     strings.TrimSpace(os.Getenv("OPENAI_API_KEY")),
		model:      model,
	}
}

func (s *AIWorkoutService) Generate(userID uint, input dtos.GenerateAIWorkoutRequest) (dtos.GenerateAIWorkoutResponse, error) {
	if s.apiKey == "" {
		return dtos.GenerateAIWorkoutResponse{}, errors.New("configure OPENAI_API_KEY para gerar treinos com IA")
	}

	if _, err := s.plans.FindActiveByUserID(userID, time.Now()); err != nil {
		return dtos.GenerateAIWorkoutResponse{}, errors.New("seu plano com IA nao esta ativo no momento")
	}

	response, err := s.requestWorkoutPlan(input)
	if err != nil {
		return dtos.GenerateAIWorkoutResponse{}, err
	}

	if len(response.Categories) == 0 {
		return dtos.GenerateAIWorkoutResponse{}, errors.New("a IA nao retornou categorias de treino validas")
	}

	return response, nil
}

func (s *AIWorkoutService) requestWorkoutPlan(input dtos.GenerateAIWorkoutRequest) (dtos.GenerateAIWorkoutResponse, error) {
	payload := map[string]any{
		"model": s.model,
		"messages": []map[string]string{
			{
				"role":    "system",
				"content": "Voce e um personal trainer especialista em musculacao. Responda apenas com JSON valido.",
			},
			{
				"role":    "user",
				"content": buildAIWorkoutPrompt(input),
			},
		},
		"response_format": map[string]string{
			"type": "json_object",
		},
		"temperature": 0.7,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return dtos.GenerateAIWorkoutResponse{}, err
	}

	req, err := http.NewRequest(http.MethodPost, "https://api.openai.com/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return dtos.GenerateAIWorkoutResponse{}, err
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
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

	content := strings.TrimSpace(completion.FirstMessageContent())
	if content == "" {
		return dtos.GenerateAIWorkoutResponse{}, errors.New("a OpenAI retornou uma resposta vazia")
	}

	var parsed dtos.GenerateAIWorkoutResponse
	if err := json.Unmarshal([]byte(content), &parsed); err != nil {
		return dtos.GenerateAIWorkoutResponse{}, errors.New("a OpenAI retornou um JSON invalido")
	}

	if err := validateGeneratedWorkout(parsed); err != nil {
		return dtos.GenerateAIWorkoutResponse{}, err
	}

	return parsed, nil
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

	return strings.Join([]string{
		"Crie um plano de treino de musculacao com as seguintes especificacoes:",
		"",
		fmt.Sprintf("- Altura: %scm", input.Height),
		fmt.Sprintf("- Peso: %skg", input.Weight),
		fmt.Sprintf("- Dias por semana: %d", input.DaysPerWeek),
		fmt.Sprintf("- Intensidade: %s", intensityMap[input.Intensity]),
		fmt.Sprintf("- Objetivo: %s", goalMap[input.Goal]),
		"",
		"Leve em conta o biotipo do usuario (altura e peso) para calibrar as cargas sugeridas.",
		fmt.Sprintf("Distribua os grupos musculares de forma equilibrada entre os %d dias.", input.DaysPerWeek),
		"Para cada dia, liste exercicios de musculacao com peso sugerido para 3 series em kg.",
		"Responda APENAS com JSON valido, sem markdown, sem explicacoes.",
		"",
		"Formato obrigatorio:",
		`{"categories":[{"name":"Nome do grupo","days":[1,4],"machines":[{"name":"Nome do exercicio","sets":[40,35,30]}]}]}`,
		"",
		"Regras:",
		"- Os dias devem ser numeros de 0 a 6.",
		"- Cada exercicio precisa ter exatamente 3 pesos em kg.",
		"- Nao repita dias fora da faixa 0-6.",
		"- Nao inclua texto fora do JSON.",
	}, "\n")
}

func validateGeneratedWorkout(response dtos.GenerateAIWorkoutResponse) error {
	for _, category := range response.Categories {
		if strings.TrimSpace(category.Name) == "" {
			return errors.New("a IA retornou uma categoria sem nome")
		}

		if len(category.Days) == 0 {
			return errors.New("a IA retornou uma categoria sem dias de treino")
		}

		for _, day := range category.Days {
			if day < 0 || day > 6 {
				return errors.New("a IA retornou um dia de treino fora do intervalo permitido")
			}
		}

		if len(category.Machines) == 0 {
			return errors.New("a IA retornou uma categoria sem exercicios")
		}

		for _, machine := range category.Machines {
			if strings.TrimSpace(machine.Name) == "" {
				return errors.New("a IA retornou um exercicio sem nome")
			}

			if len(machine.Sets) != 3 {
				return errors.New("a IA retornou um exercicio sem 3 series")
			}
		}
	}

	return nil
}

type openAIChatCompletionResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func (r openAIChatCompletionResponse) FirstMessageContent() string {
	if len(r.Choices) == 0 {
		return ""
	}

	return r.Choices[0].Message.Content
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
