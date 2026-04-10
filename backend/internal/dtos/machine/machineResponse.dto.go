package dtos

import "fitcha/internal/models"

type MachineResponseType struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Photo       string `json:"photo,omitempty"`
	CategoryKey string `json:"categoryKey"`
}

func FromMachineModel(machine models.Machine) MachineResponseType {
	return MachineResponseType{
		ID:          machine.ID,
		Name:        machine.Name,
		Description: machine.Description,
		Photo:       machine.Photo,
		CategoryKey: machine.CategoryKey,
	}
}

func FromMachineModels(machines []models.Machine) []MachineResponseType {
	response := make([]MachineResponseType, 0, len(machines))

	for _, machine := range machines {
		response = append(response, FromMachineModel(machine))
	}

	return response
}
