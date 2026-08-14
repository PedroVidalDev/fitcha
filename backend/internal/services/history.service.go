package services

import (
	"errors"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"strings"
	"time"

	"gorm.io/gorm"
)

type CreateWorkoutResultInput struct {
	MachineID        string
	CatalogMachineID string
	Sets             []CreateWorkoutSetInput
}

type CreateWorkoutSetInput struct {
	Weight          float64
	Reps            int
	DurationSeconds int
}

type TransferMachineHistoryInput struct {
	TargetUserMachineID string
	TargetCatalogID     string
	ReplaceInWorkouts   bool
}

type TransferMachineHistoryResult struct {
	SourceMachineID  string
	TargetMachine    models.UserMachine
	TransferredCount int64
	UpdatedWorkouts  []models.Workout
}

type HistoryService struct {
	db      *gorm.DB
	history repositories.IHistoryRepository
}

func NewHistoryService(db *gorm.DB, historyRepo repositories.IHistoryRepository) *HistoryService {
	return &HistoryService{
		db:      db,
		history: historyRepo,
	}
}

func (s *HistoryService) ListByUserID(userID uint) ([]models.HistoryEntry, error) {
	return s.history.FindByUserID(userID)
}

func (s *HistoryService) ListByMachine(userID uint, machineID string, page int, limit int) ([]models.HistoryEntry, int64, error) {
	machineID = strings.TrimSpace(machineID)
	if machineID == "" {
		return []models.HistoryEntry{}, 0, errors.New("maquina nao informada")
	}

	userMachineRepo := repositories.NewUserMachineRepository(s.db)
	if _, err := userMachineRepo.FindByIDAndUserID(machineID, userID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []models.HistoryEntry{}, 0, errors.New("maquina nao encontrada")
		}
		return []models.HistoryEntry{}, 0, err
	}

	return s.history.FindPageByUserMachineIDAndUserID(machineID, userID, page, limit)
}

func (s *HistoryService) GetMachineRecord(userID uint, machineID string) (*models.HistoryEntry, error) {
	machineID = strings.TrimSpace(machineID)
	userMachineRepo := repositories.NewUserMachineRepository(s.db)
	machine, err := userMachineRepo.FindByIDAndUserID(machineID, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("maquina nao encontrada")
		}
		return nil, err
	}

	metricKind := "weight"
	if machine.EffectiveTrackingType() == string(models.MachineTrackingTypeDuration) {
		metricKind = "duration"
	} else if !machine.EffectiveRequiresWeight() {
		metricKind = "reps"
	}

	entry, err := s.history.FindRecordByUserMachineIDAndUserID(machineID, userID, metricKind)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &entry, nil
}

func (s *HistoryService) Delete(userID uint, historyID string) error {
	historyID = strings.TrimSpace(historyID)
	if historyID == "" {
		return errors.New("registro de historico nao informado")
	}

	if err := s.history.DeleteByIDAndUserID(historyID, userID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("registro de historico nao encontrado")
		}

		return err
	}

	return nil
}

func (s *HistoryService) TransferMachineHistory(userID uint, sourceMachineID string, input TransferMachineHistoryInput) (TransferMachineHistoryResult, error) {
	sourceMachineID = strings.TrimSpace(sourceMachineID)
	targetUserMachineID := strings.TrimSpace(input.TargetUserMachineID)
	targetCatalogID := strings.TrimSpace(input.TargetCatalogID)

	if sourceMachineID == "" {
		return TransferMachineHistoryResult{}, errors.New("maquina de origem nao informada")
	}
	if (targetUserMachineID == "") == (targetCatalogID == "") {
		return TransferMachineHistoryResult{}, errors.New("informe apenas uma maquina de destino")
	}

	var transferResult TransferMachineHistoryResult
	err := s.db.Transaction(func(tx *gorm.DB) error {
		userMachineRepo := repositories.NewUserMachineRepository(tx)
		historyRepo := repositories.NewHistoryRepository(tx)
		workoutRepo := repositories.NewWorkoutRepository(tx)

		sourceMachine, err := userMachineRepo.FindByIDAndUserID(sourceMachineID, userID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("maquina de origem nao encontrada")
			}
			return err
		}

		var targetMachine models.UserMachine
		if targetUserMachineID != "" {
			targetMachine, err = userMachineRepo.FindByIDAndUserID(targetUserMachineID, userID)
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("maquina de destino nao encontrada")
			}
		} else {
			targetMachine, err = resolveUserMachineForInput(tx, userID, CreateWorkoutMachineInput{
				CatalogMachineID: targetCatalogID,
			})
		}
		if err != nil {
			return err
		}

		if sourceMachine.ID == targetMachine.ID {
			return errors.New("selecione uma maquina diferente da atual")
		}
		if sourceMachine.EffectiveTrackingType() != targetMachine.EffectiveTrackingType() ||
			sourceMachine.EffectiveRequiresWeight() != targetMachine.EffectiveRequiresWeight() {
			return errors.New("a maquina de destino possui um tipo de registro incompativel")
		}

		transferredCount, err := historyRepo.ReassignAllByUserMachineID(sourceMachine.ID, targetMachine.ID)
		if err != nil {
			return err
		}
		if transferredCount == 0 {
			return errors.New("a maquina de origem nao possui historico para transferir")
		}

		updatedWorkouts := []models.Workout{}
		if input.ReplaceInWorkouts {
			updatedWorkouts, err = workoutRepo.ReplaceMachineAssignmentsByUserID(userID, sourceMachine.ID, targetMachine.ID)
			if err != nil {
				return err
			}
		}

		transferResult = TransferMachineHistoryResult{
			SourceMachineID:  sourceMachine.ID,
			TargetMachine:    targetMachine,
			TransferredCount: transferredCount,
			UpdatedWorkouts:  updatedWorkouts,
		}
		return nil
	})
	if err != nil {
		return TransferMachineHistoryResult{}, err
	}

	return transferResult, nil
}

