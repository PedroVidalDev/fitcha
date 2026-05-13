package routes

import (
	"fitcha/internal/controllers"
	"fitcha/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterCreditRoutes(r *gin.Engine, controller *controllers.CreditController) {
	authenticated := r.Group("/me/credits")
	authenticated.Use(middlewares.AuthMiddleware())
	authenticated.GET("", controller.GetMySummary)
	authenticated.POST("/checkout", controller.CreateCheckout)

	r.POST("/webhooks/mercado-pago", controller.MercadoPagoWebhook)
}
