package controllers

import (
	"crypto/subtle"
	dtos "fitcha/internal/dtos/appRelease"
	"fitcha/internal/services"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type AppReleaseController struct {
	service     *services.AppReleaseService
	updateToken string
}

func NewAppReleaseController(service *services.AppReleaseService, updateToken string) *AppReleaseController {
	return &AppReleaseController{
		service:     service,
		updateToken: updateToken,
	}
}

func (c *AppReleaseController) GetCurrent(ctx *gin.Context) {
	appRelease, err := c.service.GetCurrent()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if appRelease == nil {
		ctx.Status(http.StatusNoContent)
		return
	}

	ctx.JSON(http.StatusOK, dtos.FromAppReleaseModel(*appRelease))
}

func (c *AppReleaseController) UpsertCurrent(ctx *gin.Context) {
	if !c.isAuthorized(ctx.GetHeader("X-App-Update-Token")) {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "nao autorizado"})
		return
	}

	var input dtos.UpdateAppReleaseInput
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	appRelease, err := c.service.UpdateCurrent(services.UpdateAppReleaseInput{
		LatestVersion:  input.LatestVersion,
		MinimumVersion: input.MinimumVersion,
		ReleaseTag:     input.ReleaseTag,
		ReleaseURL:     input.ReleaseURL,
		ReleasedAt:     input.ReleasedAt,
	})
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.FromAppReleaseModel(appRelease))
}

func (c *AppReleaseController) isAuthorized(receivedToken string) bool {
	expectedToken := strings.TrimSpace(c.updateToken)
	if expectedToken == "" {
		return false
	}

	return subtle.ConstantTimeCompare([]byte(receivedToken), []byte(expectedToken)) == 1
}
