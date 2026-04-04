package routes

import (
	"fitcha/internal/controllers"
	"fitcha/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(r *gin.Engine, controller *controllers.AuthController) {
	r.POST("/register", controller.Register)
	r.POST("/login", controller.Login)

	authenticated := r.Group("/me")
	authenticated.Use(middlewares.AuthMiddleware())
	authenticated.PATCH("/password", controller.ChangePassword)
	authenticated.PATCH("/plan", controller.UpdatePlanActive)
}
