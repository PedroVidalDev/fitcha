package dtos

import machineDtos "fitcha/internal/dtos/machine"

type AddDayMachineType struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Photo       string `json:"photo"`
	CategoryKey string `json:"categoryKey" binding:"required"`
}

type AddDayMachineResponseType struct {
	Day     DayResponseType                 `json:"day"`
	Machine machineDtos.MachineResponseType `json:"machine"`
}
