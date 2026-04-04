package dtos

import "fitcha/internal/models"

type AuthResponseType struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}
