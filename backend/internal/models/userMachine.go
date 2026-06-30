package models

import "time"

type UserMachine struct {
	ID             string           `gorm:"primaryKey;size:16" json:"id"`
	CreatedAt      time.Time        `json:"createdAt"`
	UpdatedAt      time.Time        `json:"updatedAt"`
	UserID         uint             `gorm:"index;not null" json:"userId"`
	MachineID      *string          `gorm:"size:16;index" json:"machineId,omitempty"`
	Name           string           `gorm:"size:120" json:"name"`
	Description    string           `gorm:"type:text" json:"description"`
	Photo          string           `gorm:"type:text" json:"photo"`
	CategoryKey    string           `gorm:"size:30;index" json:"categoryKey"`
	TrackingType   string           `gorm:"size:30;not null;default:'sets'" json:"trackingType"`
	RequiresWeight bool             `gorm:"not null;default:true" json:"requiresWeight"`
	Machine        *Machine         `gorm:"foreignKey:MachineID;references:ID;constraint:OnDelete:SET NULL;" json:"-"`
	User           User             `gorm:"constraint:OnDelete:CASCADE;" json:"-"`
	Assignments    []WorkoutMachine `gorm:"foreignKey:UserMachineID;references:ID" json:"-"`
	History        []HistoryEntry   `gorm:"foreignKey:UserMachineID;references:ID" json:"-"`
}

func (UserMachine) TableName() string {
	return "tb_user_machines"
}

func (m UserMachine) EffectiveTrackingType() string {
	if m.Machine != nil {
		return m.Machine.EffectiveTrackingType()
	}

	trackingType := m.TrackingType
	if trackingType == "" {
		return string(MachineTrackingTypeSets)
	}

	return trackingType
}

func (m UserMachine) EffectiveRequiresWeight() bool {
	if m.Machine != nil {
		return m.Machine.EffectiveRequiresWeight()
	}

	if m.EffectiveTrackingType() == string(MachineTrackingTypeDuration) {
		return false
	}

	if m.TrackingType == "" {
		return true
	}

	return m.RequiresWeight
}
