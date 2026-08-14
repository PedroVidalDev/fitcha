package repositories

import (
	"fitcha/internal/models"
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type IMachineRepository interface {
	FindAll() ([]models.Machine, error)
	FindPage(filters MachineSearchFilters) ([]models.Machine, int64, error)
	FindByID(machineID string) (models.Machine, error)
	Create(machine models.Machine) (models.Machine, error)
	Update(machine models.Machine) (models.Machine, error)
	UpsertMany(machines []models.Machine) error
}

type MachineSearchFilters struct {
	Query             string
	CategoryKey       string
	SubstitutionGroup string
	TrackingType      string
	RequiresWeight    *bool
	ExcludeIDs        []string
	Page              int
	Limit             int
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

func (r *machineRepository) FindPage(filters MachineSearchFilters) ([]models.Machine, int64, error) {
	query := r.db.Model(&models.Machine{})

	if filters.Query != "" {
		search := "%" + strings.ToLower(filters.Query) + "%"
		query = query.Where(
			"LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(slug) LIKE ? OR LOWER(CAST(aliases AS TEXT)) LIKE ?",
			search,
			search,
			search,
			search,
		)
	}
	if filters.CategoryKey != "" {
		query = query.Where("category_key = ?", filters.CategoryKey)
	}
	if filters.SubstitutionGroup != "" {
		query = query.Where("substitution_group = ?", filters.SubstitutionGroup)
	}
	if filters.TrackingType != "" {
		query = query.Where("tracking_type = ?", filters.TrackingType)
	}
	if filters.RequiresWeight != nil {
		query = query.Where("requires_weight = ?", *filters.RequiresWeight)
	}
	if len(filters.ExcludeIDs) > 0 {
		query = query.Where("id NOT IN ?", filters.ExcludeIDs)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return []models.Machine{}, 0, err
	}

	var machines []models.Machine
	if err := query.
		Select("tb_machines.*").
		Order("LOWER(name) asc, id asc").
		Offset((filters.Page - 1) * filters.Limit).
		Limit(filters.Limit).
		Find(&machines).
		Error; err != nil {
		return []models.Machine{}, 0, err
	}

	return machines, total, nil
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
		DoUpdates: clause.AssignmentColumns([]string{"name", "description", "photo", "category_key", "substitution_group", "tracking_type", "requires_weight", "aliases", "updated_at"}),
	}).Create(&machines).Error
}
