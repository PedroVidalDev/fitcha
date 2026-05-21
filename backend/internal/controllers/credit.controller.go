package controllers

import (
	dtos "fitcha/internal/dtos/credit"
	"fitcha/internal/services"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type CreditController struct {
	service *services.CreditService
}

func NewCreditController(s *services.CreditService) *CreditController {
	return &CreditController{service: s}
}

func (c *CreditController) CreateCheckout(ctx *gin.Context) {
	var input dtos.CreateCreditCheckoutType

	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	payment, credits, isNew, err := c.service.CreateCheckout(userID, input.CreditQuantity, input.DocumentNumber)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, dtos.CreditCheckoutResponseType{
		Payment: payment,
		Credits: credits,
		IsNew:   isNew,
	})
}

func (c *CreditController) GetMySummary(ctx *gin.Context) {
	userID, err := getAuthenticatedUserID(ctx)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	payment, credits, err := c.service.GetMySummary(userID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, dtos.CreditSummaryResponseType{
		Payment: payment,
		Credits: credits,
	})
}

func (c *CreditController) MercadoPagoWebhook(ctx *gin.Context) {
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
