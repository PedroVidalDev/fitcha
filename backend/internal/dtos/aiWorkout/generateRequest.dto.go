package aiworkout

type GenerateAIWorkoutRequest struct {
	Height             string `json:"height" binding:"required"`
	Weight             string `json:"weight" binding:"required"`
	DaysPerWeek        int    `json:"daysPerWeek" binding:"required,min=1,max=7"`
	SelectedDays       []int  `json:"selectedDays" binding:"required,min=1,max=7,dive,min=0,max=6"`
	HoursPerDay        string `json:"hoursPerDay"`
	MachinesPerDay     string `json:"machinesPerDay"`
	WorkoutSplit       string `json:"workoutSplit"`
	Intensity          string `json:"intensity" binding:"required,oneof=leve moderado intenso"`
	Goal               string `json:"goal" binding:"required,oneof=hipertrofia forca resistencia emagrecimento"`
	CustomInstructions string `json:"customInstructions"`
}