func (s *HistoryService) CreateWorkout(userID uint, results []CreateWorkoutResultInput) ([]models.HistoryEntry, error) {
	if len(results) == 0 {
		return []models.HistoryEntry{}, errors.New("informe ao menos um resultado de treino")
	}

	normalizedResults := make([]CreateWorkoutResultInput, 0, len(results))
	for _, result := range results {
		machineID := strings.TrimSpace(result.MachineID)
		catalogMachineID := strings.TrimSpace(result.CatalogMachineID)
		if machineID == "" && catalogMachineID == "" {
			return []models.HistoryEntry{}, errors.New("maquina nao informada")
		}
		if machineID != "" && catalogMachineID != "" {
			return []models.HistoryEntry{}, errors.New("informe apenas uma maquina por resultado")
		}

		normalizedResults = append(normalizedResults, CreateWorkoutResultInput{
			MachineID:        machineID,
			CatalogMachineID: catalogMachineID,
			Sets:             result.Sets,
		})
	}

	var createdEntries []models.HistoryEntry

	err := s.db.Transaction(func(tx *gorm.DB) error {
		historyRepo := repositories.NewHistoryRepository(tx)
		userMachineRepo := repositories.NewUserMachineRepository(tx)
		performedAt := time.Now().UTC()
		entries := make([]models.HistoryEntry, 0, len(normalizedResults))

		for _, result := range normalizedResults {
			var userMachine models.UserMachine
			var err error

			if result.CatalogMachineID != "" {
				userMachine, err = resolveUserMachineForInput(tx, userID, CreateWorkoutMachineInput{
					CatalogMachineID: result.CatalogMachineID,
				})
			} else {
				userMachine, err = userMachineRepo.FindByIDAndUserID(result.MachineID, userID)
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return errors.New("maquina nao encontrada")
				}
			}
			if err != nil {
				return err
			}

			normalizedSets, err := normalizeWorkoutSetsByMachine(userMachine, result.Sets)
			if err != nil {
				return err
			}

			entryID, err := generateID()
			if err != nil {
				return err
			}

			sets := make([]models.HistorySet, 0, len(normalizedSets))
			for index, set := range normalizedSets {
				sets = append(sets, models.HistorySet{
					HistoryEntryID:  entryID,
					Position:        index + 1,
					Weight:          set.Weight,
					Reps:            set.Reps,
					DurationSeconds: set.DurationSeconds,
				})
			}

			entries = append(entries, models.HistoryEntry{
				ID:            entryID,
				UserMachineID: userMachine.ID,
				PerformedAt:   performedAt,
				Sets:          sets,
			})
		}

		insertedEntries, err := historyRepo.CreateMany(entries)
		if err != nil {
			return err
		}

		createdEntries = insertedEntries
		return nil
	})
	if err != nil {
		return []models.HistoryEntry{}, err
	}

	return createdEntries, nil
}

func normalizeWorkoutSetsByMachine(machine models.UserMachine, sets []CreateWorkoutSetInput) ([]CreateWorkoutSetInput, error) {
	if len(sets) == 0 {
		return []CreateWorkoutSetInput{}, errors.New("informe ao menos um registro por maquina")
	}

	trackingType := machine.EffectiveTrackingType()
	requiresWeight := machine.EffectiveRequiresWeight()
	normalizedSets := make([]CreateWorkoutSetInput, 0, len(sets))

	switch trackingType {
	case string(models.MachineTrackingTypeDuration):
		if len(sets) != 1 {
			return []CreateWorkoutSetInput{}, errors.New("exercicios por tempo aceitam apenas um registro")
		}

		for _, set := range sets {
			if set.DurationSeconds <= 0 {
				return []CreateWorkoutSetInput{}, errors.New("informe um tempo valido para o exercicio")
			}

			normalizedSets = append(normalizedSets, CreateWorkoutSetInput{
				Weight:          0,
				Reps:            0,
				DurationSeconds: set.DurationSeconds,
			})
		}

		return normalizedSets, nil
	default:
		for _, set := range sets {
			if requiresWeight && set.Weight <= 0 {
				return []CreateWorkoutSetInput{}, errors.New("informe um peso valido para todas as series")
			}

			if set.Reps <= 0 {
				return []CreateWorkoutSetInput{}, errors.New("informe repeticoes validas para todas as series")
			}

			weight := 0.0
			if requiresWeight {
				weight = set.Weight
			}

			normalizedSets = append(normalizedSets, CreateWorkoutSetInput{
				Weight:          weight,
				Reps:            set.Reps,
				DurationSeconds: 0,
			})
		}

		return normalizedSets, nil
	}
}
