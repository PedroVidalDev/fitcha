package models

import "time"

type Day struct {
	ID                 uint         `gorm:"primaryKey" json:"id"`
	CreatedAt          time.Time    `json:"createdAt"`
	UpdatedAt          time.Time    `json:"updatedAt"`
	UserID             uint         `gorm:"not null;uniqueIndex:idx_day_user_day,priority:1" json:"userId"`
	DayIndex           int          `gorm:"not null;uniqueIndex:idx_day_user_day,priority:2" json:"dayIndex"`
	MachineAssignments []DayMachine `gorm:"foreignKey:DayID" json:"-"`
}

func (Day) TableName() string {
	return "tb_days"
}

type DayMachine struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	DayID     uint      `gorm:"not null;uniqueIndex:idx_day_machine,priority:1" json:"dayId"`
	MachineID string    `gorm:"size:16;not null;uniqueIndex:idx_day_machine,priority:2;index" json:"machineId"`
	Position  int       `gorm:"not null" json:"position"`
	Day       Day       `gorm:"constraint:OnDelete:CASCADE;" json:"-"`
	Machine   Machine   `gorm:"foreignKey:MachineID;references:ID;constraint:OnDelete:CASCADE;" json:"-"`
}

func (DayMachine) TableName() string {
	return "tb_day_machines"
}
