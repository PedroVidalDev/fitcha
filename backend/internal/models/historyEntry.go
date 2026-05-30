package models

import "time"

type HistoryEntry struct {
	ID            string       `gorm:"primaryKey;size:16" json:"id"`
	CreatedAt     time.Time    `json:"createdAt"`
	UpdatedAt     time.Time    `json:"updatedAt"`
	UserMachineID string       `gorm:"size:16;not null;index:idx_history_machine_performed,priority:1" json:"machineId"`
	PerformedAt   time.Time    `gorm:"not null;index:idx_history_machine_performed,priority:2" json:"performedAt"`
	Sets          []HistorySet `gorm:"foreignKey:HistoryEntryID;references:ID" json:"sets"`
	UserMachine   UserMachine  `gorm:"foreignKey:UserMachineID;references:ID;constraint:OnDelete:CASCADE;" json:"-"`
}

func (HistoryEntry) TableName() string {
	return "tb_history_entries"
}
