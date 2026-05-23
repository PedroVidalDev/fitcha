package dtos

import machineDtos "fitcha/internal/dtos/machine"

type AddDayMachineType struct {
	CatalogMachineID string `json:"catalogMachineId"`
	Name             string `json:"name"`
	Description      string `json:"description"`
	Photo            string `json:"photo"`
	CategoryKey      string `json:"categoryKey"`
}

type AddDayMachineResponseType struct {
	Day     DayResponseType                 `json:"day"`
	Machine machineDtos.MachineResponseType `json:"machine"`
}
