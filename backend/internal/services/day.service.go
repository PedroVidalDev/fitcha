package services

import (
	"errors"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"strings"

	"gorm.io/gorm"
)

type CreateDayMachineInput struct {
	CatalogMachineID string
	Name             string
	Description      string
	Photo            string
	CategoryKey      string
}

type ReplaceWeekDayInput struct {
	DayIndex int
	Machines []CreateDayMachineInput
}

type DayService struct {
	db   *gorm.DB
	days repositories.IDayRepository
}

func NewDayService(db *gorm.DB, dayRepo repositories.IDayRepository) *DayService {
	return &DayService{
		db:   db,
		days: dayRepo,
	}
}

func (s *DayService) ListByUserID(userID uint) ([]models.Day, error) {
	if err := s.days.EnsureWeek(userID); err != nil {
		return []models.Day{}, err
	}

	return s.days.FindByUserID(userID)
}

func (s *DayService) AddMachine(userID uint, dayIndex int, input CreateDayMachineInput) (models.Day, models.UserMachine, error) {
	if err := validateDayIndex(dayIndex); err != nil {
		return models.Day{}, models.UserMachine{}, err
	}

	normalizedInput, err := normalizeCreateDayMachineInput(input)
	if err != nil {
		return models.Day{}, models.UserMachine{}, err
	}

	var day models.Day
	var machine models.UserMachine

	err = s.db.Transaction(func(tx *gorm.DB) error {
		dayRepo := repositories.NewDayRepository(tx)

		if err := dayRepo.EnsureWeek(userID); err != nil {
			return err
		}

		currentDay, err := dayRepo.FindByUserIDAndDayIndex(userID, dayIndex)
		if err != nil {
			return errors.New("dia de treino nao encontrado")
		}

		resolvedMachine, err := resolveUserMachineForInput(tx, userID, normalizedInput)
		if err != nil {
			return err
		}

		for _, assignment := range currentDay.MachineAssignments {
			if assignment.UserMachineID == resolvedMachine.ID {
				return errors.New("maquina ja vinculada a este dia")
			}
		}

		if _, err := dayRepo.CreateAssignment(models.DayMachine{
			DayID:         currentDay.ID,
			UserMachineID: resolvedMachine.ID,
			Position:      len(currentDay.MachineAssignments),
		}); err != nil {
			return err
		}

		updatedDay, err := dayRepo.FindByUserIDAndDayIndex(userID, dayIndex)
		if err != nil {
			return err
		}

		day = updatedDay
		machine = resolvedMachine
		return nil
	})
	if err != nil {
		return models.Day{}, models.UserMachine{}, err
	}

	return day, machine, nil
}

func (s *DayService) RemoveMachine(userID uint, dayIndex int, machineID string) (models.Day, bool, error) {
	if err := validateDayIndex(dayIndex); err != nil {
		return models.Day{}, false, err
	}

	machineID = strings.TrimSpace(machineID)
	if machineID == "" {
		return models.Day{}, false, errors.New("maquina nao informada")
	}

	var day models.Day
	removedMachine := false

	err := s.db.Transaction(func(tx *gorm.DB) error {
		dayRepo := repositories.NewDayRepository(tx)
		userMachineRepo := repositories.NewUserMachineRepository(tx)

		if err := dayRepo.EnsureWeek(userID); err != nil {
			return err
		}

		currentDay, err := dayRepo.FindByUserIDAndDayIndex(userID, dayIndex)
		if err != nil {
			return errors.New("dia de treino nao encontrado")
		}

		if _, err := userMachineRepo.FindByIDAndUserID(machineID, userID); err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("maquina nao encontrada")
			}

			return err
		}

		isAssignedToDay := false
		for _, assignment := range currentDay.MachineAssignments {
			if assignment.UserMachineID == machineID {
				isAssignedToDay = true
				break
			}
		}

		if !isAssignedToDay {
			return errors.New("maquina nao vinculada a este dia")
		}

		if err := dayRepo.DeleteAssignment(currentDay.ID, machineID); err != nil {
			return err
		}

		assignmentsCount, err := dayRepo.CountAssignmentsByUserMachineID(machineID)
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

		updatedDay, err := dayRepo.FindByUserIDAndDayIndex(userID, dayIndex)
		if err != nil {
			return err
		}

		day = updatedDay
		return nil
	})
	if err != nil {
		return models.Day{}, false, err
	}

	return day, removedMachine, nil
}

