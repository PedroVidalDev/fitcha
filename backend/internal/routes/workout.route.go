package routes

import (
	"fitcha/internal/controllers"
	"fitcha/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterWorkoutRoutes(r *gin.Engine, controller *controllers.WorkoutController) {
	authenticated := r.Group("/me/workouts")
	authenticated.Use(middlewares.AuthMiddleware())
	authenticated.GET("", controller.List)
	authenticated.POST("", controller.Create)
	authenticated.PATCH("/:workoutId", controller.Update)
	authenticated.DELETE("/:workoutId", controller.Delete)
	authenticated.POST("/:workoutId/machines", controller.AddMachine)
	authenticated.DELETE("/:workoutId/machines/:machineId", controller.RemoveMachine)
}
