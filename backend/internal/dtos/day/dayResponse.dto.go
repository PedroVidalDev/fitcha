package dtos

import "fitcha/internal/models"

type DayResponseType struct {
	DayIndex   int      `json:"dayIndex"`
	MachineIDs []string `json:"machineIds"`
}

func FromDayModel(day models.Day) DayResponseType {
	machineIDs := make([]string, 0, len(day.MachineAssignments))

	for _, assignment := range day.MachineAssignments {
		machineIDs = append(machineIDs, assignment.MachineID)
	}

	return DayResponseType{
		DayIndex:   day.DayIndex,
		MachineIDs: machineIDs,
	}
}

func FromDayModels(days []models.Day) []DayResponseType {
	response := make([]DayResponseType, 0, len(days))

	for _, day := range days {
		response = append(response, FromDayModel(day))
	}

	return response
}
