package services

import (
	"errors"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"strings"

	"gorm.io/gorm"
)

type CreateWorkoutMachineInput struct {
	UserMachineID    string
	CatalogMachineID string
	Name             string
	Description      string
	Photo            string
	CategoryKey      string
	TrackingType     string
	RequiresWeight   *bool
}

func normalizeCreateWorkoutMachineInput(input CreateWorkoutMachineInput) (CreateWorkoutMachineInput, error) {
	userMachineID := strings.TrimSpace(input.UserMachineID)
	catalogMachineID := strings.TrimSpace(input.CatalogMachineID)
	if userMachineID != "" {
		if catalogMachineID != "" {
			return CreateWorkoutMachineInput{}, errors.New("informe apenas uma origem para a maquina")
		}

		return CreateWorkoutMachineInput{UserMachineID: userMachineID}, nil
	}

	if catalogMachineID != "" {
		return CreateWorkoutMachineInput{
			CatalogMachineID: catalogMachineID,
			Description:      strings.TrimSpace(input.Description),
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

	requiresWeight := true
	if input.RequiresWeight != nil {
		requiresWeight = *input.RequiresWeight
	}

	trackingType, normalizedRequiresWeight, err := models.NormalizeMachineTrackingConfig(input.TrackingType, requiresWeight)
	if err != nil {
		return CreateWorkoutMachineInput{}, err
	}

	return CreateWorkoutMachineInput{
		Name:           name,
		Description:    strings.TrimSpace(input.Description),
		Photo:          strings.TrimSpace(input.Photo),
		CategoryKey:    categoryKey,
		TrackingType:   trackingType,
		RequiresWeight: &normalizedRequiresWeight,
	}, nil
}

func resolveUserMachineForInput(tx *gorm.DB, userID uint, input CreateWorkoutMachineInput) (models.UserMachine, error) {
	userMachineRepo := repositories.NewUserMachineRepository(tx)
	machineRepo := repositories.NewMachineRepository(tx)

	if input.UserMachineID != "" {
		userMachine, err := userMachineRepo.FindByIDAndUserID(input.UserMachineID, userID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return models.UserMachine{}, errors.New("maquina personalizada nao encontrada")
			}

			return models.UserMachine{}, err
		}

		return userMachine, nil
	}

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
			needsUpdate := false

			if input.Description != "" && existing.Description != input.Description {
				existing.Description = input.Description
				needsUpdate = true
			}

			if input.Photo != "" && existing.Photo != input.Photo {
				existing.Photo = input.Photo
				needsUpdate = true
			}

			if existing.CategoryKey != catalogMachine.CategoryKey {
				existing.CategoryKey = catalogMachine.CategoryKey
				needsUpdate = true
			}

			if existing.TrackingType != catalogMachine.EffectiveTrackingType() {
				existing.TrackingType = catalogMachine.EffectiveTrackingType()
				needsUpdate = true
			}

			if existing.RequiresWeight != catalogMachine.EffectiveRequiresWeight() {
				existing.RequiresWeight = catalogMachine.EffectiveRequiresWeight()
				needsUpdate = true
			}

			if needsUpdate {
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
			ID:             userMachineID,
			UserID:         userID,
			MachineID:      &machineID,
			Description:    input.Description,
			Photo:          input.Photo,
			CategoryKey:    catalogMachine.CategoryKey,
			TrackingType:   catalogMachine.EffectiveTrackingType(),
			RequiresWeight: catalogMachine.EffectiveRequiresWeight(),
		})
	}

	userMachineID, err := generateID()
	if err != nil {
		return models.UserMachine{}, err
	}

	return userMachineRepo.Create(models.UserMachine{
		ID:             userMachineID,
		UserID:         userID,
		Name:           input.Name,
		Description:    input.Description,
		Photo:          input.Photo,
		CategoryKey:    input.CategoryKey,
		TrackingType:   input.TrackingType,
		RequiresWeight: input.RequiresWeight != nil && *input.RequiresWeight,
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
