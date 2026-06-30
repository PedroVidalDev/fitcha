package dtos

type CreateWorkoutType struct {
	Results []CreateWorkoutResultType `json:"results" binding:"required"`
}

type CreateWorkoutResultType struct {
	MachineID string                 `json:"machineId" binding:"required"`
	Sets      []CreateWorkoutSetType `json:"sets" binding:"required"`
}

type CreateWorkoutSetType struct {
	Weight          float64 `json:"weight"`
	Reps            int     `json:"reps"`
	DurationSeconds int     `json:"durationSeconds"`
}
