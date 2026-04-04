package routes

import (
	"fitcha/internal/controllers"
	"fitcha/internal/repositories"
	"fitcha/internal/services"
	"fitcha/pkg/mercadopago"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	authRepo := repositories.NewUserRepository(db)
	authService := services.NewAuthService(authRepo)
	authController := controllers.NewAuthController(authService)

	planRepo := repositories.NewPlanRepository(db)

	aiWorkoutService := services.NewAIWorkoutService(planRepo)
	aiWorkoutController := controllers.NewAIWorkoutController(aiWorkoutService)

	mpClient, mpErr := mercadopago.NewClientFromEnv()

	planService := services.NewPlanService(planRepo, authRepo, mpClient, mpErr)
	planController := controllers.NewPlanController(planService)

	RegisterAuthRoutes(r, authController)
	RegisterPlanRoutes(r, planController)
	RegisterAIWorkoutRoutes(r, aiWorkoutController)
}
