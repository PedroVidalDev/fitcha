package controllers

import (
	dtos "fitcha/internal/dtos/machine"
	"fitcha/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type MachineController struct {
	service *services.MachineService
}

func NewMachineController(service *services.MachineService) *MachineController {
	return &MachineController{service: service}
}

func (c *MachineController) List(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	machines, err := c.service.ListByUserID(userID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.FromMachineModels(machines))
}

func (c *MachineController) Update(ctx *gin.Context) {
	var input dtos.UpdateMachineType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	machine, err := c.service.Update(userID, ctx.Param("machineId"), services.UpdateMachineInput{
		Name:        input.Name,
		Description: input.Description,
		Photo:       input.Photo,
		CategoryKey: input.CategoryKey,
	})
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.FromMachineModel(machine))
}
