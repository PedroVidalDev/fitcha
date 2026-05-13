package dtos

import "fitcha/internal/models"

type CreditSummaryResponseType struct {
	Payment *models.Payment `json:"payment"`
	Credits int             `json:"credits"`
}
