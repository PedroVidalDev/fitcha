package services

import (
	"errors"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"strings"

	"gorm.io/gorm"
)

type CreateWorkoutMachineInput struct {
	CatalogMachineID string
	Name             string
	Description      string
	Photo            string
	CategoryKey      string
}

func normalizeCreateWorkoutMachineInput(input CreateWorkoutMachineInput) (CreateWorkoutMachineInput, error) {
	catalogMachineID := strings.TrimSpace(input.CatalogMachineID)
	if catalogMachineID != "" {
		return CreateWorkoutMachineInput{
			CatalogMachineID: catalogMachineID,
			Photo:            strings.TrimSpace(input.Photo),
		}, nil
	}

	name := strings.TrimSpace(input.Name)
	if name == "" {
		return CreateWorkoutMachineInput{}, errors.New("informe o nome da maquina")
	}

	categoryKey := strings.TrimSpace(input.CategoryKey)
	if !models.IsValidMachineCategoryKey(categoryKey) {
		return CreateWorkoutMachineInput{}, errors.New("categoria da maquina invalida")
	}

	return CreateWorkoutMachineInput{
		Name:        name,
		Description: strings.TrimSpace(input.Description),
		Photo:       strings.TrimSpace(input.Photo),
		CategoryKey: categoryKey,
	}, nil
}

func resolveUserMachineForInput(tx *gorm.DB, userID uint, input CreateWorkoutMachineInput) (models.UserMachine, error) {
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
