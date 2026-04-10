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
}