func (s *DayService) ReplaceWeek(userID uint, inputDays []ReplaceWeekDayInput) ([]models.Day, []models.UserMachine, error) {
	normalizedDays, err := normalizeReplaceWeekDays(inputDays)
	if err != nil {
		return []models.Day{}, []models.UserMachine{}, err
	}

	var days []models.Day
	var machines []models.UserMachine

	err = s.db.Transaction(func(tx *gorm.DB) error {
		var replaceErr error
		days, machines, replaceErr = replaceWeekInTx(tx, userID, normalizedDays)
		return replaceErr
	})
	if err != nil {
		return []models.Day{}, []models.UserMachine{}, err
	}

	return days, machines, nil
}

func replaceWeekInTx(tx *gorm.DB, userID uint, normalizedDays map[int][]CreateDayMachineInput) ([]models.Day, []models.UserMachine, error) {
	dayRepo := repositories.NewDayRepository(tx)
	userMachineRepo := repositories.NewUserMachineRepository(tx)

	if err := dayRepo.EnsureWeek(userID); err != nil {
		return []models.Day{}, []models.UserMachine{}, err
	}

	currentDays, err := dayRepo.FindByUserID(userID)
	if err != nil {
		return []models.Day{}, []models.UserMachine{}, err
	}

	dayByIndex := make(map[int]models.Day, len(currentDays))
	for _, day := range currentDays {
		dayByIndex[day.DayIndex] = day
	}

	for _, day := range currentDays {
		for _, assignment := range day.MachineAssignments {
			if err := dayRepo.DeleteAssignment(day.ID, assignment.UserMachineID); err != nil {
				return []models.Day{}, []models.UserMachine{}, err
			}
		}
	}

	if err := userMachineRepo.DeleteUnassignedWithoutHistoryByUserID(userID); err != nil {
		return []models.Day{}, []models.UserMachine{}, err
	}

	for dayIndex := 0; dayIndex < 7; dayIndex++ {
		currentDay, exists := dayByIndex[dayIndex]
		if !exists {
			return []models.Day{}, []models.UserMachine{}, errors.New("dia de treino nao encontrado")
		}

		assignedMachines := make(map[string]struct{}, len(normalizedDays[dayIndex]))
		for position, machineInput := range normalizedDays[dayIndex] {
			resolvedMachine, err := resolveUserMachineForInput(tx, userID, machineInput)
			if err != nil {
				return []models.Day{}, []models.UserMachine{}, err
			}

			if _, exists := assignedMachines[resolvedMachine.ID]; exists {
				return []models.Day{}, []models.UserMachine{}, errors.New("maquinas duplicadas no mesmo dia nao sao permitidas")
			}
			assignedMachines[resolvedMachine.ID] = struct{}{}

			if _, err := dayRepo.CreateAssignment(models.DayMachine{
				DayID:         currentDay.ID,
				UserMachineID: resolvedMachine.ID,
				Position:      position,
			}); err != nil {
				return []models.Day{}, []models.UserMachine{}, err
			}
		}
	}

	updatedDays, err := dayRepo.FindByUserID(userID)
	if err != nil {
		return []models.Day{}, []models.UserMachine{}, err
	}

	userMachines, err := userMachineRepo.FindByUserID(userID)
	if err != nil {
		return []models.Day{}, []models.UserMachine{}, err
	}

	return updatedDays, userMachines, nil
}

func validateDayIndex(dayIndex int) error {
	if dayIndex < 0 || dayIndex > 6 {
		return errors.New("dia da semana invalido")
	}

	return nil
}

