package controllers

import (
	dtos "fitcha/internal/dtos/aiWorkout"
	"fitcha/internal/middlewares"
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
		middlewares.AbortWithError(ctx, http.StatusBadRequest, err)
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		middlewares.AbortWithError(ctx, http.StatusUnauthorized, err)
		return
	}

	response, err := c.service.Generate(ctx.Request.Context(), userID, input)
	if err != nil {
		middlewares.AbortWithError(ctx, http.StatusBadRequest, err)
		return
	}

	ctx.JSON(http.StatusOK, response)
}
