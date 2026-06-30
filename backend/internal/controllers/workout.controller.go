package controllers

import (
	machineDtos "fitcha/internal/dtos/machine"
	dtos "fitcha/internal/dtos/workout"
	"fitcha/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type WorkoutController struct {
	service *services.WorkoutService
}

func NewWorkoutController(service *services.WorkoutService) *WorkoutController {
	return &WorkoutController{service: service}
}

func (c *WorkoutController) List(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	workouts, err := c.service.ListByUserID(userID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.FromWorkoutModels(workouts))
}

func (c *WorkoutController) Create(ctx *gin.Context) {
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

	workout, err := c.service.Create(userID, services.CreateWorkoutInput{
		Title:       input.Title,
		Description: input.Description,
	})
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, dtos.FromWorkoutModel(workout))
}

func (c *WorkoutController) Update(ctx *gin.Context) {
	var input dtos.UpdateWorkoutType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	workoutID, err := getUintParam(ctx, "workoutId")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "treino invalido"})
		return
	}

	workout, err := c.service.Update(userID, workoutID, services.UpdateWorkoutInput{
		Title:       input.Title,
		Description: input.Description,
	})
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.FromWorkoutModel(workout))
}

func (c *WorkoutController) Delete(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	workoutID, err := getUintParam(ctx, "workoutId")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "treino invalido"})
		return
	}

	if err := c.service.Delete(userID, workoutID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}

func (c *WorkoutController) AddMachine(ctx *gin.Context) {
	var input dtos.AddWorkoutMachineType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	workoutID, err := getUintParam(ctx, "workoutId")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "treino invalido"})
		return
	}

	workout, machine, err := c.service.AddMachine(userID, workoutID, services.CreateWorkoutMachineInput{
		CatalogMachineID: input.CatalogMachineID,
		Name:             input.Name,
		Description:      input.Description,
		Photo:            input.Photo,
		CategoryKey:      input.CategoryKey,
		TrackingType:     input.TrackingType,
		RequiresWeight:   input.RequiresWeight,
	})
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, dtos.AddWorkoutMachineResponseType{
		Workout: dtos.FromWorkoutModel(workout),
		Machine: machineDtos.FromMachineModel(machine),
	})
}

func (c *WorkoutController) RemoveMachine(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	workoutID, err := getUintParam(ctx, "workoutId")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "treino invalido"})
		return
	}

	workout, removedMachine, err := c.service.RemoveMachine(userID, workoutID, ctx.Param("machineId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.RemoveWorkoutMachineResponseType{
		Workout:        dtos.FromWorkoutModel(workout),
		RemovedMachine: removedMachine,
	})
}
