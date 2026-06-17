package services

import (
	"errors"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"strings"

	"gorm.io/gorm"
)

type CreateWorkoutInput struct {
	Title       string
	Description string
}

type UpdateWorkoutInput struct {
	Title       *string
	Description *string
}

type ReplaceWorkoutInput struct {
	Title       string
	Description string
	Machines    []CreateWorkoutMachineInput
}

type WorkoutService struct {
	db       *gorm.DB
	workouts repositories.IWorkoutRepository
}

func NewWorkoutService(db *gorm.DB, workoutRepo repositories.IWorkoutRepository) *WorkoutService {
	return &WorkoutService{
		db:       db,
		workouts: workoutRepo,
	}
}

func (s *WorkoutService) ListByUserID(userID uint) ([]models.Workout, error) {
	return s.workouts.FindByUserID(userID)
}

func (s *WorkoutService) Create(userID uint, input CreateWorkoutInput) (models.Workout, error) {
	normalizedInput, err := normalizeCreateWorkoutInput(input)
	if err != nil {
		return models.Workout{}, err
	}

	var workout models.Workout

	err = s.db.Transaction(func(tx *gorm.DB) error {
		workoutRepo := repositories.NewWorkoutRepository(tx)

		count, err := workoutRepo.CountByUserID(userID)
		if err != nil {
			return err
		}

		createdWorkout, err := workoutRepo.Create(models.Workout{
			UserID:      userID,
			Title:       normalizedInput.Title,
			Description: normalizedInput.Description,
			Position:    int(count),
		})
		if err != nil {
			return err
		}

		workout = createdWorkout
		return nil
	})
	if err != nil {
		return models.Workout{}, err
	}

	return workout, nil
}

func (s *WorkoutService) Update(userID uint, workoutID uint, input UpdateWorkoutInput) (models.Workout, error) {
	var workout models.Workout

	err := s.db.Transaction(func(tx *gorm.DB) error {
		workoutRepo := repositories.NewWorkoutRepository(tx)

		currentWorkout, err := workoutRepo.FindByIDAndUserID(workoutID, userID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("treino nao encontrado")
			}

			return err
		}

		if input.Title != nil {
			title := strings.TrimSpace(*input.Title)
			if title == "" {
				return errors.New("informe o titulo do treino")
			}

			currentWorkout.Title = title
		}

		if input.Description != nil {
			currentWorkout.Description = strings.TrimSpace(*input.Description)
		}

		updatedWorkout, err := workoutRepo.Update(currentWorkout)
		if err != nil {
			return err
		}

		workout = updatedWorkout
		return nil
	})
	if err != nil {
		return models.Workout{}, err
	}

	return workout, nil
}

func (s *WorkoutService) Delete(userID uint, workoutID uint) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		workoutRepo := repositories.NewWorkoutRepository(tx)
		userMachineRepo := repositories.NewUserMachineRepository(tx)

		workout, err := workoutRepo.FindByIDAndUserID(workoutID, userID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("treino nao encontrado")
			}

			return err
		}

		if err := workoutRepo.DeleteByIDAndUserID(workoutID, userID); err != nil {
			return err
		}

		if err := userMachineRepo.DeleteUnassignedWithoutHistoryByUserID(userID); err != nil {
			return err
		}

		if err := workoutRepo.ShiftPositionsAfter(userID, workout.Position); err != nil {
			return err
		}

		return nil
	})
}

func (s *WorkoutService) AddMachine(userID uint, workoutID uint, input CreateWorkoutMachineInput) (models.Workout, models.UserMachine, error) {
	normalizedInput, err := normalizeCreateWorkoutMachineInput(input)
	if err != nil {
		return models.Workout{}, models.UserMachine{}, err
	}

	var workout models.Workout
	var machine models.UserMachine

	err = s.db.Transaction(func(tx *gorm.DB) error {
		workoutRepo := repositories.NewWorkoutRepository(tx)

		currentWorkout, err := workoutRepo.FindByIDAndUserID(workoutID, userID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("treino nao encontrado")
			}

			return err
		}

		resolvedMachine, err := resolveUserMachineForInput(tx, userID, normalizedInput)
		if err != nil {
			return err
		}

		for _, assignment := range currentWorkout.MachineAssignments {
			if assignment.UserMachineID == resolvedMachine.ID {
				return errors.New("maquina ja vinculada a este treino")
			}
		}

		if _, err := workoutRepo.CreateAssignment(models.WorkoutMachine{
			WorkoutID:     currentWorkout.ID,
			UserMachineID: resolvedMachine.ID,
			Position:      len(currentWorkout.MachineAssignments),
		}); err != nil {
			return err
		}

		updatedWorkout, err := workoutRepo.FindByIDAndUserID(workoutID, userID)
		if err != nil {
			return err
		}

		workout = updatedWorkout
		machine = resolvedMachine
		return nil
	})
	if err != nil {
		return models.Workout{}, models.UserMachine{}, err
	}

	return workout, machine, nil
}

