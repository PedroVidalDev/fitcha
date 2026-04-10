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
	repo repositories.IMachineRepository
}

func NewMachineService(repo repositories.IMachineRepository) *MachineService {
	return &MachineService{repo: repo}
}

func (s *MachineService) ListByUserID(userID uint) ([]models.Machine, error) {
	return s.repo.FindByUserID(userID)
}

func (s *MachineService) Update(userID uint, machineID string, input UpdateMachineInput) (models.Machine, error) {
	machine, err := s.repo.FindByIDAndUserID(strings.TrimSpace(machineID), userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.Machine{}, errors.New("maquina nao encontrada")
		}

		return models.Machine{}, err
	}

	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return models.Machine{}, errors.New("informe o nome da maquina")
		}

		machine.Name = name
	}

	if input.Description != nil {
		machine.Description = strings.TrimSpace(*input.Description)
	}

	if input.Photo != nil {
		machine.Photo = strings.TrimSpace(*input.Photo)
	}

	if input.CategoryKey != nil {
		categoryKey := strings.TrimSpace(*input.CategoryKey)
		if !models.IsValidMachineCategoryKey(categoryKey) {
			return models.Machine{}, errors.New("categoria da maquina invalida")
		}

		machine.CategoryKey = categoryKey
	}

	return s.repo.Update(machine)
}
