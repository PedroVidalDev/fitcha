package models

import (
	"time"

	"gorm.io/gorm"
)

type PasswordResetToken struct {
	gorm.Model

	UserID    uint      `gorm:"uniqueIndex;not null"`
	TokenHash string    `gorm:"size:64;uniqueIndex;not null"`
	ExpiresAt time.Time `gorm:"not null"`
	UsedAt    *time.Time
}

func (PasswordResetToken) TableName() string {
	return "tb_password_reset_tokens"
}
