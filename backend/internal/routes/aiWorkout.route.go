package routes

import (
	"fitcha/internal/controllers"
	"fitcha/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterAIWorkoutRoutes(r *gin.Engine, controller *controllers.AIWorkoutController) {
	authenticated := r.Group("/me/ai-workout")
	authenticated.Use(middlewares.AuthMiddleware())
	authenticated.POST("/generate", controller.Generate)
}
