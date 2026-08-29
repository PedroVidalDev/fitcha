package repositories

import (
	"fitcha/internal/models"

	"gorm.io/gorm"
)

type IErrorLogRepository interface {
	Create(log models.ErrorLog) error
}

type errorLogRepository struct {
	db *gorm.DB
}

func NewErrorLogRepository(db *gorm.DB) IErrorLogRepository {
	return &errorLogRepository{db: db}
}

func (r *errorLogRepository) Create(log models.ErrorLog) error {
	return r.db.Create(&log).Error
}
