package models

import "time"

type PaymentStatus string

const (
	PaymentStatusPending  PaymentStatus = "pending"
	PaymentStatusApproved PaymentStatus = "approved"
	PaymentStatusExpired  PaymentStatus = "expired"
	PaymentStatusFailed   PaymentStatus = "failed"
)

type Payment struct {
	ID                     uint       `gorm:"primaryKey" json:"id"`
	CreatedAt              time.Time  `json:"createdAt"`
	UpdatedAt              time.Time  `json:"updatedAt"`
	UserID                 uint       `gorm:"index;not null" json:"userId"`
	Provider               string     `gorm:"size:50;not null" json:"provider"`
	Status                 string     `gorm:"size:30;index;not null" json:"status"`
	ExternalReference      string     `gorm:"size:120;uniqueIndex;not null" json:"externalReference"`
	ProviderPaymentID      string     `gorm:"size:120;index" json:"providerPaymentId"`
	CreditQuantity         int        `gorm:"not null" json:"creditQuantity"`
	UnitAmountCents        int64      `gorm:"not null" json:"unitAmountCents"`
	TransactionAmountCents int64      `gorm:"not null" json:"transactionAmountCents"`
	Currency               string     `gorm:"size:10;not null" json:"currency"`
	Title                  string     `gorm:"size:120;not null" json:"title"`
	Description            string     `gorm:"size:255" json:"description"`
	PayerDocument          string     `gorm:"size:30" json:"payerDocument"`
	QRCode                 string     `gorm:"type:text" json:"qrCode"`
	QRCodeBase64           string     `gorm:"type:text" json:"qrCodeBase64"`
	TicketURL              string     `gorm:"type:text" json:"ticketUrl"`
	PaymentExpiresAt       *time.Time `json:"paymentExpiresAt,omitempty"`
	PaidAt                 *time.Time `json:"paidAt,omitempty"`
	CreditsAppliedAt       *time.Time `json:"creditsAppliedAt,omitempty"`
	LastWebhookAt          *time.Time `json:"lastWebhookAt,omitempty"`
}

func (Payment) TableName() string {
	return "tb_payments"
}
