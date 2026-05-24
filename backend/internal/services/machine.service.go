package services

import (
	"errors"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"strings"

	"gorm.io/gorm"
)

type UpdateMachineInput struct {
	Name        *string
	Description *string
	Photo       *string
	CategoryKey *string
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

	return s.userMachines.Update(machine)
}
