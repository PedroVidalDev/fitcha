package repositories

import (
	"fitcha/internal/models"

	"gorm.io/gorm"
)

type IUserMachineRepository interface {
	FindByUserID(userID uint) ([]models.UserMachine, error)
	FindByIDAndUserID(userMachineID string, userID uint) (models.UserMachine, error)
	FindByMachineIDAndUserID(machineID string, userID uint) (models.UserMachine, error)
	Create(machine models.UserMachine) (models.UserMachine, error)
	Update(machine models.UserMachine) (models.UserMachine, error)
	DeleteByIDAndUserID(userMachineID string, userID uint) error
	DeleteCustomUnusedByIDAndUserID(userMachineID string, userID uint) (bool, error)
	DeleteUnassignedWithoutHistoryByUserID(userID uint) error
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
