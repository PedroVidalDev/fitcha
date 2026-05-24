package repositories

import (
	"errors"
	"fitcha/internal/models"
	"time"

	"gorm.io/gorm"
)

type IEmailVerificationTokenRepository interface {
	SaveActiveToken(userID uint, tokenHash string, expiresAt time.Time) error
	FindValidByTokenHash(tokenHash string, now time.Time) (models.EmailVerificationToken, error)
	MarkUsed(tokenID uint, usedAt time.Time) error
}

type emailVerificationTokenRepository struct {
	db *gorm.DB
}

func NewEmailVerificationTokenRepository(db *gorm.DB) IEmailVerificationTokenRepository {
	return &emailVerificationTokenRepository{db: db}
}

func (r *emailVerificationTokenRepository) SaveActiveToken(
	userID uint,
	tokenHash string,
	expiresAt time.Time,
) error {
	var token models.EmailVerificationToken

	result := r.db.Where("user_id = ?", userID).First(&token)
	if errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return r.db.Create(&models.EmailVerificationToken{
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

func (r *emailVerificationTokenRepository) FindValidByTokenHash(
	tokenHash string,
	now time.Time,
) (models.EmailVerificationToken, error) {
	var token models.EmailVerificationToken

	result := r.db.
		Where("token_hash = ? AND used_at IS NULL AND expires_at > ?", tokenHash, now).
		First(&token)
	if result.Error != nil {
		return models.EmailVerificationToken{}, result.Error
	}

	return token, nil
}

func (r *emailVerificationTokenRepository) MarkUsed(tokenID uint, usedAt time.Time) error {
	return r.db.Model(&models.EmailVerificationToken{}).
		Where("id = ?", tokenID).
		Update("used_at", usedAt).
		Error
}
