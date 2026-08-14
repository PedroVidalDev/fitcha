package dtos

import (
	machineDtos "fitcha/internal/dtos/machine"
	workoutDtos "fitcha/internal/dtos/workout"
)

type TransferMachineHistoryType struct {
	TargetUserMachineID string `json:"targetUserMachineId"`
	TargetCatalogID     string `json:"targetCatalogMachineId"`
	ReplaceInWorkouts   bool   `json:"replaceInWorkouts"`
}

type TransferMachineHistoryResponseType struct {
	SourceMachineID  string                            `json:"sourceMachineId"`
	TargetMachine    machineDtos.MachineResponseType   `json:"targetMachine"`
	TransferredCount int64                             `json:"transferredCount"`
	UpdatedWorkouts  []workoutDtos.WorkoutResponseType `json:"updatedWorkouts"`
}
