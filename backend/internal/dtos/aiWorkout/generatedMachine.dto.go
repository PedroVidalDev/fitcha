package aiworkout

type GeneratedMachine struct {
	CatalogMachineID string    `json:"catalogMachineId"`
	Name             string    `json:"name"`
	Sets             []float64 `json:"sets"`
}
