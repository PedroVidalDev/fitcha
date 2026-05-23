package jobs

import (
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

const (
	TaskSendWelcomeEmail          = "email:welcome"
	TaskSendCreditsPurchasedEmail = "email:credits_purchased"
)

type EmailJobEnqueuer interface {
	EnqueueWelcomeEmail(name, email, verificationURL string) error
	EnqueueCreditsPurchasedEmail(name, email string, quantity int, totalAmountCents int64, balance int) error
}

type AsynqEmailJobs struct {
	client *asynq.Client
}

type WelcomeEmailPayload struct {
	Name            string `json:"name"`
	Email           string `json:"email"`
	VerificationURL string `json:"verificationUrl"`
}

type CreditsPurchasedEmailPayload struct {
	Name             string `json:"name"`
	Email            string `json:"email"`
	Quantity         int    `json:"quantity"`
	TotalAmountCents int64  `json:"totalAmountCents"`
	Balance          int    `json:"balance"`
}

func NewEmailJobs(client *asynq.Client) *AsynqEmailJobs {
	return &AsynqEmailJobs{client: client}
}

func (j *AsynqEmailJobs) EnqueueWelcomeEmail(name, email, verificationURL string) error {
	return j.enqueue(TaskSendWelcomeEmail, WelcomeEmailPayload{
		Name:            name,
		Email:           email,
		VerificationURL: verificationURL,
	})
}

func (j *AsynqEmailJobs) EnqueueCreditsPurchasedEmail(name, email string, quantity int, totalAmountCents int64, balance int) error {
	return j.enqueue(TaskSendCreditsPurchasedEmail, CreditsPurchasedEmailPayload{
		Name:             name,
		Email:            email,
		Quantity:         quantity,
		TotalAmountCents: totalAmountCents,
		Balance:          balance,
	})
}

func (j *AsynqEmailJobs) enqueue(taskType string, payload any) error {
	if j == nil || j.client == nil {
		return fmt.Errorf("cliente da fila de emails nao configurado")
	}

	rawPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	task := asynq.NewTask(taskType, rawPayload)
	_, err = j.client.Enqueue(task, asynq.Queue("emails"), asynq.MaxRetry(10))
	return err
}
