package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"fitcha/pkg/mercadopago"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

type PlanService struct {
	plans       repositories.IPlanRepository
	users       repositories.IUserRepository
	mp          *mercadopago.Client
	configError error
}

func NewPlanService(planRepo repositories.IPlanRepository, userRepo repositories.IUserRepository, mpClient *mercadopago.Client, configError error) *PlanService {
	return &PlanService{
		plans:       planRepo,
		users:       userRepo,
		mp:          mpClient,
		configError: configError,
	}
}

func (s *PlanService) CreateCheckout(userID uint, documentNumber string) (models.Plan, bool, error) {
	if err := s.requireMercadoPago(); err != nil {
		return models.Plan{}, false, err
	}

	now := time.Now()

	if _, err := s.plans.FindActiveByUserID(userID, now); err == nil {
		return models.Plan{}, false, errors.New("seu plano ja esta ativo no momento")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return models.Plan{}, false, err
	}

	if pendingPlan, err := s.plans.FindReusablePendingByUserID(userID, now); err == nil {
		return pendingPlan, false, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return models.Plan{}, false, err
	}

	user, err := s.users.FindByID(userID)
	if err != nil {
		return models.Plan{}, false, errors.New("usuario nao encontrado")
	}

	documentDigits := onlyDigits(documentNumber)
	if len(documentDigits) != 11 {
		return models.Plan{}, false, errors.New("informe um CPF valido com 11 digitos")
	}

	externalReference := fmt.Sprintf("plan-%d-%d", userID, now.UnixNano())
	idempotencyKey := fmt.Sprintf("pix-%d-%d", userID, now.UnixNano())
	paymentExpiresAt := now.Add(time.Duration(getIntEnv("PLAN_PIX_EXPIRATION_MINUTES", 30)) * time.Minute)

	var payload mercadopago.CreatePixPaymentRequest
	payload.TransactionAmount = float64(getIntEnv("PLAN_MONTHLY_PRICE_CENTS", 1990)) / 100
	payload.Description = getPlanTitle()
	payload.PaymentMethodID = "pix"
	payload.ExternalReference = externalReference
	payload.NotificationURL = strings.TrimSpace(os.Getenv("MERCADO_PAGO_WEBHOOK_URL"))
	payload.DateOfExpiration = formatMercadoPagoTimestamp(paymentExpiresAt)
	payload.Payer.Email = user.Email
	payload.Payer.FirstName, payload.Payer.LastName = splitName(user.Name)
	payload.Payer.Identification.Type = "CPF"
	payload.Payer.Identification.Number = documentDigits

	mpPayment, err := s.mp.CreatePixPayment(payload, idempotencyKey)
	if err != nil {
		return models.Plan{}, false, err
	}

	plan := models.Plan{
		UserID:                 userID,
		Provider:               "mercado_pago",
		Status:                 string(models.PlanStatusPending),
		ExternalReference:      externalReference,
		ProviderPaymentID:      strconv.FormatInt(mpPayment.ID, 10),
		TransactionAmountCents: int64(mpPayment.TransactionAmount * 100),
		Currency:               "BRL",
		Title:                  getPlanTitle(),
		Description:            "Acesso ao modo AI do Fitcha por 1 mes apos a aprovacao do pagamento.",
		PayerDocument:          documentDigits,
		QRCode:                 mpPayment.PointOfInteraction.TransactionData.QRCode,
		QRCodeBase64:           mpPayment.PointOfInteraction.TransactionData.QRCodeBase64,
		TicketURL:              mpPayment.PointOfInteraction.TransactionData.TicketURL,
		PaymentExpiresAt:       parseTimePointer(mpPayment.DateOfExpiration, &paymentExpiresAt),
	}

	createdPlan, err := s.plans.Create(plan)
	if err != nil {
		return models.Plan{}, false, err
	}

	return createdPlan, true, nil
}

func (s *PlanService) GetMyPlan(userID uint) (*models.Plan, bool, error) {
	plan, err := s.plans.FindLatestByUserID(userID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		if _, updateErr := s.users.SetPlanActive(userID, false); updateErr != nil {
			return nil, false, updateErr
		}

		return nil, false, nil
	}
	if err != nil {
		return nil, false, err
	}

	refreshedPlan, err := s.refreshPlanStatus(plan)
	if err != nil {
		return nil, false, err
	}

	return &refreshedPlan, isPlanActive(refreshedPlan), nil
}

func (s *PlanService) ProcessMercadoPagoWebhook(resourceID string) error {
	if err := s.requireMercadoPago(); err != nil {
		return err
	}

	if resourceID == "" {
		return errors.New("resource de pagamento nao informado")
	}

	plan, err := s.plans.FindByProviderPaymentID(resourceID)
	if err != nil {
		return err
	}

	_, err = s.refreshPlanStatus(plan)
	return err
}

func (s *PlanService) ValidateWebhookSignature(signatureHeader, requestID, dataID string) bool {
	secret := strings.TrimSpace(os.Getenv("MERCADO_PAGO_WEBHOOK_SECRET"))
	if secret == "" {
		return false
	}

	ts, hash := parseSignatureHeader(signatureHeader)
	if ts == "" || hash == "" || dataID == "" {
		return false
	}

	manifest := fmt.Sprintf("id:%s;request-id:%s;ts:%s;", dataID, requestID, ts)
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(manifest))
	expected := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(strings.ToLower(hash)), []byte(strings.ToLower(expected)))
}

