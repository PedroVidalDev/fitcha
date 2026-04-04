package dtos

import "fitcha/internal/models"

type CreatePlanCheckoutType struct {
	DocumentNumber string `json:"documentNumber" binding:"required,min=11"`
}

type PlanCheckoutResponseType struct {
	Plan  models.Plan `json:"plan"`
	IsNew bool        `json:"isNew"`
}
