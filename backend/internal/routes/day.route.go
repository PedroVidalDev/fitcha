package routes

import (
	"fitcha/internal/controllers"
	"fitcha/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterDayRoutes(r *gin.Engine, controller *controllers.DayController) {
	authenticated := r.Group("/me/days")
	authenticated.Use(middlewares.AuthMiddleware())
	authenticated.GET("", controller.List)
	authenticated.POST("/:dayIndex/machines", controller.AddMachine)
	authenticated.DELETE("/:dayIndex/machines/:machineId", controller.RemoveMachine)
	authenticated.PUT("/week", controller.ReplaceWeek)
}
