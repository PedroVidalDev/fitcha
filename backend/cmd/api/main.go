package main

import (
	"fitcha/internal/routes"
	database "fitcha/pkg/db"
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Aviso: Arquivo .env não encontrado, usando variáveis de ambiente do sistema")
	}

	dbConnection, err := database.InitDB()
	if err != nil {
		log.Fatal(err)
	}

	r := gin.Default()

	routes.SetupRoutes(r, dbConnection)

	port := fmt.Sprintf(
		":%s",
		os.Getenv("PORT"),
	)
	r.Run(port)
}
