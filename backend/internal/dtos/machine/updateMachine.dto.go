package dtos

type UpdateMachineType struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Photo       *string `json:"photo"`
	CategoryKey *string `json:"categoryKey"`
}
