package routes

import (
	"fitcha/internal/controllers"
	"fitcha/internal/jobs"
	"fitcha/internal/repositories"
	"fitcha/internal/services"
	"fitcha/pkg/mercadopago"
	"fitcha/pkg/queue"
	"os"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	queueClient := queue.NewClientFromEnv()
	emailJobs := jobs.NewEmailJobs(queueClient)

	appReleaseRepo := repositories.NewAppReleaseRepository(db)
	appReleaseService := services.NewAppReleaseService(appReleaseRepo)
	appReleaseController := controllers.NewAppReleaseController(
		appReleaseService,
		os.Getenv("APP_UPDATE_TOKEN"),
	)

	authRepo := repositories.NewUserRepository(db)
	verificationTokenRepo := repositories.NewEmailVerificationTokenRepository(db)
	passwordResetTokenRepo := repositories.NewPasswordResetTokenRepository(db)
	authService := services.NewAuthService(
		authRepo,
		verificationTokenRepo,
		passwordResetTokenRepo,
		emailJobs,
	)
	authController := controllers.NewAuthController(authService)

	paymentRepo := repositories.NewPaymentRepository(db)
	machineRepo := repositories.NewMachineRepository(db)
	userMachineRepo := repositories.NewUserMachineRepository(db)
	workoutRepo := repositories.NewWorkoutRepository(db)
	historyRepo := repositories.NewHistoryRepository(db)

	aiWorkoutService := services.NewAIWorkoutService(db, authRepo, machineRepo)
	aiWorkoutController := controllers.NewAIWorkoutController(aiWorkoutService)

	mpClient, mpErr := mercadopago.NewClientFromEnv()

	creditService := services.NewCreditService(db, paymentRepo, authRepo, mpClient, mpErr, emailJobs)
	creditController := controllers.NewCreditController(creditService)
	machineService := services.NewMachineService(userMachineRepo, machineRepo)
	machinePhotoStorage, err := services.NewMachinePhotoStorage(os.Getenv("MACHINE_PHOTO_DIR"))
	if err != nil {
		panic(err)
	}
	machineController := controllers.NewMachineController(machineService, machinePhotoStorage)
	workoutService := services.NewWorkoutService(db, workoutRepo)
	workoutController := controllers.NewWorkoutController(workoutService)
	historyService := services.NewHistoryService(db, historyRepo)
	historyController := controllers.NewHistoryController(historyService)

	RegisterAuthRoutes(r, authController)
	RegisterAppReleaseRoutes(r, appReleaseController)
	RegisterCreditRoutes(r, creditController)
	RegisterAIWorkoutRoutes(r, aiWorkoutController)
	RegisterMachineRoutes(r, machineController)
	RegisterWorkoutRoutes(r, workoutController)
	RegisterHistoryRoutes(r, historyController)
	uploads := r.Group("/uploads/machines")
	uploads.Use(func(ctx *gin.Context) {
		ctx.Header("Cache-Control", "public, max-age=31536000, immutable")
		ctx.Next()
	})
	uploads.Static("/", machinePhotoStorage.RootDir())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})
}
