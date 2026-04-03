package routes

import (
	"fitcha/internal/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(r *gin.Engine, controller *controllers.AuthController) {
	r.POST("/register", controller.Register)
	r.POST("/login", controller.Login)
}