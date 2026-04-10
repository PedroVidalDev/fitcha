package services

import (
	"errors"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"strings"

	"gorm.io/gorm"
)

type CreateDayMachineInput struct {
	Name        string
	Description string
	Photo       string
	CategoryKey string
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

func (s *DayService) AddMachine(userID uint, dayIndex int, input CreateDayMachineInput) (models.Day, models.Machine, error) {
	if err := validateDayIndex(dayIndex); err != nil {
		return models.Day{}, models.Machine{}, err
	}

	normalizedInput, err := normalizeCreateDayMachineInput(input)
	if err != nil {
		return models.Day{}, models.Machine{}, err
	}

	var day models.Day
	var machine models.Machine

	err = s.db.Transaction(func(tx *gorm.DB) error {
		dayRepo := repositories.NewDayRepository(tx)
		machineRepo := repositories.NewMachineRepository(tx)

		if err := dayRepo.EnsureWeek(userID); err != nil {
			return err
		}

		currentDay, err := dayRepo.FindByUserIDAndDayIndex(userID, dayIndex)
		if err != nil {
			return errors.New("dia de treino nao encontrado")
		}

		machineID, err := generateID()
		if err != nil {
			return err
		}

		createdMachine, err := machineRepo.Create(models.Machine{
			ID:          machineID,
			UserID:      userID,
			Name:        normalizedInput.Name,
			Description: normalizedInput.Description,
			Photo:       normalizedInput.Photo,
			CategoryKey: normalizedInput.CategoryKey,
		})
		if err != nil {
			return err
		}

		if _, err := dayRepo.CreateAssignment(models.DayMachine{
			DayID:     currentDay.ID,
			MachineID: createdMachine.ID,
			Position:  len(currentDay.MachineAssignments),
		}); err != nil {
			return err
		}

		updatedDay, err := dayRepo.FindByUserIDAndDayIndex(userID, dayIndex)
		if err != nil {
			return err
		}

		day = updatedDay
		machine = createdMachine
		return nil
	})
	if err != nil {
		return models.Day{}, models.Machine{}, err
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
		machineRepo := repositories.NewMachineRepository(tx)

		if err := dayRepo.EnsureWeek(userID); err != nil {
			return err
		}

		currentDay, err := dayRepo.FindByUserIDAndDayIndex(userID, dayIndex)
		if err != nil {
			return errors.New("dia de treino nao encontrado")
		}

		if _, err := machineRepo.FindByIDAndUserID(machineID, userID); err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("maquina nao encontrada")
			}

			return err
		}

		isAssignedToDay := false
		for _, assignment := range currentDay.MachineAssignments {
			if assignment.MachineID == machineID {
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

		assignmentsCount, err := dayRepo.CountAssignmentsByMachineID(machineID)
		if err != nil {
			return err
		}

		if assignmentsCount == 0 {
			if err := machineRepo.DeleteByIDAndUserID(machineID, userID); err != nil {
				return err
			}
			removedMachine = true
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

func (s *DayService) ReplaceWeek(userID uint, inputDays []ReplaceWeekDayInput) ([]models.Day, []models.Machine, error) {
	normalizedDays, err := normalizeReplaceWeekDays(inputDays)
	if err != nil {
		return []models.Day{}, []models.Machine{}, err
	}

	var days []models.Day
	var machines []models.Machine

	err = s.db.Transaction(func(tx *gorm.DB) error {
		dayRepo := repositories.NewDayRepository(tx)
		machineRepo := repositories.NewMachineRepository(tx)

		if err := dayRepo.EnsureWeek(userID); err != nil {
			return err
		}

		existingMachines, err := machineRepo.FindByUserID(userID)
		if err != nil {
			return err
		}

		machineIDs := make([]string, 0, len(existingMachines))
		for _, machine := range existingMachines {
			machineIDs = append(machineIDs, machine.ID)
		}

		if err := machineRepo.DeleteByIDsAndUserID(machineIDs, userID); err != nil {
			return err
		}

		currentDays, err := dayRepo.FindByUserID(userID)
		if err != nil {
			return err
		}

		dayByIndex := make(map[int]models.Day, len(currentDays))
		for _, day := range currentDays {
			dayByIndex[day.DayIndex] = day
		}

		createdMachines := make([]models.Machine, 0)
		for dayIndex := 0; dayIndex < 7; dayIndex++ {
			currentDay, exists := dayByIndex[dayIndex]
			if !exists {
				return errors.New("dia de treino nao encontrado")
			}

			for position, machineInput := range normalizedDays[dayIndex] {
				machineID, err := generateID()
				if err != nil {
					return err
				}

				createdMachine, err := machineRepo.Create(models.Machine{
					ID:          machineID,
					UserID:      userID,
					Name:        machineInput.Name,
					Description: machineInput.Description,
					Photo:       machineInput.Photo,
					CategoryKey: machineInput.CategoryKey,
				})
				if err != nil {
					return err
				}

				if _, err := dayRepo.CreateAssignment(models.DayMachine{
					DayID:     currentDay.ID,
					MachineID: createdMachine.ID,
					Position:  position,
				}); err != nil {
					return err
				}

				createdMachines = append(createdMachines, createdMachine)
			}
		}

		updatedDays, err := dayRepo.FindByUserID(userID)
		if err != nil {
			return err
		}

		days = updatedDays
		machines = createdMachines
		return nil
	})
	if err != nil {
		return []models.Day{}, []models.Machine{}, err
	}

	return days, machines, nil
}

func validateDayIndex(dayIndex int) error {
	if dayIndex < 0 || dayIndex > 6 {
		return errors.New("dia da semana invalido")
	}

	return nil
}

func normalizeCreateDayMachineInput(input CreateDayMachineInput) (CreateDayMachineInput, error) {
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
