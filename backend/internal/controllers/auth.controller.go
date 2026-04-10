package controllers

import (
	dtos "fitcha/internal/dtos/user"
	"fitcha/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AuthController struct {
	service *services.AuthService
}

func authErrorResponse(err error) (int, gin.H) {
	if authErr, ok := services.AsAuthError(err); ok {
		status := http.StatusBadRequest

		switch authErr.Code {
		case services.AuthErrorInvalidCredentials:
			status = http.StatusUnauthorized
		case services.AuthErrorEmailAlreadyExists:
			status = http.StatusConflict
		case services.AuthErrorUserNotFound:
			status = http.StatusNotFound
		}

		return status, gin.H{
			"error": authErr.Message,
			"code":  authErr.Code,
		}
	}

	return http.StatusBadRequest, gin.H{"error": err.Error()}
}

func NewAuthController(s *services.AuthService) *AuthController {
	return &AuthController{service: s}
}

func (c *AuthController) Register(ctx *gin.Context) {
	var input dtos.CreateUserType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	authResponse, err := c.service.Register(input.Name, input.Email, input.Password)

	if err != nil {
		status, payload := authErrorResponse(err)
		ctx.JSON(status, payload)
		return
	}

	ctx.JSON(http.StatusCreated, authResponse)
}

func (c *AuthController) Login(ctx *gin.Context) {
	var input dtos.LoginType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	authResponse, err := c.service.Login(input.Email, input.Password)

	if err != nil {
		status, payload := authErrorResponse(err)
		ctx.JSON(status, payload)
		return
	}

	ctx.JSON(http.StatusOK, authResponse)
}

func (c *AuthController) ChangePassword(ctx *gin.Context) {
	var input dtos.ChangePasswordType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	err = c.service.ChangePassword(userID, input.CurrentPassword, input.NewPassword)
	if err != nil {
		status, payload := authErrorResponse(err)
		ctx.JSON(status, payload)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "senha atualizada com sucesso"})
}