func normalizeCreateDayMachineInput(input CreateDayMachineInput) (CreateDayMachineInput, error) {
	catalogMachineID := strings.TrimSpace(input.CatalogMachineID)
	if catalogMachineID != "" {
		return CreateDayMachineInput{
			CatalogMachineID: catalogMachineID,
			Photo:            strings.TrimSpace(input.Photo),
		}, nil
	}

	name := strings.TrimSpace(input.Name)
	if name == "" {
		return CreateDayMachineInput{}, errors.New("informe o nome da maquina")
	}

	categoryKey := strings.TrimSpace(input.CategoryKey)
	if !models.IsValidMachineCategoryKey(categoryKey) {
		return CreateDayMachineInput{}, errors.New("categoria da maquina invalida")
	}

	return CreateDayMachineInput{
		Name:        name,
		Description: strings.TrimSpace(input.Description),
		Photo:       strings.TrimSpace(input.Photo),
		CategoryKey: categoryKey,
	}, nil
}

func normalizeReplaceWeekDays(inputDays []ReplaceWeekDayInput) (map[int][]CreateDayMachineInput, error) {
	normalizedDays := make(map[int][]CreateDayMachineInput, 7)
	seenDayIndexes := make(map[int]struct{}, len(inputDays))

	for dayIndex := 0; dayIndex < 7; dayIndex++ {
		normalizedDays[dayIndex] = []CreateDayMachineInput{}
	}

	for _, inputDay := range inputDays {
		if err := validateDayIndex(inputDay.DayIndex); err != nil {
			return nil, err
		}

		if _, exists := seenDayIndexes[inputDay.DayIndex]; exists {
			return nil, errors.New("dias duplicados nao sao permitidos")
		}
		seenDayIndexes[inputDay.DayIndex] = struct{}{}

		normalizedMachines := make([]CreateDayMachineInput, 0, len(inputDay.Machines))
		for _, machine := range inputDay.Machines {
			normalizedMachine, err := normalizeCreateDayMachineInput(machine)
			if err != nil {
				return nil, err
			}

			normalizedMachines = append(normalizedMachines, normalizedMachine)
		}

		normalizedDays[inputDay.DayIndex] = normalizedMachines
	}

	return normalizedDays, nil
}

func resolveUserMachineForInput(tx *gorm.DB, userID uint, input CreateDayMachineInput) (models.UserMachine, error) {
	userMachineRepo := repositories.NewUserMachineRepository(tx)
	machineRepo := repositories.NewMachineRepository(tx)

	if input.CatalogMachineID != "" {
		catalogMachine, err := machineRepo.FindByID(input.CatalogMachineID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return models.UserMachine{}, errors.New("maquina de catalogo nao encontrada")
			}

			return models.UserMachine{}, err
		}

		existing, err := userMachineRepo.FindByMachineIDAndUserID(catalogMachine.ID, userID)
		if err == nil {
			if input.Photo != "" && existing.Photo != input.Photo {
				existing.Photo = input.Photo
				return userMachineRepo.Update(existing)
			}

			return existing, nil
		}

		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return models.UserMachine{}, err
		}

		userMachineID, err := generateID()
		if err != nil {
			return models.UserMachine{}, err
		}

		machineID := catalogMachine.ID
		return userMachineRepo.Create(models.UserMachine{
			ID:        userMachineID,
			UserID:    userID,
			MachineID: &machineID,
			Photo:     input.Photo,
		})
	}

	userMachineID, err := generateID()
	if err != nil {
		return models.UserMachine{}, err
	}

	return userMachineRepo.Create(models.UserMachine{
		ID:          userMachineID,
		UserID:      userID,
		Name:        input.Name,
		Description: input.Description,
		Photo:       input.Photo,
		CategoryKey: input.CategoryKey,
	})
}

func hasHistoryForUserMachine(tx *gorm.DB, userMachineID string) (bool, error) {
	var count int64
	err := tx.Model(&models.HistoryEntry{}).
		Where("user_machine_id = ?", userMachineID).
		Count(&count).
		Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}
