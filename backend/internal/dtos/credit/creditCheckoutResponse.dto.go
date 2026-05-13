package dtos

import "fitcha/internal/models"

type CreditCheckoutResponseType struct {
	Payment models.Payment `json:"payment"`
	Credits int            `json:"credits"`
	IsNew   bool           `json:"isNew"`
}
