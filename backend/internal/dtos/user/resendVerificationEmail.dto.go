package dtos

type ResendVerificationEmailType struct {
	Email string `json:"email" binding:"required"`
}
