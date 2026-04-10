package controllers

import (
	dtos "fitcha/internal/dtos/history"
	"fitcha/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type HistoryController struct {
	service *services.HistoryService
}

func NewHistoryController(service *services.HistoryService) *HistoryController {
	return &HistoryController{service: service}
}

func (c *HistoryController) List(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	entries, err := c.service.ListByUserID(userID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.FromHistoryEntryModels(entries))
}

func (c *HistoryController) CreateWorkout(ctx *gin.Context) {
	var input dtos.CreateWorkoutType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	results := make([]services.CreateWorkoutResultInput, 0, len(input.Results))
	for _, result := range input.Results {
		results = append(results, services.CreateWorkoutResultInput{
			MachineID: result.MachineID,
			Sets:      result.Sets,
		})
	}

	entries, err := c.service.CreateWorkout(userID, results)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, dtos.FromHistoryEntryModels(entries))
}
