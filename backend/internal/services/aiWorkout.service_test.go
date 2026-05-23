package services

import (
	"context"
	"errors"
	"io"
	"net/http"
	"reflect"
	"strings"
	"testing"

	dtos "fitcha/internal/dtos/aiWorkout"
	"fitcha/internal/models"
)

func TestNormalizeSelectedDaysSortsAndDeduplicates(t *testing.T) {
	got, err := normalizeSelectedDays([]int{5, 1, 3, 5, 1})
	if err != nil {
		t.Fatalf("normalizeSelectedDays returned error: %v", err)
	}

	want := []int{1, 3, 5}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("normalizeSelectedDays mismatch: got %v want %v", got, want)
	}
}

func TestBuildAIWorkoutResponseSchemaRestrictsAllowedDays(t *testing.T) {
	schema := buildAIWorkoutResponseSchema([]int{1, 3, 5})

	properties := schema["properties"].(map[string]any)
	categories := properties["categories"].(map[string]any)
	categoryItems := categories["items"].(map[string]any)
	categoryProperties := categoryItems["properties"].(map[string]any)
	days := categoryProperties["days"].(map[string]any)
	dayItems := days["items"].(map[string]any)

	got := dayItems["enum"].([]int)
	want := []int{1, 3, 5}

	if !reflect.DeepEqual(got, want) {
		t.Fatalf("days enum mismatch: got %v want %v", got, want)
	}
}

func TestBuildAIWorkoutPromptExplainsDayIndexConvention(t *testing.T) {
	prompt := buildAIWorkoutPrompt(dtos.GenerateAIWorkoutRequest{
		Height:       "180",
		Weight:       "80",
		DaysPerWeek:  5,
		SelectedDays: []int{1, 2, 3, 4, 5},
		Intensity:    "moderado",
		Goal:         "hipertrofia",
	})

	if !strings.Contains(prompt, "0=domingo, 1=segunda, 2=terca, 3=quarta, 4=quinta, 5=sexta, 6=sabado") {
		t.Fatalf("prompt does not explain the fixed day convention: %s", prompt)
	}

	if !strings.Contains(prompt, "Dias exatos escolhidos (indices obrigatorios): [1, 2, 3, 4, 5]") {
		t.Fatalf("prompt does not include the selected day indexes: %s", prompt)
	}
}

func TestValidateGeneratedWorkoutRejectsDayOutsideSelection(t *testing.T) {
	err := validateGeneratedWorkout(
		dtos.GenerateAIWorkoutResponse{
			Categories: []dtos.GeneratedCategory{
				{
					Name: "Peito",
					Days: []int{0},
					Machines: []dtos.GeneratedMachine{
						{Name: "Supino reto", Sets: []float64{40, 35, 30}},
					},
				},
			},
		},
		[]int{1, 2, 3, 4, 5},
	)
	if err == nil {
		t.Fatal("expected validateGeneratedWorkout to reject an unselected day")
	}

	if !strings.Contains(err.Error(), "domingo") {
		t.Fatalf("expected error to mention the invalid day, got: %v", err)
	}
}

func TestValidateGeneratedWorkoutRejectsDuplicateDaysInCategory(t *testing.T) {
	err := validateGeneratedWorkout(
		dtos.GenerateAIWorkoutResponse{
			Categories: []dtos.GeneratedCategory{
				{
					Name: "Upper",
					Days: []int{1, 1, 3, 5},
					Machines: []dtos.GeneratedMachine{
						{Name: "Supino reto", Sets: []float64{40, 35, 30}},
					},
				},
			},
		},
		[]int{1, 3, 5},
	)
	if err == nil {
		t.Fatal("expected validateGeneratedWorkout to reject duplicate days in a category")
	}

	if !strings.Contains(err.Error(), "duplicados") {
		t.Fatalf("expected error to mention duplicate days, got: %v", err)
	}
}

func TestValidateGeneratedWorkoutRejectsMissingSelectedDays(t *testing.T) {
	err := validateGeneratedWorkout(
		dtos.GenerateAIWorkoutResponse{
			Categories: []dtos.GeneratedCategory{
				{
					Name: "Upper",
					Days: []int{1, 3},
					Machines: []dtos.GeneratedMachine{
						{Name: "Supino inclinado", Sets: []float64{32, 30, 28}},
					},
				},
			},
		},
		[]int{1, 3, 5},
	)
	if err == nil {
		t.Fatal("expected validateGeneratedWorkout to reject missing selected days")
	}

	if !strings.Contains(err.Error(), "sexta") {
		t.Fatalf("expected error to mention the missing day, got: %v", err)
	}
}

func TestBuildGeneratedWeekInputsMapsCategoriesToDays(t *testing.T) {
	got := buildGeneratedWeekInputs(dtos.GenerateAIWorkoutResponse{
		Categories: []dtos.GeneratedCategory{
			{
				Name: "Peito",
				Days: []int{1, 3},
				Machines: []dtos.GeneratedMachine{
					{Name: "Supino reto", Sets: []float64{40, 35, 30}},
				},
			},
		},
	})

	if len(got[1]) != 1 || len(got[3]) != 1 {
		t.Fatalf("expected generated machines on both selected days, got: %#v", got)
	}

	if got[1][0].CategoryKey != "peito" {
		t.Fatalf("expected peito category key, got: %s", got[1][0].CategoryKey)
	}

	wantDescription := "Peito - Series sugeridas (kg): 40 / 35 / 30"
	if got[1][0].Description != wantDescription {
		t.Fatalf("description mismatch: got %q want %q", got[1][0].Description, wantDescription)
	}
}

