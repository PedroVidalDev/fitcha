package workers

import (
	"context"
	"encoding/json"
	"fitcha/internal/jobs"
	"fitcha/pkg/email"
	"fmt"

	"github.com/hibiken/asynq"
)

func NewEmailServeMux(mailer email.Mailer) *asynq.ServeMux {
	mux := asynq.NewServeMux()
	mux.HandleFunc(jobs.TaskSendWelcomeEmail, handleWelcomeEmail(mailer))
	mux.HandleFunc(jobs.TaskSendPasswordResetEmail, handlePasswordResetEmail(mailer))
	mux.HandleFunc(jobs.TaskSendCreditsPurchasedEmail, handleCreditsPurchasedEmail(mailer))
	return mux
}

func handleWelcomeEmail(mailer email.Mailer) func(context.Context, *asynq.Task) error {
	return func(_ context.Context, task *asynq.Task) error {
		var payload jobs.WelcomeEmailPayload
		if err := json.Unmarshal(task.Payload(), &payload); err != nil {
			return err
		}

		subject := "Bem-vindo ao Fitcha"
		body := fmt.Sprintf(
			"Oi, %s!\n\nSua conta no Fitcha foi criada com sucesso.\n\nAntes de entrar, confirme seu e-mail clicando neste link:\n%s\n\nDepois disso, voce ja podera fazer login no app.\n\nBom treino!\nEquipe Fitcha",
			payload.Name,
			payload.VerificationURL,
		)

		return mailer.Send(payload.Email, subject, body)
	}
}

func handlePasswordResetEmail(mailer email.Mailer) func(context.Context, *asynq.Task) error {
	return func(_ context.Context, task *asynq.Task) error {
		var payload jobs.PasswordResetEmailPayload
		if err := json.Unmarshal(task.Payload(), &payload); err != nil {
			return err
		}

		subject := "Redefina sua senha no Fitcha"
		body := fmt.Sprintf(
			"Oi, %s!\n\nRecebemos um pedido para redefinir a sua senha no Fitcha.\n\nUse este link para escolher uma nova senha:\n%s\n\nSe voce nao fez esse pedido, pode ignorar este e-mail.\n\nEquipe Fitcha",
			payload.Name,
			payload.ResetURL,
		)

		return mailer.Send(payload.Email, subject, body)
	}
}

func handleCreditsPurchasedEmail(mailer email.Mailer) func(context.Context, *asynq.Task) error {
	return func(_ context.Context, task *asynq.Task) error {
		var payload jobs.CreditsPurchasedEmailPayload
		if err := json.Unmarshal(task.Payload(), &payload); err != nil {
			return err
		}

		subject := "Seus creditos Fitcha foram liberados"
		body := fmt.Sprintf(
			"Oi, %s!\n\nRecebemos a aprovacao do seu pagamento.\n\nCreditos liberados: %d\nValor pago: %s\nSaldo atual: %d credito(s)\n\nVoce ja pode gerar novos treinos com IA no app.\n\nEquipe Fitcha",
			payload.Name,
			payload.Quantity,
			formatBRL(payload.TotalAmountCents),
			payload.Balance,
		)

		return mailer.Send(payload.Email, subject, body)
	}
}

func formatBRL(amountCents int64) string {
	reais := amountCents / 100
	cents := amountCents % 100
	return fmt.Sprintf("R$ %d,%02d", reais, cents)
}
