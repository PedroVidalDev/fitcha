package controllers

import (
	dtos "fitcha/internal/dtos/day"
	machineDtos "fitcha/internal/dtos/machine"
	"fitcha/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DayController struct {
	service *services.DayService
}

func NewDayController(service *services.DayService) *DayController {
	return &DayController{service: service}
}

func (c *DayController) List(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	days, err := c.service.ListByUserID(userID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.FromDayModels(days))
}

func (c *DayController) AddMachine(ctx *gin.Context) {
	var input dtos.AddDayMachineType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	dayIndex, err := getIntParam(ctx, "dayIndex")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "dia da semana invalido"})
		return
	}

	day, machine, err := c.service.AddMachine(userID, dayIndex, services.CreateDayMachineInput{
		Name:        input.Name,
		Description: input.Description,
		Photo:       input.Photo,
		CategoryKey: input.CategoryKey,
	})
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, dtos.AddDayMachineResponseType{
		Day:     dtos.FromDayModel(day),
		Machine: machineDtos.FromMachineModel(machine),
	})
}

func (c *DayController) RemoveMachine(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	dayIndex, err := getIntParam(ctx, "dayIndex")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "dia da semana invalido"})
		return
	}

	day, removedMachine, err := c.service.RemoveMachine(userID, dayIndex, ctx.Param("machineId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.RemoveDayMachineResponseType{
		Day:            dtos.FromDayModel(day),
		RemovedMachine: removedMachine,
	})
}

func (c *DayController) ReplaceWeek(ctx *gin.Context) {
	var input dtos.ReplaceWeekType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	inputDays := make([]services.ReplaceWeekDayInput, 0, len(input.Days))
	for _, inputDay := range input.Days {
		machines := make([]services.CreateDayMachineInput, 0, len(inputDay.Machines))
		for _, machine := range inputDay.Machines {
			machines = append(machines, services.CreateDayMachineInput{
				Name:        machine.Name,
				Description: machine.Description,
				Photo:       machine.Photo,
				CategoryKey: machine.CategoryKey,
			})
		}

		inputDays = append(inputDays, services.ReplaceWeekDayInput{
			DayIndex: inputDay.DayIndex,
			Machines: machines,
		})
	}

	days, machines, err := c.service.ReplaceWeek(userID, inputDays)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.ReplaceWeekResponseType{
		Days:     dtos.FromDayModels(days),
		Machines: machineDtos.FromMachineModels(machines),
	})
}
