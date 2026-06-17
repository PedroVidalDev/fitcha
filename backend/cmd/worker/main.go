package main

import (
	"fitcha/internal/workers"
	"fitcha/pkg/email"
	"fitcha/pkg/queue"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		log.Printf("Aviso: falha ao carregar arquivo .env: %v", err)
	}

	mailer, err := email.NewSMTPMailerFromEnv()
	if err != nil {
		log.Fatal(err)
	}

	server := queue.NewServerFromEnv()
	mux := workers.NewEmailServeMux(mailer)

	if err := server.Run(mux); err != nil {
		log.Fatal(err)
	}
}
