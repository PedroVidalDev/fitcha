package repositories

import (
	"fitcha/internal/models"
	"time"

	"gorm.io/gorm"
)

type IPaymentRepository interface {
	Create(payment models.Payment) (models.Payment, error)
	FindLatestByUserID(userID uint) (models.Payment, error)
	FindReusablePendingByUserID(userID uint, creditQuantity int, payerDocument string, now time.Time) (models.Payment, error)
	FindByProviderPaymentID(paymentID string) (models.Payment, error)
}

type paymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) IPaymentRepository {
	return &paymentRepository{db: db}
}

func (r *paymentRepository) Create(payment models.Payment) (models.Payment, error) {
	if err := r.db.Create(&payment).Error; err != nil {
		return models.Payment{}, err
	}

	return payment, nil
}

func (r *paymentRepository) FindLatestByUserID(userID uint) (models.Payment, error) {
	var payment models.Payment

	if err := r.db.Where("user_id = ?", userID).Order("created_at desc").First(&payment).Error; err != nil {
		return models.Payment{}, err
	}

	return payment, nil
}

func (r *paymentRepository) FindReusablePendingByUserID(userID uint, creditQuantity int, payerDocument string, now time.Time) (models.Payment, error) {
	var payment models.Payment

	err := r.db.
		Where(
			"user_id = ? AND status = ? AND credit_quantity = ? AND payer_document = ? AND payment_expires_at > ?",
			userID,
			models.PaymentStatusPending,
			creditQuantity,
			payerDocument,
			now,
		).
		Order("created_at desc").
		First(&payment).
		Error
	if err != nil {
		return models.Payment{}, err
	}

	return payment, nil
}

func (r *paymentRepository) FindByProviderPaymentID(paymentID string) (models.Payment, error) {
	var payment models.Payment

	if err := r.db.Where("provider_payment_id = ?", paymentID).First(&payment).Error; err != nil {
		return models.Payment{}, err
	}

	return payment, nil
}
