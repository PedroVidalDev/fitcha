package dtos

type CreateMachineType struct {
	Name           string `json:"name"`
	Description    string `json:"description"`
	Photo          string `json:"photo"`
	CategoryKey    string `json:"categoryKey"`
	TrackingType   string `json:"trackingType"`
	RequiresWeight *bool  `json:"requiresWeight"`
}
