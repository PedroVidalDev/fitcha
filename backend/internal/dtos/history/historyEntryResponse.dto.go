package dtos

import (
	"fitcha/internal/models"
	"time"
)

type HistoryEntryResponseType struct {
	ID        string                        `json:"id"`
	MachineID string                        `json:"machineId"`
	Sets      []HistoryEntrySetResponseType `json:"sets"`
	Date      string                        `json:"date"`
}

type HistoryEntrySetResponseType struct {
	Weight float64 `json:"weight"`
	Reps   int     `json:"reps"`
}

func FromHistoryEntryModel(entry models.HistoryEntry) HistoryEntryResponseType {
	sets := make([]HistoryEntrySetResponseType, 0, len(entry.Sets))
	for _, set := range entry.Sets {
		sets = append(sets, HistoryEntrySetResponseType{
			Weight: set.Weight,
			Reps:   set.Reps,
		})
	}

	return HistoryEntryResponseType{
		ID:        entry.ID,
		MachineID: entry.UserMachineID,
		Sets:      sets,
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
