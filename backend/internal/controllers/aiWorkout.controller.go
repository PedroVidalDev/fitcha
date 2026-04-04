package controllers

import (
	dtos "fitcha/internal/dtos/aiWorkout"
	"fitcha/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AIWorkoutController struct {
	service *services.AIWorkoutService
}

func NewAIWorkoutController(service *services.AIWorkoutService) *AIWorkoutController {
	return &AIWorkoutController{service: service}
}

func (c *AIWorkoutController) Generate(ctx *gin.Context) {
	var input dtos.GenerateAIWorkoutRequest

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	response, err := c.service.Generate(userID, input)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}
