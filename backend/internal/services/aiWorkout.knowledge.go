package services

import (
	_ "embed"
	"encoding/json"
	dtos "fitcha/internal/dtos/aiWorkout"
	"fmt"
	"sort"
	"strings"
)

//go:embed aiworkout_knowledge/training_principles.json
var aiWorkoutTrainingPrinciplesJSON []byte

//go:embed aiworkout_knowledge/progression_rules.json
var aiWorkoutProgressionRulesJSON []byte

//go:embed aiworkout_knowledge/split_templates.json
var aiWorkoutSplitTemplatesJSON []byte

//go:embed aiworkout_knowledge/good_examples.json
var aiWorkoutGoodExamplesJSON []byte

var aiWorkoutSourceNotes string

type aiWorkoutKnowledge struct {
	TrainingPrinciples  []aiWorkoutTrainingPrinciple
	TraditionalDefaults aiWorkoutTraditionalDefaults
	ProgressionRules    []aiWorkoutProgressionRule
	GoalBiases          []aiWorkoutGoalBias
	SplitTemplates      []aiWorkoutSplitTemplate
	GoodExamples        []aiWorkoutGoodExample
	SourceNotes         string
}

type aiWorkoutTrainingPrinciplesFile struct {
	Version             int                          `json:"version"`
	Principles          []aiWorkoutTrainingPrinciple `json:"principles"`
	TraditionalDefaults aiWorkoutTraditionalDefaults `json:"traditional_defaults"`
}

type aiWorkoutProgressionRulesFile struct {
	Version                int                        `json:"version"`
	WeeklyProgressionRules []aiWorkoutProgressionRule `json:"weekly_progression_rules"`
	GoalBiases             []aiWorkoutGoalBias        `json:"goal_biases"`
}

type aiWorkoutSplitTemplatesFile struct {
	Version   int                      `json:"version"`
	Templates []aiWorkoutSplitTemplate `json:"templates"`
}

type aiWorkoutGoodExamplesFile struct {
	Version  int                    `json:"version"`
	Examples []aiWorkoutGoodExample `json:"examples"`
}

type aiWorkoutTrainingPrinciple struct {
	Key        string   `json:"key"`
	Title      string   `json:"title"`
	Summary    string   `json:"summary"`
	Rules      []string `json:"rules"`
	SourceRefs []string `json:"source_refs"`
}

type aiWorkoutTraditionalDefaults struct {
	MainRepRange         string `json:"main_rep_range"`
	AccessoryRepRange    string `json:"accessory_rep_range"`
	RestMainSeconds      string `json:"rest_main_seconds"`
	RestAccessorySeconds string `json:"rest_accessory_seconds"`
	TempoGuidance        string `json:"tempo_guidance"`
	FrequencyPerWeek     string `json:"frequency_per_week"`
	ExerciseOrder        string `json:"exercise_order"`
}

type aiWorkoutProgressionRule struct {
	Key        string                     `json:"key"`
	AppliesTo  aiWorkoutRuleApplicability `json:"applies_to"`
	Guidance   string                     `json:"guidance"`
	SourceRefs []string                   `json:"source_refs"`
}

type aiWorkoutRuleApplicability struct {
	Intensities []string `json:"intensities"`
	Goals       []string `json:"goals"`
}

type aiWorkoutGoalBias struct {
	Goal     string `json:"goal"`
	Guidance string `json:"guidance"`
}

type aiWorkoutSplitTemplate struct {
	Key                    string                          `json:"key"`
	DisplayName            string                          `json:"display_name"`
	PreferredSplitAliases  []string                        `json:"preferred_split_aliases"`
	DaysPerWeek            []int                           `json:"days_per_week"`
	RecommendedIntensities []string                        `json:"recommended_intensities"`
	RecommendedGoals       []string                        `json:"recommended_goals"`
	BeginnerFriendly       bool                            `json:"beginner_friendly"`
	Priority               int                             `json:"priority"`
	Description            string                          `json:"description"`
	SourceRefs             []string                        `json:"source_refs"`
	Workouts               []aiWorkoutSplitTemplateWorkout `json:"workouts"`
}

