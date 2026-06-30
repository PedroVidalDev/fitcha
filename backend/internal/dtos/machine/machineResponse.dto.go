package dtos

import "fitcha/internal/models"

type MachineResponseType struct {
	ID               string `json:"id"`
	CatalogMachineID string `json:"catalogMachineId,omitempty"`
	Name             string `json:"name"`
	Description      string `json:"description,omitempty"`
	Photo            string `json:"photo,omitempty"`
	CategoryKey      string `json:"categoryKey"`
	TrackingType     string `json:"trackingType"`
	RequiresWeight   bool   `json:"requiresWeight"`
}

type CatalogMachineResponseType struct {
	ID             string            `json:"id"`
	Slug           string            `json:"slug"`
	Name           string            `json:"name"`
	Description    string            `json:"description,omitempty"`
	Photo          string            `json:"photo,omitempty"`
	CategoryKey    string            `json:"categoryKey"`
	TrackingType   string            `json:"trackingType"`
	RequiresWeight bool              `json:"requiresWeight"`
	Aliases        models.StringList `json:"aliases"`
}

func FromMachineModel(machine models.UserMachine) MachineResponseType {
	name := machine.Name
	description := machine.Description
	photo := machine.Photo
	categoryKey := machine.CategoryKey
	trackingType := machine.EffectiveTrackingType()
	requiresWeight := machine.EffectiveRequiresWeight()
	catalogMachineID := ""

	if machine.Machine != nil {
		catalogMachineID = machine.Machine.ID
		if machine.Machine.Name != "" {
			name = machine.Machine.Name
		}
		if description == "" && machine.Machine.Description != "" {
			description = machine.Machine.Description
		}
		if machine.Machine.CategoryKey != "" {
			categoryKey = machine.Machine.CategoryKey
		}
		trackingType = machine.Machine.EffectiveTrackingType()
		requiresWeight = machine.Machine.EffectiveRequiresWeight()
		if photo == "" {
			photo = machine.Machine.Photo
		}
	}

	return MachineResponseType{
		ID:               machine.ID,
		CatalogMachineID: catalogMachineID,
		Name:             name,
		Description:      description,
		Photo:            photo,
		CategoryKey:      categoryKey,
		TrackingType:     trackingType,
		RequiresWeight:   requiresWeight,
	}
}

func FromMachineModels(machines []models.UserMachine) []MachineResponseType {
	response := make([]MachineResponseType, 0, len(machines))

	for _, machine := range machines {
		response = append(response, FromMachineModel(machine))
	}

	return response
}

func FromCatalogMachineModel(machine models.Machine) CatalogMachineResponseType {
	return CatalogMachineResponseType{
		ID:             machine.ID,
		Slug:           machine.Slug,
		Name:           machine.Name,
		Description:    machine.Description,
		Photo:          machine.Photo,
		CategoryKey:    machine.CategoryKey,
		TrackingType:   machine.EffectiveTrackingType(),
		RequiresWeight: machine.EffectiveRequiresWeight(),
		Aliases:        machine.Aliases,
	}
}

func FromCatalogMachineModels(machines []models.Machine) []CatalogMachineResponseType {
	response := make([]CatalogMachineResponseType, 0, len(machines))

	for _, machine := range machines {
		response = append(response, FromCatalogMachineModel(machine))
	}

	return response
}
