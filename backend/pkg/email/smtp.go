package email

import (
	"bytes"
	"errors"
	"fmt"
	"net/smtp"
	"os"
	"strconv"
	"strings"
)

type Mailer interface {
	Send(to, subject, body string) error
}

type SMTPMailer struct {
	host      string
	port      int
	username  string
	password  string
	fromName  string
	fromEmail string
}

func NewSMTPMailerFromEnv() (*SMTPMailer, error) {
	host := strings.TrimSpace(os.Getenv("SMTP_HOST"))
	if host == "" {
		host = "smtp.gmail.com"
	}

	port := 587
	if raw := strings.TrimSpace(os.Getenv("SMTP_PORT")); raw != "" {
		parsed, err := strconv.Atoi(raw)
		if err != nil || parsed <= 0 {
			return nil, errors.New("SMTP_PORT invalida")
		}
		port = parsed
	}

	username := strings.TrimSpace(os.Getenv("SMTP_USERNAME"))
	password := strings.TrimSpace(os.Getenv("SMTP_PASSWORD"))
	fromEmail := strings.TrimSpace(os.Getenv("SMTP_FROM_EMAIL"))
	fromName := strings.TrimSpace(os.Getenv("SMTP_FROM_NAME"))

	if username == "" || password == "" || fromEmail == "" {
		return nil, errors.New("configure SMTP_USERNAME, SMTP_PASSWORD e SMTP_FROM_EMAIL")
	}

	if fromName == "" {
		fromName = "Fitcha"
	}

	return &SMTPMailer{
		host:      host,
		port:      port,
		username:  username,
		password:  password,
		fromName:  fromName,
		fromEmail: fromEmail,
	}, nil
}

func (m *SMTPMailer) Send(to, subject, body string) error {
	if strings.TrimSpace(to) == "" {
		return errors.New("destinatario do email nao informado")
	}

	auth := smtp.PlainAuth("", m.username, m.password, m.host)
	addr := fmt.Sprintf("%s:%d", m.host, m.port)
	fromHeader := fmt.Sprintf("%s <%s>", m.fromName, m.fromEmail)

	var message bytes.Buffer
	message.WriteString(fmt.Sprintf("From: %s\r\n", fromHeader))
	message.WriteString(fmt.Sprintf("To: %s\r\n", to))
	message.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	message.WriteString("MIME-Version: 1.0\r\n")
	message.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n")
	message.WriteString("\r\n")
	message.WriteString(body)

	return smtp.SendMail(addr, auth, m.fromEmail, []string{to}, message.Bytes())
}
