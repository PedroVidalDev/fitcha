package models

import "time"

type ErrorLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	CreatedAt  time.Time `json:"createdAt"`
	Resolved   bool      `gorm:"not null;default:false" json:"resolved"`
	Message    string    `gorm:"type:text;not null" json:"message"`
	StackTrace string    `gorm:"type:text" json:"stackTrace"`
	Method     string    `gorm:"size:10;not null;default:''" json:"method"`
	Path       string    `gorm:"type:text;not null;default:''" json:"path"`
	StatusCode int       `gorm:"not null;default:0" json:"statusCode"`
}

func (ErrorLog) TableName() string {
	return "tb_error_logs"
}
