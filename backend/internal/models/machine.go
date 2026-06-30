package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

type MachineCategoryKey string
type MachineTrackingType string

const (
	MachineCategoryPeito   MachineCategoryKey = "peito"
	MachineCategoryCostas  MachineCategoryKey = "costas"
	MachineCategoryPernas  MachineCategoryKey = "pernas"
	MachineCategoryOmbros  MachineCategoryKey = "ombros"
	MachineCategoryBiceps  MachineCategoryKey = "biceps"
	MachineCategoryTriceps MachineCategoryKey = "triceps"
	MachineCategoryCore    MachineCategoryKey = "core"
	MachineCategoryCardio  MachineCategoryKey = "cardio"

	MachineTrackingTypeSets     MachineTrackingType = "sets"
	MachineTrackingTypeDuration MachineTrackingType = "duration"
)

type StringList []string

func (l StringList) Value() (driver.Value, error) {
	if len(l) == 0 {
		return "[]", nil
	}

	raw, err := json.Marshal(l)
	if err != nil {
		return nil, err
	}

	return string(raw), nil
}

func (l *StringList) Scan(value any) error {
	if value == nil {
		*l = StringList{}
		return nil
	}

	var raw []byte
	switch typed := value.(type) {
	case []byte:
		raw = typed
	case string:
		raw = []byte(typed)
	default:
		return errors.New("tipo invalido para aliases")
	}

	if len(raw) == 0 {
		*l = StringList{}
		return nil
	}

	var parsed []string
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return err
	}

	*l = parsed
	return nil
}

type Machine struct {
	ID             string     `gorm:"primaryKey;size:16" json:"id"`
	CreatedAt      time.Time  `json:"createdAt"`
	UpdatedAt      time.Time  `json:"updatedAt"`
	Slug           string     `gorm:"size:120;not null;uniqueIndex" json:"slug"`
	Name           string     `gorm:"size:120;not null" json:"name"`
	Description    string     `gorm:"type:text" json:"description"`
	Photo          string     `gorm:"type:text" json:"photo"`
	CategoryKey    string     `gorm:"size:30;not null;index" json:"categoryKey"`
	TrackingType   string     `gorm:"size:30;not null;default:'sets'" json:"trackingType"`
	RequiresWeight bool       `gorm:"not null;default:true" json:"requiresWeight"`
	Aliases        StringList `gorm:"type:jsonb;not null;default:'[]'" json:"aliases"`
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

func IsValidMachineTrackingType(value string) bool {
	switch MachineTrackingType(strings.TrimSpace(value)) {
	case MachineTrackingTypeSets, MachineTrackingTypeDuration:
		return true
	default:
		return false
	}
}

func NormalizeMachineTrackingConfig(trackingType string, requiresWeight bool) (string, bool, error) {
	normalizedTrackingType := strings.TrimSpace(trackingType)
	if normalizedTrackingType == "" {
		normalizedTrackingType = string(MachineTrackingTypeSets)
	}

	if !IsValidMachineTrackingType(normalizedTrackingType) {
		return "", false, errors.New("tipo de registro da maquina invalido")
	}

	if normalizedTrackingType == string(MachineTrackingTypeDuration) {
		return normalizedTrackingType, false, nil
	}

	return normalizedTrackingType, requiresWeight, nil
}

func (m Machine) EffectiveTrackingType() string {
	trackingType := strings.TrimSpace(m.TrackingType)
	if trackingType == "" {
		return string(MachineTrackingTypeSets)
	}

	return trackingType
}

func (m Machine) EffectiveRequiresWeight() bool {
	if m.EffectiveTrackingType() == string(MachineTrackingTypeDuration) {
		return false
	}

	if strings.TrimSpace(m.TrackingType) == "" {
		return true
	}

	return m.RequiresWeight
}
