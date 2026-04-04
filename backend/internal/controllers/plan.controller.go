package controllers

import (
	dtos "fitcha/internal/dtos/plan"
	"fitcha/internal/services"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type PlanController struct {
	service *services.PlanService
}

func NewPlanController(s *services.PlanService) *PlanController {
	return &PlanController{service: s}
}

func (c *PlanController) CreateCheckout(ctx *gin.Context) {
	var input dtos.CreatePlanCheckoutType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	plan, isNew, err := c.service.CreateCheckout(userID, input.DocumentNumber)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, dtos.PlanCheckoutResponseType{
		Plan:  plan,
		IsNew: isNew,
	})
}

func (c *PlanController) GetMyPlan(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	plan, planActive, err := c.service.GetMyPlan(userID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.PlanStatusResponseType{
		Plan:       plan,
		PlanActive: planActive,
	})
}

func (c *PlanController) MercadoPagoWebhook(ctx *gin.Context) {
	resourceID := strings.TrimSpace(ctx.Query("data.id"))
	requestID := strings.TrimSpace(ctx.GetHeader("X-Request-Id"))
	signature := strings.TrimSpace(ctx.GetHeader("X-Signature"))

	var input dtos.MercadoPagoWebhookType
	if err := ctx.ShouldBindJSON(&input); err == nil {
		if resourceID == "" {
			resourceID = strings.TrimSpace(input.Data.ID)
		}

		if input.Type != "" && input.Type != "payment" {
			ctx.JSON(http.StatusOK, gin.H{"received": true})
			return
		}
	}

	if !c.service.ValidateWebhookSignature(signature, requestID, resourceID) {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "assinatura de webhook invalida"})
		return
	}

	if err := c.service.ProcessMercadoPagoWebhook(resourceID); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"received": true})
}
