package services

import (
	"errors"
	dtos "fitcha/internal/dtos/aiWorkout"
	"fitcha/internal/models"
	"fmt"
	"math"
	"sort"
	"strings"
)

type aiWorkoutBlueprint struct {
	TemplateKey               string
	TemplateName              string
	TargetExercisesPerWorkout int
	Workouts                  []aiWorkoutBlueprintWorkout
}

type aiWorkoutBlueprintWorkout struct {
	Name                string
	PrimaryCategories   []string
	SecondaryCategories []string
	TargetExercises     int
	CategoryTargets     map[string]int
	Notes               string
}

func buildAIWorkoutBlueprint(input dtos.GenerateAIWorkoutRequest, knowledge aiWorkoutKnowledge) (aiWorkoutBlueprint, error) {
	template, err := selectAIWorkoutSplitTemplate(input, knowledge)
	if err != nil {
		return aiWorkoutBlueprint{}, err
	}

	targetExercises := resolveAIWorkoutTargetExercises(input)
	workouts := make([]aiWorkoutBlueprintWorkout, 0, len(template.Workouts))
	for _, templateWorkout := range template.Workouts {
		categoryTargets := buildAIWorkoutCategoryTargets(templateWorkout, targetExercises)
		workouts = append(workouts, aiWorkoutBlueprintWorkout{
			Name:                strings.TrimSpace(templateWorkout.Name),
			PrimaryCategories:   append([]string(nil), templateWorkout.PrimaryCategories...),
			SecondaryCategories: append([]string(nil), templateWorkout.SecondaryCategories...),
			TargetExercises:     targetExercises,
			CategoryTargets:     categoryTargets,
			Notes:               strings.TrimSpace(templateWorkout.Notes),
		})
	}

	blueprint := aiWorkoutBlueprint{
		TemplateKey:               template.Key,
		TemplateName:              template.DisplayName,
		TargetExercisesPerWorkout: targetExercises,
		Workouts:                  workouts,
	}

	if err := blueprint.validate(); err != nil {
		return aiWorkoutBlueprint{}, err
	}

	return blueprint, nil
}

func selectAIWorkoutSplitTemplate(input dtos.GenerateAIWorkoutRequest, knowledge aiWorkoutKnowledge) (aiWorkoutSplitTemplate, error) {
	if len(knowledge.SplitTemplates) == 0 {
		return aiWorkoutSplitTemplate{}, errors.New("nenhum template de divisao foi carregado")
	}

	type scoredTemplate struct {
		template aiWorkoutSplitTemplate
		score    int
	}

	preference := normalizeGeneratedWorkoutText(input.WorkoutSplit)
	scored := make([]scoredTemplate, 0, len(knowledge.SplitTemplates))
	for _, template := range knowledge.SplitTemplates {
		if !containsInt(template.DaysPerWeek, input.DaysPerWeek) {
			continue
		}

		score := template.Priority
		if containsTrimmed(template.RecommendedIntensities, input.Intensity) {
			score += 18
		}
		if containsTrimmed(template.RecommendedGoals, input.Goal) {
			score += 12
		}

		if input.Intensity == "leve" && template.BeginnerFriendly {
			score += 16
		}
		if input.Intensity == "intenso" && !template.BeginnerFriendly {
			score += 10
		}

		if preference != "" {
			for _, alias := range template.PreferredSplitAliases {
				normalizedAlias := normalizeGeneratedWorkoutText(alias)
				if normalizedAlias != "" && strings.Contains(preference, normalizedAlias) {
					score += 40
				}
			}

			if strings.Contains(preference, normalizeGeneratedWorkoutText(template.DisplayName)) {
				score += 30
			}
		}

		scored = append(scored, scoredTemplate{
			template: template,
			score:    score,
		})
	}

	if len(scored) == 0 {
		return aiWorkoutSplitTemplate{}, fmt.Errorf("nenhum template de divisao cobre %d dias por semana", input.DaysPerWeek)
	}

	sort.SliceStable(scored, func(i, j int) bool {
		if scored[i].score == scored[j].score {
			return scored[i].template.Key < scored[j].template.Key
		}

		return scored[i].score > scored[j].score
	})

	return scored[0].template, nil
}

func resolveAIWorkoutTargetExercises(input dtos.GenerateAIWorkoutRequest) int {
	explicitMachines, hasExplicitMachines := parseOptionalFloat(strings.TrimSpace(input.MachinesPerDay))
	hourEstimate, hasHourEstimate := estimateMachinesPerDayFromHours(strings.TrimSpace(input.HoursPerDay))

	switch {
	case hasExplicitMachines && hasHourEstimate:
		return clampAIWorkoutExerciseTarget(int(roundFloat((explicitMachines+hourEstimate)/2)), 4, 10)
	case hasExplicitMachines:
		return clampAIWorkoutExerciseTarget(int(roundFloat(explicitMachines)), 4, 10)
	case hasHourEstimate:
		return clampAIWorkoutExerciseTarget(int(roundFloat(hourEstimate)), 4, 10)
	default:
		return clampAIWorkoutExerciseTarget(defaultAssumedMachinesPerDay, 4, 10)
	}
}

