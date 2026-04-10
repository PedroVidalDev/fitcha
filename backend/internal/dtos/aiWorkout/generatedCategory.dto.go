package aiworkout

type GeneratedCategory struct {
	Name     string             `json:"name"`
	Days     []int              `json:"days"`
	Machines []GeneratedMachine `json:"machines"`
}
