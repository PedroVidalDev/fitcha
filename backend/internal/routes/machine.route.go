package routes

import (
	"fitcha/internal/controllers"
	"fitcha/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterMachineRoutes(r *gin.Engine, controller *controllers.MachineController) {
	r.GET("/machines/catalog", controller.ListCatalog)
	r.GET("/machines/catalog/search", controller.SearchCatalog)

	authenticated := r.Group("/me/machines")
	authenticated.Use(middlewares.AuthMiddleware())
	authenticated.GET("", controller.List)
	authenticated.GET("/search", controller.Search)
	authenticated.POST("", controller.Create)
	authenticated.GET("/:machineId", controller.Get)
	authenticated.PATCH("/:machineId", controller.Update)
	authenticated.DELETE("/:machineId", controller.Delete)
	authenticated.POST("/:machineId/photo", controller.UploadPhoto)
	authenticated.DELETE("/:machineId/photo", controller.DeletePhoto)
}
