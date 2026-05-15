package routes

import (
	"fitcha/internal/controllers"
	"fitcha/internal/jobs"
	"fitcha/internal/repositories"
	"fitcha/internal/services"
	"fitcha/pkg/mercadopago"
	"fitcha/pkg/queue"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	queueClient := queue.NewClientFromEnv()
	emailJobs := jobs.NewEmailJobs(queueClient)

	authRepo := repositories.NewUserRepository(db)
	authService := services.NewAuthService(authRepo, emailJobs)
	authController := controllers.NewAuthController(authService)

	paymentRepo := repositories.NewPaymentRepository(db)
	machineRepo := repositories.NewMachineRepository(db)
	dayRepo := repositories.NewDayRepository(db)
	historyRepo := repositories.NewHistoryRepository(db)

	aiWorkoutService := services.NewAIWorkoutService(db, authRepo)
	aiWorkoutController := controllers.NewAIWorkoutController(aiWorkoutService)

	mpClient, mpErr := mercadopago.NewClientFromEnv()

	creditService := services.NewCreditService(db, paymentRepo, authRepo, mpClient, mpErr, emailJobs)
	creditController := controllers.NewCreditController(creditService)
	machineService := services.NewMachineService(machineRepo)
	machineController := controllers.NewMachineController(machineService)
	dayService := services.NewDayService(db, dayRepo)
	dayController := controllers.NewDayController(dayService)
	historyService := services.NewHistoryService(db, historyRepo)
	historyController := controllers.NewHistoryController(historyService)

	RegisterAuthRoutes(r, authController)
	RegisterCreditRoutes(r, creditController)
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