func (s *WorkoutService) RemoveMachine(userID uint, workoutID uint, machineID string) (models.Workout, bool, error) {
	machineID = strings.TrimSpace(machineID)
	if machineID == "" {
		return models.Workout{}, false, errors.New("maquina nao informada")
	}

	var workout models.Workout
	removedMachine := false

	err := s.db.Transaction(func(tx *gorm.DB) error {
		workoutRepo := repositories.NewWorkoutRepository(tx)
		userMachineRepo := repositories.NewUserMachineRepository(tx)

		currentWorkout, err := workoutRepo.FindByIDAndUserID(workoutID, userID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("treino nao encontrado")
			}

			return err
		}

		if _, err := userMachineRepo.FindByIDAndUserID(machineID, userID); err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("maquina nao encontrada")
			}

			return err
		}

		isAssignedToWorkout := false
		for _, assignment := range currentWorkout.MachineAssignments {
			if assignment.UserMachineID == machineID {
				isAssignedToWorkout = true
				break
			}
		}

		if !isAssignedToWorkout {
			return errors.New("maquina nao vinculada a este treino")
		}

		if err := workoutRepo.DeleteAssignment(currentWorkout.ID, machineID); err != nil {
			return err
		}

		assignmentsCount, err := workoutRepo.CountAssignmentsByUserMachineID(machineID)
		if err != nil {
			return err
		}

		if assignmentsCount == 0 {
			hasHistory, err := hasHistoryForUserMachine(tx, machineID)
			if err != nil {
				return err
			}

			if !hasHistory {
				if err := userMachineRepo.DeleteByIDAndUserID(machineID, userID); err != nil {
					return err
				}
				removedMachine = true
			}
		}

		updatedWorkout, err := workoutRepo.FindByIDAndUserID(workoutID, userID)
		if err != nil {
			return err
		}

		workout = updatedWorkout
		return nil
	})
	if err != nil {
		return models.Workout{}, false, err
	}

	return workout, removedMachine, nil
}

func (s *WorkoutService) ReplaceAll(userID uint, inputWorkouts []ReplaceWorkoutInput) ([]models.Workout, []models.UserMachine, error) {
	normalizedWorkouts, err := normalizeReplaceWorkouts(inputWorkouts)
	if err != nil {
		return []models.Workout{}, []models.UserMachine{}, err
	}

	var workouts []models.Workout
	var machines []models.UserMachine

	err = s.db.Transaction(func(tx *gorm.DB) error {
		var replaceErr error
		workouts, machines, replaceErr = replaceWorkoutsInTx(tx, userID, normalizedWorkouts)
		return replaceErr
	})
	if err != nil {
		return []models.Workout{}, []models.UserMachine{}, err
	}

	return workouts, machines, nil
}

func replaceWorkoutsInTx(tx *gorm.DB, userID uint, normalizedWorkouts []ReplaceWorkoutInput) ([]models.Workout, []models.UserMachine, error) {
	workoutRepo := repositories.NewWorkoutRepository(tx)
	userMachineRepo := repositories.NewUserMachineRepository(tx)

	if err := workoutRepo.DeleteAllByUserID(userID); err != nil {
		return []models.Workout{}, []models.UserMachine{}, err
	}

	if err := userMachineRepo.DeleteUnassignedWithoutHistoryByUserID(userID); err != nil {
		return []models.Workout{}, []models.UserMachine{}, err
	}

	for workoutIndex, workoutInput := range normalizedWorkouts {
		workout, err := workoutRepo.Create(models.Workout{
			UserID:      userID,
			Title:       workoutInput.Title,
			Description: workoutInput.Description,
			Position:    workoutIndex,
		})
		if err != nil {
			return []models.Workout{}, []models.UserMachine{}, err
		}

		assignedMachines := make(map[string]struct{}, len(workoutInput.Machines))
		for position, machineInput := range workoutInput.Machines {
			resolvedMachine, err := resolveUserMachineForInput(tx, userID, machineInput)
			if err != nil {
				return []models.Workout{}, []models.UserMachine{}, err
			}

			if _, exists := assignedMachines[resolvedMachine.ID]; exists {
				return []models.Workout{}, []models.UserMachine{}, errors.New("maquinas duplicadas no mesmo treino nao sao permitidas")
			}
			assignedMachines[resolvedMachine.ID] = struct{}{}

			if _, err := workoutRepo.CreateAssignment(models.WorkoutMachine{
				WorkoutID:     workout.ID,
				UserMachineID: resolvedMachine.ID,
				Position:      position,
			}); err != nil {
				return []models.Workout{}, []models.UserMachine{}, err
			}
		}
	}

	updatedWorkouts, err := workoutRepo.FindByUserID(userID)
	if err != nil {
		return []models.Workout{}, []models.UserMachine{}, err
	}

	userMachines, err := userMachineRepo.FindByUserID(userID)
	if err != nil {
		return []models.Workout{}, []models.UserMachine{}, err
	}

	return updatedWorkouts, userMachines, nil
}

func normalizeCreateWorkoutInput(input CreateWorkoutInput) (CreateWorkoutInput, error) {
	title := strings.TrimSpace(input.Title)
	if title == "" {
		return CreateWorkoutInput{}, errors.New("informe o titulo do treino")
	}

	return CreateWorkoutInput{
		Title:       title,
		Description: strings.TrimSpace(input.Description),
	}, nil
}

func normalizeReplaceWorkouts(inputWorkouts []ReplaceWorkoutInput) ([]ReplaceWorkoutInput, error) {
	normalizedWorkouts := make([]ReplaceWorkoutInput, 0, len(inputWorkouts))

	for _, workout := range inputWorkouts {
		normalizedWorkout, err := normalizeCreateWorkoutInput(CreateWorkoutInput{
			Title:       workout.Title,
			Description: workout.Description,
		})
		if err != nil {
			return nil, err
		}

		normalizedMachines := make([]CreateWorkoutMachineInput, 0, len(workout.Machines))
		for _, machine := range workout.Machines {
			normalizedMachine, err := normalizeCreateWorkoutMachineInput(machine)
			if err != nil {
				return nil, err
			}

			normalizedMachines = append(normalizedMachines, normalizedMachine)
		}

		normalizedWorkouts = append(normalizedWorkouts, ReplaceWorkoutInput{
			Title:       normalizedWorkout.Title,
			Description: normalizedWorkout.Description,
			Machines:    normalizedMachines,
		})
	}

	return normalizedWorkouts, nil
}
