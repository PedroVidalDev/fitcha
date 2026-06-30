package repositories

import (
	"fitcha/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type IMachineRepository interface {
	FindAll() ([]models.Machine, error)
	FindByID(machineID string) (models.Machine, error)
	Create(machine models.Machine) (models.Machine, error)
	Update(machine models.Machine) (models.Machine, error)
	UpsertMany(machines []models.Machine) error
}

type machineRepository struct {
	db *gorm.DB
}

func NewMachineRepository(db *gorm.DB) IMachineRepository {
	return &machineRepository{db: db}
}

func (r *machineRepository) FindAll() ([]models.Machine, error) {
	var machines []models.Machine

	if err := r.db.Order("category_key asc, name asc").Find(&machines).Error; err != nil {
		return []models.Machine{}, err
	}

	return machines, nil
}

func (r *machineRepository) FindByID(machineID string) (models.Machine, error) {
	var machine models.Machine

	if err := r.db.Where("id = ?", machineID).First(&machine).Error; err != nil {
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

func (r *machineRepository) UpsertMany(machines []models.Machine) error {
	if len(machines) == 0 {
		return nil
	}

	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "slug"}},
		DoUpdates: clause.AssignmentColumns([]string{"name", "description", "photo", "category_key", "tracking_type", "requires_weight", "aliases", "updated_at"}),
	}).Create(&machines).Error
}
