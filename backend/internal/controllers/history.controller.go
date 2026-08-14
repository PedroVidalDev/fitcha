package controllers

import (
	dtos "fitcha/internal/dtos/history"
	machineDtos "fitcha/internal/dtos/machine"
	paginationDtos "fitcha/internal/dtos/pagination"
	workoutDtos "fitcha/internal/dtos/workout"
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

func (c *HistoryController) ListByMachine(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	page, limit, err := getPagination(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entries, total, err := c.service.ListByMachine(
		userID,
		ctx.Param("machineId"),
		page,
		limit,
	)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, paginationDtos.NewPageResponse(
		dtos.FromHistoryEntryModels(entries),
		page,
		limit,
		total,
	))
}

func (c *HistoryController) GetMachineRecord(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	entry, err := c.service.GetMachineRecord(userID, ctx.Param("machineId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if entry == nil {
		ctx.JSON(http.StatusOK, gin.H{"recordEntry": nil})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"recordEntry": dtos.FromHistoryEntryModel(*entry),
	})
}

func (c *HistoryController) Delete(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.Delete(userID, ctx.Param("historyId")); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}

func (c *HistoryController) TransferMachineHistory(ctx *gin.Context) {
	var input dtos.TransferMachineHistoryType
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	result, err := c.service.TransferMachineHistory(userID, ctx.Param("machineId"), services.TransferMachineHistoryInput{
		TargetUserMachineID: input.TargetUserMachineID,
		TargetCatalogID:     input.TargetCatalogID,
		ReplaceInWorkouts:   input.ReplaceInWorkouts,
	})
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.TransferMachineHistoryResponseType{
		SourceMachineID:  result.SourceMachineID,
		TargetMachine:    machineDtos.FromMachineModel(result.TargetMachine),
		TransferredCount: result.TransferredCount,
		UpdatedWorkouts:  workoutDtos.FromWorkoutModels(result.UpdatedWorkouts),
	})
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
		sets := make([]services.CreateWorkoutSetInput, 0, len(result.Sets))
		for _, set := range result.Sets {
			sets = append(sets, services.CreateWorkoutSetInput{
				Weight:          set.Weight,
				Reps:            set.Reps,
				DurationSeconds: set.DurationSeconds,
			})
		}

		results = append(results, services.CreateWorkoutResultInput{
			MachineID:        result.MachineID,
			CatalogMachineID: result.CatalogMachineID,
			Sets:             sets,
		})
	}

	entries, err := c.service.CreateWorkout(userID, results)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, dtos.FromHistoryEntryModels(entries))
}
