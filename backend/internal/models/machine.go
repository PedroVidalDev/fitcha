package models

import (
	"strings"
	"time"
)

type MachineCategoryKey string

const (
	MachineCategoryPeito   MachineCategoryKey = "peito"
	MachineCategoryCostas  MachineCategoryKey = "costas"
	MachineCategoryPernas  MachineCategoryKey = "pernas"
	MachineCategoryOmbros  MachineCategoryKey = "ombros"
	MachineCategoryBiceps  MachineCategoryKey = "biceps"
	MachineCategoryTriceps MachineCategoryKey = "triceps"
	MachineCategoryCore    MachineCategoryKey = "core"
	MachineCategoryCardio  MachineCategoryKey = "cardio"
)

type Machine struct {
	ID             string         `gorm:"primaryKey;size:16" json:"id"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	UserID         uint           `gorm:"index;not null" json:"userId"`
	Name           string         `gorm:"size:120;not null" json:"name"`
	Description    string         `gorm:"type:text" json:"description"`
	Photo          string         `gorm:"type:text" json:"photo"`
	CategoryKey    string         `gorm:"size:30;not null" json:"categoryKey"`
	DayAssignments []DayMachine   `gorm:"foreignKey:MachineID;references:ID" json:"-"`
	HistoryEntries []HistoryEntry `gorm:"foreignKey:MachineID;references:ID" json:"-"`
}

func (Machine) TableName() string {
	return "tb_machines"
}

func IsValidMachineCategoryKey(key string) bool {
	switch MachineCategoryKey(strings.TrimSpace(key)) {
	case MachineCategoryPeito,
		MachineCategoryCostas,
		MachineCategoryPernas,
		MachineCategoryOmbros,
		MachineCategoryBiceps,
		MachineCategoryTriceps,
		MachineCategoryCore,
		MachineCategoryCardio:
		return true
	default:
		return false
	}
}
