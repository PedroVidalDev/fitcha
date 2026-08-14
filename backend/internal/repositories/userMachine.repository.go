package repositories

import (
	"fitcha/internal/models"
	"strings"

	"gorm.io/gorm"
)

type IUserMachineRepository interface {
	FindByUserID(userID uint) ([]models.UserMachine, error)
	FindPageByUserID(userID uint, filters UserMachineSearchFilters) ([]models.UserMachine, int64, error)
	FindByIDAndUserID(userMachineID string, userID uint) (models.UserMachine, error)
	FindByMachineIDAndUserID(machineID string, userID uint) (models.UserMachine, error)
	Create(machine models.UserMachine) (models.UserMachine, error)
	Update(machine models.UserMachine) (models.UserMachine, error)
	DeleteByIDAndUserID(userMachineID string, userID uint) error
	DeleteCustomUnusedByIDAndUserID(userMachineID string, userID uint) (bool, error)
	DeleteUnassignedWithoutHistoryByUserID(userID uint) error
}

type UserMachineSearchFilters struct {
	Source         string
	Query          string
	CategoryKey    string
	TrackingType   string
	RequiresWeight *bool
	ExcludeIDs     []string
	Page           int
	Limit          int
}

type userMachineRepository struct {
	db *gorm.DB
}

func NewUserMachineRepository(db *gorm.DB) IUserMachineRepository {
	return &userMachineRepository{db: db}
}

func (r *userMachineRepository) FindByUserID(userID uint) ([]models.UserMachine, error) {
	var machines []models.UserMachine

	err := r.db.
		Where("user_id = ?", userID).
		Preload("Machine").
		Order("created_at asc").
		Find(&machines).
		Error
	if err != nil {
		return []models.UserMachine{}, err
	}

	return machines, nil
}

func (r *userMachineRepository) FindPageByUserID(userID uint, filters UserMachineSearchFilters) ([]models.UserMachine, int64, error) {
	query := r.db.
		Model(&models.UserMachine{}).
		Joins("LEFT JOIN tb_machines AS catalog_machine ON catalog_machine.id = tb_user_machines.machine_id").
		Where("tb_user_machines.user_id = ?", userID)

	switch filters.Source {
	case "custom":
		query = query.Where("tb_user_machines.machine_id IS NULL")
	case "catalog":
		query = query.Where("tb_user_machines.machine_id IS NOT NULL")
	}

	if filters.Query != "" {
		search := "%" + strings.ToLower(filters.Query) + "%"
		query = query.Where(`
			LOWER(COALESCE(NULLIF(catalog_machine.name, ''), tb_user_machines.name)) LIKE ?
			OR LOWER(COALESCE(NULLIF(tb_user_machines.description, ''), catalog_machine.description, '')) LIKE ?
			OR LOWER(COALESCE(catalog_machine.slug, '')) LIKE ?
			OR LOWER(COALESCE(CAST(catalog_machine.aliases AS TEXT), '')) LIKE ?
		`, search, search, search, search)
	}
	if filters.CategoryKey != "" {
		query = query.Where(
			"COALESCE(NULLIF(catalog_machine.category_key, ''), tb_user_machines.category_key) = ?",
			filters.CategoryKey,
		)
	}
	if filters.TrackingType != "" {
		query = query.Where(
			"COALESCE(NULLIF(catalog_machine.tracking_type, ''), NULLIF(tb_user_machines.tracking_type, ''), 'sets') = ?",
			filters.TrackingType,
		)
	}
	if filters.RequiresWeight != nil {
		query = query.Where(
			"CASE WHEN catalog_machine.id IS NOT NULL THEN catalog_machine.requires_weight ELSE tb_user_machines.requires_weight END = ?",
			*filters.RequiresWeight,
		)
	}
	if len(filters.ExcludeIDs) > 0 {
		query = query.Where("tb_user_machines.id NOT IN ?", filters.ExcludeIDs)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return []models.UserMachine{}, 0, err
	}

	var machines []models.UserMachine
	if err := query.
		Select("tb_user_machines.*").
		Preload("Machine").
		Order("LOWER(COALESCE(NULLIF(catalog_machine.name, ''), tb_user_machines.name)) asc, tb_user_machines.id asc").
		Offset((filters.Page - 1) * filters.Limit).
		Limit(filters.Limit).
		Find(&machines).
		Error; err != nil {
		return []models.UserMachine{}, 0, err
	}

	return machines, total, nil
}

func (r *userMachineRepository) FindByIDAndUserID(userMachineID string, userID uint) (models.UserMachine, error) {
	var machine models.UserMachine

	err := r.db.
		Where("id = ? AND user_id = ?", userMachineID, userID).
		Preload("Machine").
		First(&machine).
		Error
	if err != nil {
		return models.UserMachine{}, err
	}

	return machine, nil
}

func (r *userMachineRepository) FindByMachineIDAndUserID(machineID string, userID uint) (models.UserMachine, error) {
	var machine models.UserMachine

	err := r.db.
		Where("machine_id = ? AND user_id = ?", machineID, userID).
		Preload("Machine").
		First(&machine).
		Error
	if err != nil {
		return models.UserMachine{}, err
	}

	return machine, nil
}

func (r *userMachineRepository) Create(machine models.UserMachine) (models.UserMachine, error) {
	if err := r.db.Create(&machine).Error; err != nil {
		return models.UserMachine{}, err
	}

	return r.FindByIDAndUserID(machine.ID, machine.UserID)
}

func (r *userMachineRepository) Update(machine models.UserMachine) (models.UserMachine, error) {
	if err := r.db.Save(&machine).Error; err != nil {
		return models.UserMachine{}, err
	}

	return r.FindByIDAndUserID(machine.ID, machine.UserID)
}

func (r *userMachineRepository) DeleteByIDAndUserID(userMachineID string, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", userMachineID, userID).Delete(&models.UserMachine{}).Error
}

func (r *userMachineRepository) DeleteCustomUnusedByIDAndUserID(userMachineID string, userID uint) (bool, error) {
	result := r.db.Exec(`
		DELETE FROM tb_user_machines
		WHERE id = ?
		  AND user_id = ?
		  AND machine_id IS NULL
		  AND NOT EXISTS (
			SELECT 1
			FROM tb_workout_machines
			WHERE tb_workout_machines.user_machine_id = tb_user_machines.id
		  )
		  AND NOT EXISTS (
			SELECT 1
			FROM tb_history_entries
			WHERE tb_history_entries.user_machine_id = tb_user_machines.id
		  )
	`, userMachineID, userID)
	if result.Error != nil {
		return false, result.Error
	}

	return result.RowsAffected > 0, nil
}

func (r *userMachineRepository) DeleteUnassignedWithoutHistoryByUserID(userID uint) error {
	return r.db.Exec(`
		DELETE FROM tb_user_machines
		WHERE user_id = ?
		  AND machine_id IS NOT NULL
		  AND NOT EXISTS (
			SELECT 1
			FROM tb_workout_machines
			WHERE tb_workout_machines.user_machine_id = tb_user_machines.id
		  )
		  AND NOT EXISTS (
			SELECT 1
			FROM tb_history_entries
			WHERE tb_history_entries.user_machine_id = tb_user_machines.id
		  )
	`, userID).Error
}
