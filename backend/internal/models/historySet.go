package models

import "time"

type HistorySet struct {
	ID             uint         `gorm:"primaryKey" json:"id"`
	CreatedAt      time.Time    `json:"createdAt"`
	UpdatedAt      time.Time    `json:"updatedAt"`
	HistoryEntryID string       `gorm:"size:16;not null;uniqueIndex:idx_tb_history_sets_entry_position,priority:1;index" json:"historyEntryId"`
	Position       int          `gorm:"not null;uniqueIndex:idx_tb_history_sets_entry_position,priority:2" json:"position"`
	Weight         float64      `gorm:"not null" json:"weight"`
	Reps           int          `gorm:"not null;default:0" json:"reps"`
	HistoryEntry   HistoryEntry `gorm:"foreignKey:HistoryEntryID;references:ID;constraint:OnDelete:CASCADE;" json:"-"`
}

func (HistorySet) TableName() string {
	return "tb_history_sets"
}
