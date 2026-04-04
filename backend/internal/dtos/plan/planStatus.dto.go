package dtos

import "fitcha/internal/models"

type PlanStatusResponseType struct {
	Plan       *models.Plan `json:"plan"`
	PlanActive bool         `json:"planActive"`
}