type aiWorkoutSplitTemplateWorkout struct {
	Name                string   `json:"name"`
	PrimaryCategories   []string `json:"primary_categories"`
	SecondaryCategories []string `json:"secondary_categories"`
	Notes               string   `json:"notes"`
}

type aiWorkoutGoodExample struct {
	Key          string                        `json:"key"`
	Label        string                        `json:"label"`
	InputProfile aiWorkoutExampleInputProfile  `json:"input_profile"`
	WhyItIsGood  []string                      `json:"why_it_is_good"`
	Workouts     []aiWorkoutGoodExampleWorkout `json:"workouts"`
	SourceRefs   []string                      `json:"source_refs"`
}

type aiWorkoutExampleInputProfile struct {
	DaysPerWeek int    `json:"days_per_week"`
	Intensity   string `json:"intensity"`
	Goal        string `json:"goal"`
	Preference  string `json:"preference"`
}

type aiWorkoutGoodExampleWorkout struct {
	Name    string   `json:"name"`
	Pattern []string `json:"pattern"`
}

func mustLoadAIWorkoutKnowledge() aiWorkoutKnowledge {
	var principlesFile aiWorkoutTrainingPrinciplesFile
	if err := json.Unmarshal(aiWorkoutTrainingPrinciplesJSON, &principlesFile); err != nil {
		panic(fmt.Sprintf("nao foi possivel carregar training_principles.json: %v", err))
	}

	var progressionFile aiWorkoutProgressionRulesFile
	if err := json.Unmarshal(aiWorkoutProgressionRulesJSON, &progressionFile); err != nil {
		panic(fmt.Sprintf("nao foi possivel carregar progression_rules.json: %v", err))
	}

	var splitTemplatesFile aiWorkoutSplitTemplatesFile
	if err := json.Unmarshal(aiWorkoutSplitTemplatesJSON, &splitTemplatesFile); err != nil {
		panic(fmt.Sprintf("nao foi possivel carregar split_templates.json: %v", err))
	}

	var goodExamplesFile aiWorkoutGoodExamplesFile
	if err := json.Unmarshal(aiWorkoutGoodExamplesJSON, &goodExamplesFile); err != nil {
		panic(fmt.Sprintf("nao foi possivel carregar good_examples.json: %v", err))
	}

	return aiWorkoutKnowledge{
		TrainingPrinciples:  principlesFile.Principles,
		TraditionalDefaults: principlesFile.TraditionalDefaults,
		ProgressionRules:    progressionFile.WeeklyProgressionRules,
		GoalBiases:          progressionFile.GoalBiases,
		SplitTemplates:      splitTemplatesFile.Templates,
		GoodExamples:        goodExamplesFile.Examples,
		SourceNotes:         strings.TrimSpace(aiWorkoutSourceNotes),
	}
}

