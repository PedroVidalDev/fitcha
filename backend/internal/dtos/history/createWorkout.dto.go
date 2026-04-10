package dtos

type CreateWorkoutType struct {
	Results []CreateWorkoutResultType `json:"results" binding:"required"`
}

type CreateWorkoutResultType struct {
	MachineID string     `json:"machineId" binding:"required"`
	Sets      [3]float64 `json:"sets" binding:"required"`
}
