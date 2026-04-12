package services

import (
	"reflect"
	"strings"
	"testing"

	dtos "fitcha/internal/dtos/aiWorkout"
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
