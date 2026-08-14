package routes

import (
	"fitcha/internal/controllers"
	"fitcha/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterHistoryRoutes(r *gin.Engine, controller *controllers.HistoryController) {
	authenticated := r.Group("/me/history")
	authenticated.Use(middlewares.AuthMiddleware())
	authenticated.GET("", controller.List)
	authenticated.POST("/workouts", controller.CreateWorkout)
	authenticated.DELETE("/:historyId", controller.Delete)
	authenticated.PATCH("/machines/:machineId/transfer", controller.TransferMachineHistory)

	machineHistory := r.Group("/me/machines")
	machineHistory.Use(middlewares.AuthMiddleware())
	machineHistory.GET("/:machineId/history", controller.ListByMachine)
	machineHistory.GET("/:machineId/history/record", controller.GetMachineRecord)
}
