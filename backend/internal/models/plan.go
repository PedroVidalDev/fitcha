package models

import "time"

type PlanStatus string

const (
	PlanStatusPending  PlanStatus = "pending"
	PlanStatusApproved PlanStatus = "approved"
	PlanStatusExpired  PlanStatus = "expired"
	PlanStatusFailed   PlanStatus = "failed"
)

type Plan struct {
	ID                     uint       `gorm:"primaryKey" json:"id"`
	CreatedAt              time.Time  `json:"createdAt"`
	UpdatedAt              time.Time  `json:"updatedAt"`
	UserID                 uint       `gorm:"index;not null" json:"userId"`
	Provider               string     `gorm:"size:50;not null" json:"provider"`
	Status                 string     `gorm:"size:30;index;not null" json:"status"`
	ExternalReference      string     `gorm:"size:120;uniqueIndex;not null" json:"externalReference"`
	ProviderPaymentID      string     `gorm:"size:120;index" json:"providerPaymentId"`
	TransactionAmountCents int64      `json:"transactionAmountCents"`
	Currency               string     `gorm:"size:10;not null" json:"currency"`
	Title                  string     `gorm:"size:120;not null" json:"title"`
	Description            string     `gorm:"size:255" json:"description"`
	PayerDocument          string     `gorm:"size:30" json:"payerDocument"`
	QRCode                 string     `gorm:"type:text" json:"qrCode"`
	QRCodeBase64           string     `gorm:"type:text" json:"qrCodeBase64"`
	TicketURL              string     `gorm:"type:text" json:"ticketUrl"`
	PaymentExpiresAt       *time.Time `json:"paymentExpiresAt,omitempty"`
	PaidAt                 *time.Time `json:"paidAt,omitempty"`
	AccessStartsAt         *time.Time `json:"accessStartsAt,omitempty"`
	AccessExpiresAt        *time.Time `json:"accessExpiresAt,omitempty"`
	LastWebhookAt          *time.Time `json:"lastWebhookAt,omitempty"`
}

func (Plan) TableName() string {
	return "tb_plans"
}