func TestInferGeneratedMachineCategoryKeyIgnoresAccents(t *testing.T) {
	got := inferGeneratedMachineCategoryKey("Glúteos e pernas", "Agachamento livre")

	if got != "pernas" {
		t.Fatalf("expected pernas category key, got: %s", got)
	}
}

type stubUserRepository struct {
	user         models.User
	findErr      error
	consumeErr   error
	consumeCalls int
}

func (r *stubUserRepository) FindByEmail(email string) (models.User, error) {
	return models.User{}, nil
}

func (r *stubUserRepository) FindByID(userID uint) (models.User, error) {
	if r.findErr != nil {
		return models.User{}, r.findErr
	}

	return r.user, nil
}

func (r *stubUserRepository) CreateUser(user models.User) (models.User, error) {
	return user, nil
}

func (r *stubUserRepository) VerifyUser(userID uint) (models.User, error) {
	r.user.Verified = true
	return r.user, nil
}

func (r *stubUserRepository) UpdatePassword(userID uint, password string) (models.User, error) {
	return r.user, nil
}

func (r *stubUserRepository) AddCredits(userID uint, amount int) (models.User, error) {
	r.user.Credits += amount
	return r.user, nil
}

func (r *stubUserRepository) ConsumeCredit(userID uint) (models.User, error) {
	r.consumeCalls++
	if r.consumeErr != nil {
		return models.User{}, r.consumeErr
	}

	r.user.Credits -= 1
	return r.user, nil
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (fn roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return fn(req)
}

func newAIWorkoutServiceForTest(userRepo *stubUserRepository, transport roundTripFunc) *AIWorkoutService {
	return &AIWorkoutService{
		users: userRepo,
		httpClient: &http.Client{
			Transport: transport,
		},
		apiKey: "test-api-key",
		model:  defaultAIWorkoutModel,
	}
}

func validGenerateRequest() dtos.GenerateAIWorkoutRequest {
	return dtos.GenerateAIWorkoutRequest{
		Height:       "180",
		Weight:       "80",
		SelectedDays: []int{1, 3, 5},
		Intensity:    "moderado",
		Goal:         "hipertrofia",
	}
}

func validOpenAIChatCompletionBody() string {
	return `{"choices":[{"message":{"content":"{\"categories\":[{\"name\":\"Peito\",\"days\":[1,3,5],\"machines\":[{\"name\":\"Supino reto\",\"sets\":[40,35,30]}]}]}"}}]}`
}

func TestGenerateDoesNotConsumeCreditsWhenRequestIsCanceled(t *testing.T) {
	userRepo := &stubUserRepository{
		user: models.User{Credits: 3},
	}

	ctx, cancel := context.WithCancel(context.Background())
	service := newAIWorkoutServiceForTest(userRepo, func(req *http.Request) (*http.Response, error) {
		cancel()
		return &http.Response{
			StatusCode: http.StatusOK,
			Body:       io.NopCloser(strings.NewReader(validOpenAIChatCompletionBody())),
			Header:     make(http.Header),
		}, nil
	})

	_, err := service.Generate(ctx, 1, validGenerateRequest())
	if err == nil {
		t.Fatal("expected canceled request to return an error")
	}

	if !strings.Contains(err.Error(), "cancelada") {
		t.Fatalf("expected cancellation error, got: %v", err)
	}

	if userRepo.consumeCalls != 0 {
		t.Fatalf("expected no credit consumption on canceled request, got %d calls", userRepo.consumeCalls)
	}
}

func TestGenerateDoesNotConsumeCreditsWhenAIResponseIsInvalid(t *testing.T) {
	userRepo := &stubUserRepository{
		user: models.User{Credits: 3},
	}

	service := newAIWorkoutServiceForTest(userRepo, func(req *http.Request) (*http.Response, error) {
		return &http.Response{
			StatusCode: http.StatusOK,
			Body: io.NopCloser(strings.NewReader(
				`{"choices":[{"message":{"content":"{\"categories\":["}}]}`,
			)),
			Header: make(http.Header),
		}, nil
	})

	_, err := service.Generate(context.Background(), 1, validGenerateRequest())
	if err == nil {
		t.Fatal("expected invalid AI response to return an error")
	}

	if !strings.Contains(err.Error(), "JSON invalido") {
		t.Fatalf("expected invalid JSON error, got: %v", err)
	}

	if userRepo.consumeCalls != 0 {
		t.Fatalf("expected no credit consumption on invalid AI response, got %d calls", userRepo.consumeCalls)
	}
}

func TestMapAIWorkoutRequestErrorRecognizesContextCancellation(t *testing.T) {
	err := mapAIWorkoutRequestError(context.Canceled)
	if err == nil {
		t.Fatal("expected context cancellation to be mapped")
	}

	if !strings.Contains(err.Error(), "cancelada") {
		t.Fatalf("unexpected mapped message: %v", err)
	}

	if mapped := mapAIWorkoutRequestError(errors.New("outro erro")); mapped != nil {
		t.Fatalf("expected unrelated errors not to be mapped, got: %v", mapped)
	}
}
