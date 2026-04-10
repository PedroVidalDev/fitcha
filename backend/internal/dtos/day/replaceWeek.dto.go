package dtos

import machineDtos "fitcha/internal/dtos/machine"

type ReplaceWeekType struct {
	Days []ReplaceWeekDayType `json:"days" binding:"required"`
}

type ReplaceWeekDayType struct {
	DayIndex int                 `json:"dayIndex" binding:"required"`
	Machines []AddDayMachineType `json:"machines"`
}

type ReplaceWeekResponseType struct {
	Days     []DayResponseType                 `json:"days"`
	Machines []machineDtos.MachineResponseType `json:"machines"`
}
