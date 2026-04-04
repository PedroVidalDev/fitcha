package repositories

import (
	"fitcha/internal/models"
	"time"

	"gorm.io/gorm"
)

type IPlanRepository interface {
	Create(plan models.Plan) (models.Plan, error)
	FindLatestByUserID(userID uint) (models.Plan, error)
	FindReusablePendingByUserID(userID uint, now time.Time) (models.Plan, error)
	FindActiveByUserID(userID uint, now time.Time) (models.Plan, error)
	FindByProviderPaymentID(paymentID string) (models.Plan, error)
	Update(plan models.Plan) (models.Plan, error)
}

type planRepository struct {
	db *gorm.DB
}

func NewPlanRepository(db *gorm.DB) IPlanRepository {
	return &planRepository{db: db}
}

func (r *planRepository) Create(plan models.Plan) (models.Plan, error) {
	if err := r.db.Create(&plan).Error; err != nil {
		return models.Plan{}, err
	}

	return plan, nil
}

func (r *planRepository) FindLatestByUserID(userID uint) (models.Plan, error) {
	var plan models.Plan

	if err := r.db.Where("user_id = ?", userID).Order("created_at desc").First(&plan).Error; err != nil {
		return models.Plan{}, err
	}

	return plan, nil
}

func (r *planRepository) FindReusablePendingByUserID(userID uint, now time.Time) (models.Plan, error) {
	var plan models.Plan

	err := r.db.
		Where("user_id = ? AND status = ? AND payment_expires_at > ?", userID, models.PlanStatusPending, now).
		Order("created_at desc").
		First(&plan).
		Error
	if err != nil {
		return models.Plan{}, err
	}

	return plan, nil
}

func (r *planRepository) FindActiveByUserID(userID uint, now time.Time) (models.Plan, error) {
	var plan models.Plan

	err := r.db.
		Where("user_id = ? AND status = ? AND access_expires_at > ?", userID, models.PlanStatusApproved, now).
		Order("access_expires_at desc").
		First(&plan).
		Error
	if err != nil {
		return models.Plan{}, err
	}

	return plan, nil
}

func (r *planRepository) FindByProviderPaymentID(paymentID string) (models.Plan, error) {
	var plan models.Plan

	if err := r.db.Where("provider_payment_id = ?", paymentID).First(&plan).Error; err != nil {
		return models.Plan{}, err
	}

	return plan, nil
}

func (r *planRepository) Update(plan models.Plan) (models.Plan, error) {
	if err := r.db.Save(&plan).Error; err != nil {
		return models.Plan{}, err
	}

	return plan, nil
}
