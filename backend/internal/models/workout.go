package models

import "time"

type Workout struct {
	ID                 uint             `gorm:"primaryKey" json:"id"`
	CreatedAt          time.Time        `json:"createdAt"`
	UpdatedAt          time.Time        `json:"updatedAt"`
	UserID             uint             `gorm:"index;not null" json:"userId"`
	Title              string           `gorm:"size:120;not null" json:"title"`
	Description        string           `gorm:"type:text" json:"description"`
	Position           int              `gorm:"not null;default:0" json:"position"`
	MachineAssignments []WorkoutMachine `gorm:"foreignKey:WorkoutID" json:"-"`
}

func (Workout) TableName() string {
	return "tb_workouts"
}

type WorkoutMachine struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time   `json:"createdAt"`
	UpdatedAt     time.Time   `json:"updatedAt"`
	WorkoutID     uint        `gorm:"not null;uniqueIndex:idx_workout_machine,priority:1" json:"workoutId"`
	UserMachineID string      `gorm:"size:16;not null;uniqueIndex:idx_workout_machine,priority:2;index" json:"machineId"`
	Position      int         `gorm:"not null" json:"position"`
	Workout       Workout     `gorm:"constraint:OnDelete:CASCADE;" json:"-"`
	UserMachine   UserMachine `gorm:"foreignKey:UserMachineID;references:ID;constraint:OnDelete:CASCADE;" json:"-"`
}

func (WorkoutMachine) TableName() string {
	return "tb_workout_machines"
}
