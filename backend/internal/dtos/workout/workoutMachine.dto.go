package dtos

import machineDtos "fitcha/internal/dtos/machine"

type AddWorkoutMachineType struct {
	UserMachineID    string `json:"userMachineId"`
	CatalogMachineID string `json:"catalogMachineId"`
	Name             string `json:"name"`
	Description      string `json:"description"`
	Photo            string `json:"photo"`
	CategoryKey      string `json:"categoryKey"`
	TrackingType     string `json:"trackingType"`
	RequiresWeight   *bool  `json:"requiresWeight"`
}

type AddWorkoutMachineResponseType struct {
	Workout WorkoutResponseType             `json:"workout"`
	Machine machineDtos.MachineResponseType `json:"machine"`
}

type RemoveWorkoutMachineResponseType struct {
	Workout        WorkoutResponseType `json:"workout"`
	RemovedMachine bool                `json:"removedMachine"`
}