func buildAIWorkoutCategoryTargets(workout aiWorkoutSplitTemplateWorkout, targetExercises int) map[string]int {
	primaryCategories := dedupeStrings(workout.PrimaryCategories)
	secondaryCategories := dedupeStrings(workout.SecondaryCategories)
	totalCategories := len(primaryCategories) + len(secondaryCategories)
	if totalCategories == 0 {
		return map[string]int{}
	}

	if targetExercises < totalCategories {
		targetExercises = totalCategories
	}

	targets := make(map[string]int, totalCategories)
	for _, categoryKey := range primaryCategories {
		targets[categoryKey] = 1
	}
	for _, categoryKey := range secondaryCategories {
		if _, exists := targets[categoryKey]; !exists {
			targets[categoryKey] = 1
		}
	}

	remaining := targetExercises - len(targets)
	if len(primaryCategories) > 0 && remaining > 0 {
		targets[primaryCategories[0]]++
		remaining--
	}

	for remaining > 0 {
		for _, categoryKey := range primaryCategories {
			targets[categoryKey]++
			remaining--
			if remaining == 0 {
				break
			}
		}

		if remaining == 0 {
			break
		}

		for _, categoryKey := range secondaryCategories {
			targets[categoryKey]++
			remaining--
			if remaining == 0 {
				break
			}
		}
	}

	return targets
}

func (b aiWorkoutBlueprint) validate() error {
	if len(b.Workouts) == 0 {
		return errors.New("o blueprint precisa conter ao menos um treino")
	}

	for _, workout := range b.Workouts {
		if strings.TrimSpace(workout.Name) == "" {
			return errors.New("o blueprint contem um treino sem nome")
		}

		if workout.TargetExercises <= 0 {
			return fmt.Errorf("o treino %q possui quantidade invalida de exercicios", workout.Name)
		}

		if len(workout.CategoryTargets) == 0 {
			return fmt.Errorf("o treino %q nao possui cotas por categoria", workout.Name)
		}

		total := 0
		for categoryKey, count := range workout.CategoryTargets {
			if !models.IsValidMachineCategoryKey(categoryKey) {
				return fmt.Errorf("o treino %q possui categoria invalida no blueprint: %s", workout.Name, categoryKey)
			}
			if count <= 0 {
				return fmt.Errorf("o treino %q possui cota invalida para a categoria %s", workout.Name, categoryKey)
			}
			total += count
		}

		if total != workout.TargetExercises {
			return fmt.Errorf("o treino %q exige %d exercicios, mas o blueprint soma %d", workout.Name, workout.TargetExercises, total)
		}
	}

	return nil
}

func (b aiWorkoutBlueprint) containsWorkoutName(name string) bool {
	normalizedName := normalizeGeneratedWorkoutText(name)
	for _, workout := range b.Workouts {
		if normalizeGeneratedWorkoutText(workout.Name) == normalizedName {
			return true
		}
	}

	return false
}

func (b aiWorkoutBlueprint) workoutNames() []string {
	names := make([]string, 0, len(b.Workouts))
	for _, workout := range b.Workouts {
		names = append(names, workout.Name)
	}

	return names
}

func buildAIWorkoutBlueprintPrompt(blueprint aiWorkoutBlueprint) string {
	lines := []string{
		"Blueprint local obrigatorio para esta geracao:",
		fmt.Sprintf("- Template escolhido: %s (%s)", blueprint.TemplateName, blueprint.TemplateKey),
		fmt.Sprintf("- Quantidade alvo de exercicios por treino: %d", blueprint.TargetExercisesPerWorkout),
		"",
		"Treinos obrigatorios:",
	}

	for index, workout := range blueprint.Workouts {
		lines = append(lines,
			fmt.Sprintf("%d. %s", index+1, workout.Name),
			fmt.Sprintf("   - Categorias primarias: %s", strings.Join(workout.PrimaryCategories, ", ")),
			fmt.Sprintf("   - Categorias secundarias: %s", formatWorkoutCategoryList(workout.SecondaryCategories)),
			fmt.Sprintf("   - Quantidade total de exercicios: %d", workout.TargetExercises),
			fmt.Sprintf("   - Cotas obrigatorias por categoria: %s", formatAIWorkoutCategoryTargets(workout.CategoryTargets)),
		)
		if strings.TrimSpace(workout.Notes) != "" {
			lines = append(lines, fmt.Sprintf("   - Nota do blueprint: %s", workout.Notes))
		}
	}

	return strings.Join(lines, "\n")
}

func formatAIWorkoutCategoryTargets(targets map[string]int) string {
	if len(targets) == 0 {
		return "nenhuma"
	}

	keys := make([]string, 0, len(targets))
	for categoryKey := range targets {
		keys = append(keys, categoryKey)
	}
	sort.Strings(keys)

	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		parts = append(parts, fmt.Sprintf("%s=%d", key, targets[key]))
	}

	return strings.Join(parts, ", ")
}

func dedupeStrings(values []string) []string {
	result := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed == "" {
			continue
		}
		if _, exists := seen[trimmed]; exists {
			continue
		}
		seen[trimmed] = struct{}{}
		result = append(result, trimmed)
	}

	return result
}

func containsInt(values []int, target int) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}

	return false
}

func containsTrimmed(values []string, target string) bool {
	trimmedTarget := strings.TrimSpace(target)
	for _, value := range values {
		if strings.TrimSpace(value) == trimmedTarget {
			return true
		}
	}

	return false
}

func roundFloat(value float64) float64 {
	return math.Round(value)
}

func clampAIWorkoutExerciseTarget(value, minimum, maximum int) int {
	if value < minimum {
		return minimum
	}
	if value > maximum {
		return maximum
	}

	return value
}
