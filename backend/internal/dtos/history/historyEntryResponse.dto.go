package dtos

import (
	"fitcha/internal/models"
	"time"
)

type HistoryEntryResponseType struct {
	ID        string     `json:"id"`
	MachineID string     `json:"machineId"`
	Sets      [3]float64 `json:"sets"`
	Date      string     `json:"date"`
}

func FromHistoryEntryModel(entry models.HistoryEntry) HistoryEntryResponseType {
	return HistoryEntryResponseType{
		ID:        entry.ID,
		MachineID: entry.MachineID,
		Sets:      [3]float64{entry.Set1, entry.Set2, entry.Set3},
		Date:      entry.PerformedAt.UTC().Format(time.RFC3339Nano),
	}
}

func FromHistoryEntryModels(entries []models.HistoryEntry) []HistoryEntryResponseType {
	response := make([]HistoryEntryResponseType, 0, len(entries))

	for _, entry := range entries {
		response = append(response, FromHistoryEntryModel(entry))
	}

	return response
}
