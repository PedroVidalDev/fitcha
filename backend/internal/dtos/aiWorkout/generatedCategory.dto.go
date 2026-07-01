package aiworkout

type GeneratedCategory struct {
	Name     string             `json:"name"`
	Machines []GeneratedMachine `json:"machines"`
}
