package models

import "time"

type HistoryEntry struct {
	ID          string    `gorm:"primaryKey;size:16" json:"id"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	MachineID   string    `gorm:"size:16;not null;index:idx_history_machine_performed,priority:1" json:"machineId"`
	PerformedAt time.Time `gorm:"not null;index:idx_history_machine_performed,priority:2" json:"performedAt"`
	Set1        float64   `json:"set1"`
	Set2        float64   `json:"set2"`
	Set3        float64   `json:"set3"`
	Machine     Machine   `gorm:"foreignKey:MachineID;references:ID;constraint:OnDelete:CASCADE;" json:"-"`
}

func (HistoryEntry) TableName() string {
	return "tb_history_entries"
}
