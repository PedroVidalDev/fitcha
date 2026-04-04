package controllers

import (
	"errors"
	dtos "fitcha/internal/dtos/user"
	"fitcha/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AuthController struct {
	service *services.AuthService
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
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
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
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "senha atualizada com sucesso"})
}

func (c *AuthController) UpdatePlanActive(ctx *gin.Context) {
	var input dtos.UpdatePlanType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	updatedUser, err := c.service.UpdatePlanActive(userID, *input.PlanActive)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"user": updatedUser})
}

func getAuthenticatedUserID(ctx *gin.Context) (uint, error) {
	value, exists := ctx.Get("userID")
	if !exists {
		return 0, errors.New("usuario nao autenticado")
	}

	switch userID := value.(type) {
	case uint:
		return userID, nil
	case int:
		return uint(userID), nil
	case int64:
		return uint(userID), nil
	case float64:
		return uint(userID), nil
	case string:
		parsed, err := strconv.ParseUint(userID, 10, 64)
		if err != nil {
			return 0, err
		}

		return uint(parsed), nil
	default:
		return 0, errors.New("usuario nao autenticado")
	}
}
