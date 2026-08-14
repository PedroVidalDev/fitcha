package routes

import (
	"fitcha/internal/controllers"
	"fitcha/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterMachineRoutes(r *gin.Engine, controller *controllers.MachineController) {
	r.GET("/machines/catalog", controller.ListCatalog)

	authenticated := r.Group("/me/machines")
	authenticated.Use(middlewares.AuthMiddleware())
	authenticated.GET("", controller.List)
	authenticated.POST("", controller.Create)
	authenticated.PATCH("/:machineId", controller.Update)
	authenticated.DELETE("/:machineId", controller.Delete)
	authenticated.POST("/:machineId/photo", controller.UploadPhoto)
	authenticated.DELETE("/:machineId/photo", controller.DeletePhoto)
}
