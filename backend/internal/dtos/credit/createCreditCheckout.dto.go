package dtos

type CreateCreditCheckoutType struct {
	CreditQuantity int    `json:"creditQuantity" binding:"required,min=1"`
	DocumentNumber string `json:"documentNumber" binding:"required,min=11"`
}
