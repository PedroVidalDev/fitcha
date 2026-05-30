package routes

import (
	"fitcha/internal/controllers"
	"fitcha/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(r *gin.Engine, controller *controllers.AuthController) {
	r.POST("/register", controller.Register)
	r.POST("/login", controller.Login)
	r.POST("/verify-email/resend", controller.ResendVerificationEmail)
	r.GET("/verify-email", controller.VerifyEmail)
	r.POST("/password/forgot", controller.RequestPasswordReset)
	r.POST("/password/reset", controller.ResetPassword)
	r.GET("/reset-password", controller.ResetPasswordPage)

	authenticated := r.Group("/me")
	authenticated.Use(middlewares.AuthMiddleware())
	authenticated.PATCH("/password", controller.ChangePassword)
}
