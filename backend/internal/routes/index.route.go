package routes

import (
	"fitcha/internal/controllers"
	"fitcha/internal/repositories"
	"fitcha/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	authRepo := repositories.NewUserRepository(db)
	authService := services.NewAuthService(authRepo)
	authController := controllers.NewAuthController(authService)

	RegisterAuthRoutes(r, authController)
}
