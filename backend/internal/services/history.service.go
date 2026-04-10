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
	Sets      [3]float64
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

		normalizedResults = append(normalizedResults, CreateWorkoutResultInput{
			MachineID: machineID,
			Sets:      result.Sets,
		})
	}

	var createdEntries []models.HistoryEntry

	err := s.db.Transaction(func(tx *gorm.DB) error {
		historyRepo := repositories.NewHistoryRepository(tx)
		machineRepo := repositories.NewMachineRepository(tx)
		performedAt := time.Now().UTC()
		entries := make([]models.HistoryEntry, 0, len(normalizedResults))

		for _, result := range normalizedResults {
			if _, err := machineRepo.FindByIDAndUserID(result.MachineID, userID); err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return errors.New("maquina nao encontrada")
				}

				return err
			}

			entryID, err := generateID()
			if err != nil {
				return err
			}

			entries = append(entries, models.HistoryEntry{
				ID:          entryID,
				MachineID:   result.MachineID,
				PerformedAt: performedAt,
				Set1:        result.Sets[0],
				Set2:        result.Sets[1],
				Set3:        result.Sets[2],
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
