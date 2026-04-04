package routes

import (
	"fitcha/internal/controllers"
	"fitcha/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func RegisterPlanRoutes(r *gin.Engine, controller *controllers.PlanController) {
	authenticated := r.Group("/me/plan")
	authenticated.Use(middlewares.AuthMiddleware())
	authenticated.GET("", controller.GetMyPlan)
	authenticated.POST("/checkout", controller.CreateCheckout)

	r.POST("/webhooks/mercado-pago", controller.MercadoPagoWebhook)
}
