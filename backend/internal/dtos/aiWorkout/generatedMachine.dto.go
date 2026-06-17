package aiworkout

type GeneratedMachine struct {
	CatalogMachineID string    `json:"catalogMachineId,omitempty"`
	Name             string    `json:"name"`
	Sets             []float64 `json:"sets"`
}