func buildAIWorkoutKnowledgePrompt(knowledge aiWorkoutKnowledge, input dtos.GenerateAIWorkoutRequest, blueprint aiWorkoutBlueprint) string {
	lines := []string{
		"Base de conhecimento local ja selecionada para esta geracao:",
		"",
		"Principios principais:",
	}

	for _, principle := range knowledge.TrainingPrinciples {
		lines = append(lines, fmt.Sprintf("- %s: %s", principle.Title, principle.Summary))
		for _, rule := range principle.Rules {
			lines = append(lines, fmt.Sprintf("  - %s", rule))
		}
	}

	lines = append(lines, "")
	lines = append(lines, "Bias por objetivo:")
	if goalBias, ok := findAIWorkoutGoalBias(knowledge, input.Goal); ok {
		lines = append(lines, fmt.Sprintf("- %s", goalBias.Guidance))
	}

	lines = append(lines, "")
	lines = append(lines, "Regras de progressao e execucao:")
	for _, rule := range knowledge.ProgressionRules {
		if !rule.AppliesTo.matches(input.Intensity, input.Goal) {
			continue
		}

		lines = append(lines, fmt.Sprintf("- %s", rule.Guidance))
	}

	lines = append(lines, "")
	lines = append(lines, "Defaults tradicionais de referencia:")
	lines = append(lines,
		fmt.Sprintf("- Compostos principais: %s repeticoes", knowledge.TraditionalDefaults.MainRepRange),
		fmt.Sprintf("- Acessorios: %s repeticoes", knowledge.TraditionalDefaults.AccessoryRepRange),
		fmt.Sprintf("- Descanso nos principais: %s segundos", knowledge.TraditionalDefaults.RestMainSeconds),
		fmt.Sprintf("- Descanso nos acessorios: %s segundos", knowledge.TraditionalDefaults.RestAccessorySeconds),
		fmt.Sprintf("- Cadencia: %s", knowledge.TraditionalDefaults.TempoGuidance),
	)

	lines = append(lines, "")
	lines = append(lines, "Exemplos bons e curtos para guiar o padrao de selecao:")
	for _, example := range selectRelevantAIWorkoutExamples(knowledge, input, blueprint) {
		lines = append(lines, fmt.Sprintf("- Exemplo %s", example.Label))
		lines = append(lines, fmt.Sprintf("  - Quando usar: %d dias/semana, intensidade %s, objetivo %s, preferencia %s", example.InputProfile.DaysPerWeek, example.InputProfile.Intensity, example.InputProfile.Goal, example.InputProfile.Preference))
		lines = append(lines, fmt.Sprintf("  - Por que e bom: %s", strings.Join(example.WhyItIsGood, "; ")))
		for _, workout := range example.Workouts {
			lines = append(lines, fmt.Sprintf("  - %s => %s", workout.Name, strings.Join(workout.Pattern, ", ")))
		}
	}

	return strings.Join(lines, "\n")
}

func findAIWorkoutGoalBias(knowledge aiWorkoutKnowledge, goal string) (aiWorkoutGoalBias, bool) {
	for _, bias := range knowledge.GoalBiases {
		if strings.TrimSpace(bias.Goal) == strings.TrimSpace(goal) {
			return bias, true
		}
	}

	return aiWorkoutGoalBias{}, false
}

func (a aiWorkoutRuleApplicability) matches(intensity, goal string) bool {
	return containsTrimmed(a.Intensities, intensity) && containsTrimmed(a.Goals, goal)
}

func selectRelevantAIWorkoutExamples(knowledge aiWorkoutKnowledge, input dtos.GenerateAIWorkoutRequest, blueprint aiWorkoutBlueprint) []aiWorkoutGoodExample {
	type scoredExample struct {
		example aiWorkoutGoodExample
		score   int
	}

	scored := make([]scoredExample, 0, len(knowledge.GoodExamples))
	preference := normalizeGeneratedWorkoutText(input.WorkoutSplit)
	for _, example := range knowledge.GoodExamples {
		score := 0

		if example.InputProfile.DaysPerWeek == input.DaysPerWeek {
			score += 20
		}
		if strings.TrimSpace(example.InputProfile.Intensity) == strings.TrimSpace(input.Intensity) {
			score += 12
		}
		if strings.TrimSpace(example.InputProfile.Goal) == strings.TrimSpace(input.Goal) {
			score += 10
		}

		examplePreference := normalizeGeneratedWorkoutText(example.InputProfile.Preference)
		if preference != "" && examplePreference != "" && strings.Contains(preference, examplePreference) {
			score += 30
		}

		for _, workout := range example.Workouts {
			if blueprint.containsWorkoutName(workout.Name) {
				score += 6
			}
		}

		scored = append(scored, scoredExample{
			example: example,
			score:   score,
		})
	}

	sort.SliceStable(scored, func(i, j int) bool {
		if scored[i].score == scored[j].score {
			return scored[i].example.Label < scored[j].example.Label
		}

		return scored[i].score > scored[j].score
	})

	limit := 2
	if len(scored) < limit {
		limit = len(scored)
	}

	selected := make([]aiWorkoutGoodExample, 0, limit)
	for _, item := range scored[:limit] {
		selected = append(selected, item.example)
	}

	return selected
}
