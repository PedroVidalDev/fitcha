package dtos

type CreatePlanCheckoutType struct {
	DocumentNumber string `json:"documentNumber" binding:"required,min=11"`
}
