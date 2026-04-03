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

func NewAuthController(s *services.AuthService) *AuthController {
	return &AuthController{service: s}
}

func (c *AuthController) Register(ctx *gin.Context) {
	var input dtos.CreateUserType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H {"error": err.Error()})
		return
	}

	user, err := c.service.Register(input.Name, input.Email, input.Password)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H {"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, user)
}

func (c *AuthController) Login(ctx *gin.Context) {
	var input dtos.LoginType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H {"error": err.Error()})
		return
	}

	token, err := c.service.Login(input.Email, input.Password)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H {"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, token)
}