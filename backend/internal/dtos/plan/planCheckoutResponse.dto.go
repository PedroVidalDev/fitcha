package dtos

import "fitcha/internal/models"

type PlanCheckoutResponseType struct {
	Plan  models.Plan `json:"plan"`
	IsNew bool        `json:"isNew"`
}
