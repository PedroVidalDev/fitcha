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
	MachineID string
	Sets      []CreateWorkoutSetInput
}

type CreateWorkoutSetInput struct {
	Weight float64
	Reps   int
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

func (s *HistoryService) CreateWorkout(userID uint, results []CreateWorkoutResultInput) ([]models.HistoryEntry, error) {
	if len(results) == 0 {
		return []models.HistoryEntry{}, errors.New("informe ao menos um resultado de treino")
	}

	normalizedResults := make([]CreateWorkoutResultInput, 0, len(results))
	for _, result := range results {
		machineID := strings.TrimSpace(result.MachineID)
		if machineID == "" {
			return []models.HistoryEntry{}, errors.New("maquina nao informada")
		}

		if len(result.Sets) == 0 {
			return []models.HistoryEntry{}, errors.New("informe ao menos uma serie por maquina")
		}

		normalizedSets := make([]CreateWorkoutSetInput, 0, len(result.Sets))
		for _, set := range result.Sets {
			if set.Weight <= 0 {
				return []models.HistoryEntry{}, errors.New("informe um peso valido para todas as series")
			}

			if set.Reps <= 0 {
				return []models.HistoryEntry{}, errors.New("informe repeticoes validas para todas as series")
			}

			normalizedSets = append(normalizedSets, CreateWorkoutSetInput{
				Weight: set.Weight,
				Reps:   set.Reps,
			})
		}

		normalizedResults = append(normalizedResults, CreateWorkoutResultInput{
			MachineID: machineID,
			Sets:      normalizedSets,
		})
	}

	var createdEntries []models.HistoryEntry

	err := s.db.Transaction(func(tx *gorm.DB) error {
		historyRepo := repositories.NewHistoryRepository(tx)
		userMachineRepo := repositories.NewUserMachineRepository(tx)
		performedAt := time.Now().UTC()
		entries := make([]models.HistoryEntry, 0, len(normalizedResults))

		for _, result := range normalizedResults {
			if _, err := userMachineRepo.FindByIDAndUserID(result.MachineID, userID); err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return errors.New("maquina nao encontrada")
				}

				return err
			}

			entryID, err := generateID()
			if err != nil {
				return err
			}

			sets := make([]models.HistorySet, 0, len(result.Sets))
			for index, set := range result.Sets {
				sets = append(sets, models.HistorySet{
					HistoryEntryID: entryID,
					Position:       index + 1,
					Weight:         set.Weight,
					Reps:           set.Reps,
				})
			}

			entries = append(entries, models.HistoryEntry{
				ID:            entryID,
				UserMachineID: result.MachineID,
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
