package models

import (
	"time"

	"gorm.io/gorm"
)

type EmailVerificationToken struct {
	gorm.Model

	UserID    uint      `gorm:"uniqueIndex;not null"`
	TokenHash string    `gorm:"size:64;uniqueIndex;not null"`
	ExpiresAt time.Time `gorm:"not null"`
	UsedAt    *time.Time
}

func (EmailVerificationToken) TableName() string {
	return "tb_email_verification_tokens"
}