func (s *PlanService) refreshPlanStatus(plan models.Plan) (models.Plan, error) {
	now := time.Now()

	if plan.Status == string(models.PlanStatusApproved) && plan.AccessExpiresAt != nil && plan.AccessExpiresAt.Before(now) {
		plan.Status = string(models.PlanStatusExpired)
		plan, err := s.plans.Update(plan)
		if err != nil {
			return models.Plan{}, err
		}

		if _, err := s.users.SetPlanActive(plan.UserID, false); err != nil {
			return models.Plan{}, err
		}

		return plan, nil
	}

	if plan.Status != string(models.PlanStatusPending) || plan.ProviderPaymentID == "" {
		if _, err := s.users.SetPlanActive(plan.UserID, isPlanActive(plan)); err != nil {
			return models.Plan{}, err
		}

		return plan, nil
	}

	if err := s.requireMercadoPago(); err != nil {
		return plan, nil
	}

	mpPayment, err := s.mp.GetPayment(plan.ProviderPaymentID)
	if err != nil {
		return models.Plan{}, err
	}

	plan.Status = mapMercadoPagoStatus(mpPayment.Status, plan.PaymentExpiresAt, now)
	plan.ProviderPaymentID = strconv.FormatInt(mpPayment.ID, 10)
	plan.QRCode = mpPayment.PointOfInteraction.TransactionData.QRCode
	plan.QRCodeBase64 = mpPayment.PointOfInteraction.TransactionData.QRCodeBase64
	plan.TicketURL = mpPayment.PointOfInteraction.TransactionData.TicketURL
	plan.PaymentExpiresAt = parseTimePointer(mpPayment.DateOfExpiration, plan.PaymentExpiresAt)

	if mpPayment.Status == "approved" {
		paidAt := parseTimePointer(mpPayment.DateApproved, &now)
		accessStartsAt := *paidAt
		accessExpiresAt := accessStartsAt.AddDate(0, 1, 0)

		plan.PaidAt = paidAt
		plan.AccessStartsAt = &accessStartsAt
		plan.AccessExpiresAt = &accessExpiresAt
	}

	lastWebhookAt := now
	plan.LastWebhookAt = &lastWebhookAt

	updatedPlan, err := s.plans.Update(plan)
	if err != nil {
		return models.Plan{}, err
	}

	if _, err := s.users.SetPlanActive(plan.UserID, isPlanActive(updatedPlan)); err != nil {
		return models.Plan{}, err
	}

	return updatedPlan, nil
}

func getPlanTitle() string {
	title := strings.TrimSpace(os.Getenv("PLAN_MONTHLY_TITLE"))
	if title != "" {
		return title
	}

	return "Fitcha AI - Plano mensal"
}

func getIntEnv(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}

	return parsed
}

func splitName(fullName string) (string, string) {
	parts := strings.Fields(strings.TrimSpace(fullName))
	if len(parts) == 0 {
		return "Usuario", "Fitcha"
	}
	if len(parts) == 1 {
		return parts[0], "Fitcha"
	}

	return parts[0], strings.Join(parts[1:], " ")
}

func onlyDigits(value string) string {
	var builder strings.Builder

	for _, char := range value {
		if char >= '0' && char <= '9' {
			builder.WriteRune(char)
		}
	}

	return builder.String()
}

func parseTimePointer(raw string, fallback *time.Time) *time.Time {
	if raw == "" {
		return fallback
	}

	parsed, err := time.Parse(time.RFC3339Nano, raw)
	if err != nil {
		return fallback
	}

	return &parsed
}

func formatMercadoPagoTimestamp(value time.Time) string {
	return value.Format("2006-01-02T15:04:05.000-07:00")
}

func mapMercadoPagoStatus(status string, paymentExpiresAt *time.Time, now time.Time) string {
	switch status {
	case "approved":
		return string(models.PlanStatusApproved)
	case "rejected", "cancelled":
		return string(models.PlanStatusFailed)
	case "pending", "in_process":
		if paymentExpiresAt != nil && paymentExpiresAt.Before(now) {
			return string(models.PlanStatusExpired)
		}
		return string(models.PlanStatusPending)
	default:
		return string(models.PlanStatusPending)
	}
}

func isPlanActive(plan models.Plan) bool {
	return plan.Status == string(models.PlanStatusApproved) &&
		plan.AccessExpiresAt != nil &&
		plan.AccessExpiresAt.After(time.Now())
}

func parseSignatureHeader(header string) (string, string) {
	parts := strings.Split(header, ",")
	var ts string
	var v1 string

	for _, part := range parts {
		item := strings.TrimSpace(part)
		switch {
		case strings.HasPrefix(item, "ts="):
			ts = strings.TrimPrefix(item, "ts=")
		case strings.HasPrefix(item, "v1="):
			v1 = strings.TrimPrefix(item, "v1=")
		}
	}

	return ts, v1
}

func (s *PlanService) requireMercadoPago() error {
	if s.configError != nil {
		return s.configError
	}

	if s.mp == nil {
		return errors.New("mercado pago nao configurado")
	}

	return nil
}
