package dtos

type RequestPasswordResetType struct {
	Email string `json:"email" binding:"required,email"`
}
