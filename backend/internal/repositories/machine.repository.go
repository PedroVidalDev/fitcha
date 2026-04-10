package repositories

import (
	"fitcha/internal/models"

	"gorm.io/gorm"
)

type IMachineRepository interface {
	FindByUserID(userID uint) ([]models.Machine, error)
	FindByIDAndUserID(machineID string, userID uint) (models.Machine, error)
	Create(machine models.Machine) (models.Machine, error)
	Update(machine models.Machine) (models.Machine, error)
	DeleteByIDAndUserID(machineID string, userID uint) error
	DeleteByIDsAndUserID(machineIDs []string, userID uint) error
}

type machineRepository struct {
	db *gorm.DB
}

func NewMachineRepository(db *gorm.DB) IMachineRepository {
	return &machineRepository{db: db}
}

func (r *machineRepository) FindByUserID(userID uint) ([]models.Machine, error) {
	var machines []models.Machine

	if err := r.db.Where("user_id = ?", userID).Order("created_at asc").Find(&machines).Error; err != nil {
		return []models.Machine{}, err
	}

	return machines, nil
}

func (r *machineRepository) FindByIDAndUserID(machineID string, userID uint) (models.Machine, error) {
	var machine models.Machine

	if err := r.db.Where("id = ? AND user_id = ?", machineID, userID).First(&machine).Error; err != nil {
		return models.Machine{}, err
	}

	return machine, nil
}

func (r *machineRepository) Create(machine models.Machine) (models.Machine, error) {
	if err := r.db.Create(&machine).Error; err != nil {
		return models.Machine{}, err
	}

	return machine, nil
}

func (r *machineRepository) Update(machine models.Machine) (models.Machine, error) {
	if err := r.db.Save(&machine).Error; err != nil {
		return models.Machine{}, err
	}

	return machine, nil
}

func (r *machineRepository) DeleteByIDAndUserID(machineID string, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", machineID, userID).Delete(&models.Machine{}).Error
}

func (r *machineRepository) DeleteByIDsAndUserID(machineIDs []string, userID uint) error {
	if len(machineIDs) == 0 {
		return nil
	}

	return r.db.Where("user_id = ? AND id IN ?", userID, machineIDs).Delete(&models.Machine{}).Error
}
