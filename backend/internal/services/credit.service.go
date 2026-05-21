package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fitcha/internal/jobs"
	"fitcha/internal/models"
	"fitcha/internal/repositories"
	"fitcha/pkg/mercadopago"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

type CreditService struct {
	db          *gorm.DB
	payments    repositories.IPaymentRepository
	users       repositories.IUserRepository
	mp          *mercadopago.Client
	configError error
	emails      jobs.EmailJobEnqueuer
}

func NewCreditService(db *gorm.DB, paymentRepo repositories.IPaymentRepository, userRepo repositories.IUserRepository, mpClient *mercadopago.Client, configError error, emailJobs jobs.EmailJobEnqueuer) *CreditService {
	return &CreditService{
		db:          db,
		payments:    paymentRepo,
		users:       userRepo,
		mp:          mpClient,
		configError: configError,
		emails:      emailJobs,
	}
}

func (s *CreditService) CreateCheckout(userID uint, creditQuantity int, documentNumber string) (models.Payment, int, bool, error) {
	if err := s.requireMercadoPago(); err != nil {
		return models.Payment{}, 0, false, err
	}

	if creditQuantity < 1 {
		return models.Payment{}, 0, false, errors.New("informe ao menos 1 credito para compra")
	}

	user, err := s.users.FindByID(userID)
	if err != nil {
		return models.Payment{}, 0, false, errors.New("usuario nao encontrado")
	}

	documentDigits := onlyDigits(documentNumber)
	if len(documentDigits) != 11 {
		return models.Payment{}, user.Credits, false, errors.New("informe um CPF valido com 11 digitos")
	}

	now := time.Now()

	if pendingPayment, err := s.payments.FindReusablePendingByUserID(userID, creditQuantity, documentDigits, now); err == nil {
		return pendingPayment, user.Credits, false, nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return models.Payment{}, user.Credits, false, err
	}

	unitAmountCents := getIntEnv("CREDIT_UNIT_PRICE_CENTS", 400)
	if unitAmountCents <= 0 {
		unitAmountCents = 400
	}

	totalAmountCents := unitAmountCents * creditQuantity
	externalReference := fmt.Sprintf("credits-%d-%d", userID, now.UnixNano())
	idempotencyKey := fmt.Sprintf("credits-pix-%d-%d", userID, now.UnixNano())
	paymentExpiresAt := now.Add(time.Duration(getIntEnv("CREDIT_PIX_EXPIRATION_MINUTES", 30)) * time.Minute)

	var payload mercadopago.CreatePixPaymentRequest
	payload.TransactionAmount = float64(totalAmountCents) / 100
	payload.Description = buildCreditPaymentTitle(creditQuantity)
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
		return models.Payment{}, user.Credits, false, err
	}

	payment := models.Payment{
		UserID:                 userID,
		Provider:               "mercado_pago",
		Status:                 string(models.PaymentStatusPending),
		ExternalReference:      externalReference,
		ProviderPaymentID:      strconv.FormatInt(mpPayment.ID, 10),
		CreditQuantity:         creditQuantity,
		UnitAmountCents:        int64(unitAmountCents),
		TransactionAmountCents: int64(totalAmountCents),
		Currency:               "BRL",
		Title:                  buildCreditPaymentTitle(creditQuantity),
		Description:            buildCreditPaymentDescription(creditQuantity),
		PayerDocument:          documentDigits,
		QRCode:                 mpPayment.PointOfInteraction.TransactionData.QRCode,
		QRCodeBase64:           mpPayment.PointOfInteraction.TransactionData.QRCodeBase64,
		TicketURL:              mpPayment.PointOfInteraction.TransactionData.TicketURL,
		PaymentExpiresAt:       parseTimePointer(mpPayment.DateOfExpiration, &paymentExpiresAt),
	}

	createdPayment, err := s.payments.Create(payment)
	if err != nil {
		return models.Payment{}, user.Credits, false, err
	}

	return createdPayment, user.Credits, true, nil
}

func (s *CreditService) GetMySummary(userID uint) (*models.Payment, int, error) {
	user, err := s.users.FindByID(userID)
	if err != nil {
		return nil, 0, errors.New("usuario nao encontrado")
	}

	payment, err := s.payments.FindLatestByUserID(userID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, user.Credits, nil
	}
	if err != nil {
		return nil, 0, err
	}

	refreshedPayment, updatedUser, err := s.refreshPaymentStatus(payment)
	if err != nil {
		return nil, 0, err
	}

	return &refreshedPayment, updatedUser.Credits, nil
}

func (s *CreditService) ProcessMercadoPagoWebhook(resourceID string) error {
	if err := s.requireMercadoPago(); err != nil {
		return err
	}

	if resourceID == "" {
		return errors.New("resource de pagamento nao informado")
	}

	payment, err := s.payments.FindByProviderPaymentID(resourceID)
	if err != nil {
		return err
	}

	_, _, err = s.refreshPaymentStatus(payment)
	return err
}

