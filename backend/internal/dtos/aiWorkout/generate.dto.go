package aiworkout

type GenerateAIWorkoutRequest struct {
	Height      string `json:"height" binding:"required"`
	Weight      string `json:"weight" binding:"required"`
	DaysPerWeek int    `json:"daysPerWeek" binding:"required,min=1,max=7"`
	Intensity   string `json:"intensity" binding:"required,oneof=leve moderado intenso"`
	Goal        string `json:"goal" binding:"required,oneof=hipertrofia forca resistencia emagrecimento"`
	CustomInstructions string `json:"customInstructions"`
}

type GeneratedMachine struct {
	Name string    `json:"name"`
	Sets []float64 `json:"sets"`
}

type GeneratedCategory struct {
	Name     string             `json:"name"`
	Days     []int              `json:"days"`
	Machines []GeneratedMachine `json:"machines"`
}

type GenerateAIWorkoutResponse struct {
	Categories []GeneratedCategory `json:"categories"`
}
