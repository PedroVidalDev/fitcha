package aiworkout

type GenerateAIWorkoutResponse struct {
	Categories       []GeneratedCategory `json:"categories"`
	RemainingCredits int                 `json:"remainingCredits"`
}
