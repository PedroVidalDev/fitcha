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
	machineRepo := repositories.NewMachineRepository(db)
	dayRepo := repositories.NewDayRepository(db)
	historyRepo := repositories.NewHistoryRepository(db)

	aiWorkoutService := services.NewAIWorkoutService(planRepo)
	aiWorkoutController := controllers.NewAIWorkoutController(aiWorkoutService)

	mpClient, mpErr := mercadopago.NewClientFromEnv()

	planService := services.NewPlanService(planRepo, authRepo, mpClient, mpErr)
	planController := controllers.NewPlanController(planService)
	machineService := services.NewMachineService(machineRepo)
	machineController := controllers.NewMachineController(machineService)
	dayService := services.NewDayService(db, dayRepo)
	dayController := controllers.NewDayController(dayService)
	historyService := services.NewHistoryService(db, historyRepo)
	historyController := controllers.NewHistoryController(historyService)

	RegisterAuthRoutes(r, authController)
	RegisterPlanRoutes(r, planController)
	RegisterAIWorkoutRoutes(r, aiWorkoutController)
	RegisterMachineRoutes(r, machineController)
	RegisterDayRoutes(r, dayController)
	RegisterHistoryRoutes(r, historyController)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})
}
