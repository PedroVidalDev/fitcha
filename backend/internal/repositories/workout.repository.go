package repositories

import (
	"fitcha/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type IWorkoutRepository interface {
	FindByUserID(userID uint) ([]models.Workout, error)
	FindByIDAndUserID(workoutID uint, userID uint) (models.Workout, error)
	CountByUserID(userID uint) (int64, error)
	Create(workout models.Workout) (models.Workout, error)
	Update(workout models.Workout) (models.Workout, error)
	DeleteByIDAndUserID(workoutID uint, userID uint) error
	DeleteAllByUserID(userID uint) error
	ShiftPositionsAfter(userID uint, position int) error
	CreateAssignment(assignment models.WorkoutMachine) (models.WorkoutMachine, error)
	DeleteAssignment(workoutID uint, userMachineID string) error
	CountAssignmentsByUserMachineID(userMachineID string) (int64, error)
	ReplaceMachineAssignmentsByUserID(userID uint, sourceUserMachineID string, targetUserMachineID string) ([]models.Workout, error)
}

type workoutRepository struct {
	db *gorm.DB
}

func NewWorkoutRepository(db *gorm.DB) IWorkoutRepository {
	return &workoutRepository{db: db}
}

func (r *workoutRepository) FindByUserID(userID uint) ([]models.Workout, error) {
	var workouts []models.Workout

	err := r.db.
		Where("user_id = ?", userID).
		Preload("MachineAssignments", func(db *gorm.DB) *gorm.DB {
			return db.Order("position asc")
		}).
		Order("position asc, created_at asc").
		Find(&workouts).
		Error
	if err != nil {
		return []models.Workout{}, err
	}

	return workouts, nil
}

func (r *workoutRepository) FindByIDAndUserID(workoutID uint, userID uint) (models.Workout, error) {
	var workout models.Workout

	err := r.db.
		Where("id = ? AND user_id = ?", workoutID, userID).
		Preload("MachineAssignments", func(db *gorm.DB) *gorm.DB {
			return db.Order("position asc")
		}).
		First(&workout).
		Error
	if err != nil {
		return models.Workout{}, err
	}

	return workout, nil
}

func (r *workoutRepository) CountByUserID(userID uint) (int64, error) {
	var count int64

	if err := r.db.Model(&models.Workout{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
		return 0, err
	}

	return count, nil
}

func (r *workoutRepository) Create(workout models.Workout) (models.Workout, error) {
	if err := r.db.Create(&workout).Error; err != nil {
		return models.Workout{}, err
	}

	return r.FindByIDAndUserID(workout.ID, workout.UserID)
}

func (r *workoutRepository) Update(workout models.Workout) (models.Workout, error) {
	if err := r.db.Save(&workout).Error; err != nil {
		return models.Workout{}, err
	}

	return r.FindByIDAndUserID(workout.ID, workout.UserID)
}

func (r *workoutRepository) DeleteByIDAndUserID(workoutID uint, userID uint) error {
	return r.db.Where("id = ? AND user_id = ?", workoutID, userID).Delete(&models.Workout{}).Error
}

func (r *workoutRepository) DeleteAllByUserID(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&models.Workout{}).Error
}

func (r *workoutRepository) ShiftPositionsAfter(userID uint, position int) error {
	return r.db.Model(&models.Workout{}).
		Where("user_id = ? AND position > ?", userID, position).
		Update("position", gorm.Expr("position - 1")).
		Error
}

func (r *workoutRepository) CreateAssignment(assignment models.WorkoutMachine) (models.WorkoutMachine, error) {
	if err := r.db.Clauses(clause.OnConflict{DoNothing: true}).Create(&assignment).Error; err != nil {
		return models.WorkoutMachine{}, err
	}

	return assignment, nil
}

func (r *workoutRepository) DeleteAssignment(workoutID uint, userMachineID string) error {
	return r.db.Where("workout_id = ? AND user_machine_id = ?", workoutID, userMachineID).Delete(&models.WorkoutMachine{}).Error
}

func (r *workoutRepository) CountAssignmentsByUserMachineID(userMachineID string) (int64, error) {
	var count int64

	if err := r.db.Model(&models.WorkoutMachine{}).Where("user_machine_id = ?", userMachineID).Count(&count).Error; err != nil {
		return 0, err
	}

	return count, nil
}

func (r *workoutRepository) ReplaceMachineAssignmentsByUserID(userID uint, sourceUserMachineID string, targetUserMachineID string) ([]models.Workout, error) {
	var workoutIDs []uint

	if err := r.db.
		Model(&models.WorkoutMachine{}).
		Select("tb_workout_machines.workout_id").
		Joins("JOIN tb_workouts ON tb_workouts.id = tb_workout_machines.workout_id").
		Where("tb_workouts.user_id = ? AND tb_workout_machines.user_machine_id = ?", userID, sourceUserMachineID).
		Order("tb_workout_machines.workout_id asc").
		Pluck("tb_workout_machines.workout_id", &workoutIDs).
		Error; err != nil {
		return []models.Workout{}, err
	}

	if len(workoutIDs) == 0 {
		return []models.Workout{}, nil
	}

	if err := r.db.Exec(`
		DELETE FROM tb_workout_machines AS source
		USING tb_workouts AS workouts
		WHERE source.workout_id = workouts.id
		  AND workouts.user_id = ?
		  AND source.user_machine_id = ?
		  AND EXISTS (
			SELECT 1
			FROM tb_workout_machines AS target
			WHERE target.workout_id = source.workout_id
			  AND target.user_machine_id = ?
		  )
	`, userID, sourceUserMachineID, targetUserMachineID).Error; err != nil {
		return []models.Workout{}, err
	}

	if err := r.db.Exec(`
		UPDATE tb_workout_machines AS assignments
		SET user_machine_id = ?, updated_at = NOW()
		FROM tb_workouts AS workouts
		WHERE assignments.workout_id = workouts.id
		  AND workouts.user_id = ?
		  AND assignments.user_machine_id = ?
	`, targetUserMachineID, userID, sourceUserMachineID).Error; err != nil {
		return []models.Workout{}, err
	}

	workouts := make([]models.Workout, 0, len(workoutIDs))
	for _, workoutID := range workoutIDs {
		var assignments []models.WorkoutMachine
		if err := r.db.
			Where("workout_id = ?", workoutID).
			Order("position asc, id asc").
			Find(&assignments).
			Error; err != nil {
			return []models.Workout{}, err
		}

		for index, assignment := range assignments {
			if assignment.Position == index {
				continue
			}

			if err := r.db.Model(&models.WorkoutMachine{}).
				Where("id = ?", assignment.ID).
				Update("position", index).
				Error; err != nil {
				return []models.Workout{}, err
			}
		}

		workout, err := r.FindByIDAndUserID(workoutID, userID)
		if err != nil {
			return []models.Workout{}, err
		}
		workouts = append(workouts, workout)
	}

	return workouts, nil
}
