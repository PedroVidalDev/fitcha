package main

import (
	"fitcha/internal/workers"
	"fitcha/pkg/email"
	"fitcha/pkg/queue"
	"log"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Aviso: Arquivo .env nao encontrado, usando variaveis de ambiente do sistema")
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
