package controllers

import (
	dtos "fitcha/internal/dtos/machine"
	paginationDtos "fitcha/internal/dtos/pagination"
	"fitcha/internal/services"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

type MachineController struct {
	service      *services.MachineService
	photoStorage *services.MachinePhotoStorage
}

func NewMachineController(service *services.MachineService, photoStorage *services.MachinePhotoStorage) *MachineController {
	return &MachineController{service: service, photoStorage: photoStorage}
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

func (c *MachineController) ListCatalog(ctx *gin.Context) {
	machines, err := c.service.ListCatalog()
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.FromCatalogMachineModels(machines))
}

func (c *MachineController) Search(ctx *gin.Context) {
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
	requiresWeight, err := getOptionalBoolQuery(ctx, "requiresWeight")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	machines, total, err := c.service.SearchByUserID(userID, services.MachineSearchInput{
		Source:         ctx.Query("source"),
		Query:          ctx.Query("q"),
		CategoryKey:    ctx.Query("categoryKey"),
		TrackingType:   ctx.Query("trackingType"),
		RequiresWeight: requiresWeight,
		ExcludeIDs:     getStringListQuery(ctx, "excludeIds"),
		Page:           page,
		Limit:          limit,
	})
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, paginationDtos.NewPageResponse(
		dtos.FromMachineModels(machines),
		page,
		limit,
		total,
	))
}

func (c *MachineController) SearchCatalog(ctx *gin.Context) {
	page, limit, err := getPagination(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	requiresWeight, err := getOptionalBoolQuery(ctx, "requiresWeight")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	machines, total, err := c.service.SearchCatalog(services.MachineSearchInput{
		Query:             ctx.Query("q"),
		CategoryKey:       ctx.Query("categoryKey"),
		SubstitutionGroup: ctx.Query("substitutionGroup"),
		TrackingType:      ctx.Query("trackingType"),
		RequiresWeight:    requiresWeight,
		ExcludeIDs:        getStringListQuery(ctx, "excludeIds"),
		Page:              page,
		Limit:             limit,
	})
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, paginationDtos.NewPageResponse(
		dtos.FromCatalogMachineModels(machines),
		page,
		limit,
		total,
	))
}

func (c *MachineController) Get(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	machine, err := c.service.Get(userID, ctx.Param("machineId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.FromMachineModel(machine))
}

func (c *MachineController) Create(ctx *gin.Context) {
	var input dtos.CreateMachineType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	machine, err := c.service.Create(userID, services.CreateMachineInput{
		Name:           input.Name,
		Description:    input.Description,
		Photo:          input.Photo,
		CategoryKey:    input.CategoryKey,
		TrackingType:   input.TrackingType,
		RequiresWeight: input.RequiresWeight,
	})
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, dtos.FromMachineModel(machine))
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
		Name:           input.Name,
		Description:    input.Description,
		Photo:          input.Photo,
		CategoryKey:    input.CategoryKey,
		TrackingType:   input.TrackingType,
		RequiresWeight: input.RequiresWeight,
	})
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.FromMachineModel(machine))
}

func (c *MachineController) Delete(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	machine, err := c.service.Get(userID, ctx.Param("machineId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := c.service.Delete(userID, machine.ID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.photoStorage.DeleteByURL(machine.ID, machine.Photo)
	ctx.Status(http.StatusNoContent)
}

func (c *MachineController) UploadPhoto(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	currentMachine, err := c.service.Get(userID, ctx.Param("machineId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.Request.Body = http.MaxBytesReader(ctx.Writer, ctx.Request.Body, 6<<20)
	fileHeader, err := ctx.FormFile("photo")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "foto nao informada"})
		return
	}

	relativeURL, err := c.photoStorage.Save(currentMachine.ID, fileHeader)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	photoURL := machinePhotoPublicURL(ctx, relativeURL)
	updatedMachine, err := c.service.Update(userID, currentMachine.ID, services.UpdateMachineInput{
		Photo: &photoURL,
	})
	if err != nil {
		c.photoStorage.DeleteByURL(currentMachine.ID, relativeURL)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.photoStorage.DeleteByURL(currentMachine.ID, currentMachine.Photo)
	ctx.JSON(http.StatusOK, dtos.FromMachineModel(updatedMachine))
}

func (c *MachineController) DeletePhoto(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	currentMachine, err := c.service.Get(userID, ctx.Param("machineId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	emptyPhoto := ""
	updatedMachine, err := c.service.Update(userID, currentMachine.ID, services.UpdateMachineInput{
		Photo: &emptyPhoto,
	})
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.photoStorage.DeleteByURL(currentMachine.ID, currentMachine.Photo)
	ctx.JSON(http.StatusOK, dtos.FromMachineModel(updatedMachine))
}

func machinePhotoPublicURL(ctx *gin.Context, relativeURL string) string {
	if baseURL := strings.TrimRight(strings.TrimSpace(os.Getenv("API_BASE_URL")), "/"); baseURL != "" {
		return baseURL + relativeURL
	}

	scheme := strings.TrimSpace(ctx.GetHeader("X-Forwarded-Proto"))
	if scheme == "" {
		if ctx.Request.TLS != nil {
			scheme = "https"
		} else {
			scheme = "http"
		}
	}

	host := strings.TrimSpace(ctx.GetHeader("X-Forwarded-Host"))
	if host == "" {
		host = ctx.Request.Host
	}

	return scheme + "://" + host + relativeURL
}
