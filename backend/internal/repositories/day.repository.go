package repositories

import (
	"fitcha/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type IDayRepository interface {
	EnsureWeek(userID uint) error
	FindByUserID(userID uint) ([]models.Day, error)
	FindByUserIDAndDayIndex(userID uint, dayIndex int) (models.Day, error)
	CreateAssignment(assignment models.DayMachine) (models.DayMachine, error)
	DeleteAssignment(dayID uint, machineID string) error
	CountAssignmentsByMachineID(machineID string) (int64, error)
}

type dayRepository struct {
	db *gorm.DB
}

func NewDayRepository(db *gorm.DB) IDayRepository {
	return &dayRepository{db: db}
}

func (r *dayRepository) EnsureWeek(userID uint) error {
	days := make([]models.Day, 0, 7)

	for dayIndex := 0; dayIndex < 7; dayIndex++ {
		days = append(days, models.Day{
			UserID:   userID,
			DayIndex: dayIndex,
		})
	}

	return r.db.Clauses(clause.OnConflict{DoNothing: true}).Create(&days).Error
}

func (r *dayRepository) FindByUserID(userID uint) ([]models.Day, error) {
	var days []models.Day

	err := r.db.
		Where("user_id = ?", userID).
		Preload("MachineAssignments", func(db *gorm.DB) *gorm.DB {
			return db.Order("position asc")
		}).
		Order("day_index asc").
		Find(&days).
		Error
	if err != nil {
		return []models.Day{}, err
	}

	return days, nil
}

func (r *dayRepository) FindByUserIDAndDayIndex(userID uint, dayIndex int) (models.Day, error) {
	var day models.Day

	err := r.db.
		Where("user_id = ? AND day_index = ?", userID, dayIndex).
		Preload("MachineAssignments", func(db *gorm.DB) *gorm.DB {
			return db.Order("position asc")
		}).
		First(&day).
		Error
	if err != nil {
		return models.Day{}, err
	}

	return day, nil
}

func (r *dayRepository) CreateAssignment(assignment models.DayMachine) (models.DayMachine, error) {
	if err := r.db.Create(&assignment).Error; err != nil {
		return models.DayMachine{}, err
	}

	return assignment, nil
}

func (r *dayRepository) DeleteAssignment(dayID uint, machineID string) error {
	return r.db.Where("day_id = ? AND machine_id = ?", dayID, machineID).Delete(&models.DayMachine{}).Error
}

func (r *dayRepository) CountAssignmentsByMachineID(machineID string) (int64, error) {
	var count int64

	if err := r.db.Model(&models.DayMachine{}).Where("machine_id = ?", machineID).Count(&count).Error; err != nil {
		return 0, err
	}

	return count, nil
}
