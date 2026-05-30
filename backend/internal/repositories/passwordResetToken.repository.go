package repositories

import (
	"errors"
	"fitcha/internal/models"
	"time"

	"gorm.io/gorm"
)

type IPasswordResetTokenRepository interface {
	SaveActiveToken(userID uint, tokenHash string, expiresAt time.Time) error
	FindValidByTokenHash(tokenHash string, now time.Time) (models.PasswordResetToken, error)
	MarkUsed(tokenID uint, usedAt time.Time) error
}

type passwordResetTokenRepository struct {
	db *gorm.DB
}

func NewPasswordResetTokenRepository(db *gorm.DB) IPasswordResetTokenRepository {
	return &passwordResetTokenRepository{db: db}
}

func (r *passwordResetTokenRepository) SaveActiveToken(
	userID uint,
	tokenHash string,
	expiresAt time.Time,
) error {
	var token models.PasswordResetToken

	result := r.db.Where("user_id = ?", userID).First(&token)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return r.db.Create(&models.PasswordResetToken{
			UserID:    userID,
			TokenHash: tokenHash,
			ExpiresAt: expiresAt,
			UsedAt:    nil,
		}).Error
	}

	if result.Error != nil {
		return result.Error
	}

	token.TokenHash = tokenHash
	token.ExpiresAt = expiresAt
	token.UsedAt = nil
	return r.db.Save(&token).Error
}

func (r *passwordResetTokenRepository) FindValidByTokenHash(
	tokenHash string,
	now time.Time,
) (models.PasswordResetToken, error) {
	var token models.PasswordResetToken

	result := r.db.
		Where("token_hash = ? AND used_at IS NULL AND expires_at > ?", tokenHash, now).
		First(&token)
	if result.Error != nil {
		return models.PasswordResetToken{}, result.Error
	}

	return token, nil
}

func (r *passwordResetTokenRepository) MarkUsed(tokenID uint, usedAt time.Time) error {
	return r.db.Model(&models.PasswordResetToken{}).
		Where("id = ?", tokenID).
		Update("used_at", usedAt).
		Error
}