func (s *CreditService) ValidateWebhookSignature(signatureHeader, requestID, dataID string) bool {
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

func (s *CreditService) refreshPaymentStatus(payment models.Payment) (models.Payment, models.User, error) {
	if payment.Status != string(models.PaymentStatusPending) || payment.ProviderPaymentID == "" {
		return s.persistPaymentState(payment)
	}

	if err := s.requireMercadoPago(); err != nil {
		user, userErr := s.users.FindByID(payment.UserID)
		if userErr != nil {
			return models.Payment{}, models.User{}, userErr
		}

		return payment, user, nil
	}

	now := time.Now()
	mpPayment, err := s.mp.GetPayment(payment.ProviderPaymentID)
	if err != nil {
		return models.Payment{}, models.User{}, err
	}

	payment.Status = mapMercadoPagoPaymentStatus(mpPayment.Status, payment.PaymentExpiresAt, now)
	payment.ProviderPaymentID = strconv.FormatInt(mpPayment.ID, 10)
	payment.QRCode = mpPayment.PointOfInteraction.TransactionData.QRCode
	payment.QRCodeBase64 = mpPayment.PointOfInteraction.TransactionData.QRCodeBase64
	payment.TicketURL = mpPayment.PointOfInteraction.TransactionData.TicketURL
	payment.PaymentExpiresAt = parseTimePointer(mpPayment.DateOfExpiration, payment.PaymentExpiresAt)

	if payment.Status == string(models.PaymentStatusApproved) {
		payment.PaidAt = parseTimePointer(mpPayment.DateApproved, &now)
	}

	lastWebhookAt := now
	payment.LastWebhookAt = &lastWebhookAt

	return s.persistPaymentState(payment)
}

func (s *CreditService) persistPaymentState(payment models.Payment) (models.Payment, models.User, error) {
	var updatedPayment models.Payment
	var updatedUser models.User
	now := time.Now()
	creditsApplied := false

	err := s.db.Transaction(func(tx *gorm.DB) error {
		updates := map[string]any{
			"status":                   payment.Status,
			"provider_payment_id":      payment.ProviderPaymentID,
			"credit_quantity":          payment.CreditQuantity,
			"unit_amount_cents":        payment.UnitAmountCents,
			"transaction_amount_cents": payment.TransactionAmountCents,
			"title":                    payment.Title,
			"description":              payment.Description,
			"qr_code":                  payment.QRCode,
			"qr_code_base64":           payment.QRCodeBase64,
			"ticket_url":               payment.TicketURL,
			"payment_expires_at":       payment.PaymentExpiresAt,
			"paid_at":                  payment.PaidAt,
			"last_webhook_at":          payment.LastWebhookAt,
			"updated_at":               now,
		}

		if err := tx.Model(&models.Payment{}).Where("id = ?", payment.ID).Updates(updates).Error; err != nil {
			return err
		}

		if payment.Status == string(models.PaymentStatusApproved) {
			appliedAt := now
			result := tx.Model(&models.Payment{}).
				Where("id = ? AND credits_applied_at IS NULL", payment.ID).
				Updates(map[string]any{
					"credits_applied_at": appliedAt,
					"updated_at":         now,
				})
			if result.Error != nil {
				return result.Error
			}

			if result.RowsAffected > 0 {
				creditsApplied = true
				if err := tx.Model(&models.User{}).Where("id = ?", payment.UserID).Update("credits", gorm.Expr("credits + ?", payment.CreditQuantity)).Error; err != nil {
					return err
				}
			}
		}

		if err := tx.First(&updatedPayment, payment.ID).Error; err != nil {
			return err
		}

		if err := tx.First(&updatedUser, payment.UserID).Error; err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return models.Payment{}, models.User{}, err
	}

	if creditsApplied && s.emails != nil {
		if err := s.emails.EnqueueCreditsPurchasedEmail(
			updatedUser.Name,
			updatedUser.Email,
			updatedPayment.CreditQuantity,
			updatedPayment.TransactionAmountCents,
			updatedUser.Credits,
		); err != nil {
			log.Printf("falha ao enfileirar email de compra de creditos: %v", err)
		}
	}

	return updatedPayment, updatedUser, nil
}

func buildCreditPaymentTitle(quantity int) string {
	title := strings.TrimSpace(os.Getenv("CREDIT_PAYMENT_TITLE"))
	if title == "" {
		title = "Fitcha AI - Creditos"
	}

	return fmt.Sprintf("%s (%d %s)", title, quantity, pluralizeCredit(quantity))
}

func buildCreditPaymentDescription(quantity int) string {
	return fmt.Sprintf("%d %s para gerar treinos customizados com IA no Fitcha.", quantity, pluralizeCredit(quantity))
}

func pluralizeCredit(quantity int) string {
	if quantity == 1 {
		return "credito"
	}

	return "creditos"
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
	if parsed <= 0 {
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

func mapMercadoPagoPaymentStatus(status string, paymentExpiresAt *time.Time, now time.Time) string {
	switch status {
	case "approved":
		return string(models.PaymentStatusApproved)
	case "rejected", "cancelled":
		return string(models.PaymentStatusFailed)
	case "pending", "in_process":
		if paymentExpiresAt != nil && paymentExpiresAt.Before(now) {
			return string(models.PaymentStatusExpired)
		}
		return string(models.PaymentStatusPending)
	default:
		return string(models.PaymentStatusPending)
	}
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

func (s *CreditService) requireMercadoPago() error {
	if s.configError != nil {
		return s.configError
	}

	if s.mp == nil {
		return errors.New("mercado pago nao configurado")
	}

	return nil
}
