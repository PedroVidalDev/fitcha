package routes

import (
	"fitcha/internal/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterAppReleaseRoutes(r *gin.Engine, controller *controllers.AppReleaseController) {
	r.GET("/app/release", controller.GetCurrent)
	r.PUT("/internal/app/release", controller.UpsertCurrent)
}
