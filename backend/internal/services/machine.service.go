package services

import (
	"errors"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"strings"

	"gorm.io/gorm"
)

type UpdateMachineInput struct {
	Name           *string
	Description    *string
	Photo          *string
	CategoryKey    *string
	TrackingType   *string
	RequiresWeight *bool
}

type CreateMachineInput struct {
	Name           string
	Description    string
	Photo          string
	CategoryKey    string
	TrackingType   string
	RequiresWeight *bool
}

type MachineService struct {
	userMachines repositories.IUserMachineRepository
	catalog      repositories.IMachineRepository
}

func NewMachineService(userMachines repositories.IUserMachineRepository, catalog repositories.IMachineRepository) *MachineService {
	return &MachineService{
		userMachines: userMachines,
		catalog:      catalog,
	}
}

func (s *MachineService) ListByUserID(userID uint) ([]models.UserMachine, error) {
	return s.userMachines.FindByUserID(userID)
}

func (s *MachineService) ListCatalog() ([]models.Machine, error) {
	return s.catalog.FindAll()
}

func (s *MachineService) Get(userID uint, machineID string) (models.UserMachine, error) {
	machine, err := s.userMachines.FindByIDAndUserID(strings.TrimSpace(machineID), userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.UserMachine{}, errors.New("maquina nao encontrada")
		}

		return models.UserMachine{}, err
	}

	return machine, nil
}

func (s *MachineService) Create(userID uint, input CreateMachineInput) (models.UserMachine, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return models.UserMachine{}, errors.New("informe o nome da maquina")
	}
	if len([]rune(name)) > 120 {
		return models.UserMachine{}, errors.New("o nome da maquina deve ter no maximo 120 caracteres")
	}

	categoryKey := strings.TrimSpace(input.CategoryKey)
	if !models.IsValidMachineCategoryKey(categoryKey) {
		return models.UserMachine{}, errors.New("categoria da maquina invalida")
	}

	requiresWeight := true
	if input.RequiresWeight != nil {
		requiresWeight = *input.RequiresWeight
	}

	trackingType, normalizedRequiresWeight, err := models.NormalizeMachineTrackingConfig(input.TrackingType, requiresWeight)
	if err != nil {
		return models.UserMachine{}, err
	}

	machineID, err := generateID()
	if err != nil {
		return models.UserMachine{}, err
	}

	return s.userMachines.Create(models.UserMachine{
		ID:             machineID,
		UserID:         userID,
		Name:           name,
		Description:    strings.TrimSpace(input.Description),
		Photo:          strings.TrimSpace(input.Photo),
		CategoryKey:    categoryKey,
		TrackingType:   trackingType,
		RequiresWeight: normalizedRequiresWeight,
	})
}

func (s *MachineService) Update(userID uint, machineID string, input UpdateMachineInput) (models.UserMachine, error) {
	machine, err := s.userMachines.FindByIDAndUserID(strings.TrimSpace(machineID), userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.UserMachine{}, errors.New("maquina nao encontrada")
		}

		return models.UserMachine{}, err
	}

	isCatalogLinked := machine.MachineID != nil

	if input.Name != nil {
		if isCatalogLinked {
			return models.UserMachine{}, errors.New("o nome de uma maquina de catalogo nao pode ser alterado")
		}

		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return models.UserMachine{}, errors.New("informe o nome da maquina")
		}
		if len([]rune(name)) > 120 {
			return models.UserMachine{}, errors.New("o nome da maquina deve ter no maximo 120 caracteres")
		}

		machine.Name = name
	}

	if input.Description != nil {
		if isCatalogLinked {
			return models.UserMachine{}, errors.New("a descricao de uma maquina de catalogo nao pode ser alterada")
		}

		machine.Description = strings.TrimSpace(*input.Description)
	}

	if input.Photo != nil {
		machine.Photo = strings.TrimSpace(*input.Photo)
	}

	if input.CategoryKey != nil {
		if isCatalogLinked {
			return models.UserMachine{}, errors.New("a categoria de uma maquina de catalogo nao pode ser alterada")
		}

		categoryKey := strings.TrimSpace(*input.CategoryKey)
		if !models.IsValidMachineCategoryKey(categoryKey) {
			return models.UserMachine{}, errors.New("categoria da maquina invalida")
		}

		machine.CategoryKey = categoryKey
	}

	if input.TrackingType != nil || input.RequiresWeight != nil {
		if isCatalogLinked {
			return models.UserMachine{}, errors.New("o tipo de registro de uma maquina de catalogo nao pode ser alterado")
		}

		trackingType := machine.EffectiveTrackingType()
		if input.TrackingType != nil {
			trackingType = strings.TrimSpace(*input.TrackingType)
		}

		requiresWeight := machine.EffectiveRequiresWeight()
		if input.RequiresWeight != nil {
			requiresWeight = *input.RequiresWeight
		}

		normalizedTrackingType, normalizedRequiresWeight, err := models.NormalizeMachineTrackingConfig(trackingType, requiresWeight)
		if err != nil {
			return models.UserMachine{}, err
		}

		machine.TrackingType = normalizedTrackingType
		machine.RequiresWeight = normalizedRequiresWeight
	}

	return s.userMachines.Update(machine)
}

func (s *MachineService) Delete(userID uint, machineID string) error {
	machine, err := s.userMachines.FindByIDAndUserID(strings.TrimSpace(machineID), userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("maquina nao encontrada")
		}

		return err
	}

	if machine.MachineID != nil {
		return errors.New("apenas maquinas personalizadas podem ser excluidas")
	}

	deleted, err := s.userMachines.DeleteCustomUnusedByIDAndUserID(machine.ID, userID)
	if err != nil {
		return err
	}
	if !deleted {
		return errors.New("remova a maquina dos treinos e transfira ou exclua o historico antes de exclui-la")
	}

	return nil
}
