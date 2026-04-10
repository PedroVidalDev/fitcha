package dtos

type RemoveDayMachineResponseType struct {
	Day            DayResponseType `json:"day"`
	RemovedMachine bool            `json:"removedMachine"`
}
