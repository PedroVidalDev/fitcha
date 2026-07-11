package main

import (
	"fitcha/internal/middlewares"
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
	if err != nil && !os.IsNotExist(err) {
		log.Printf("Aviso: falha ao carregar arquivo .env: %v", err)
	}

	dbConnection, err := database.InitDB()
	if err != nil {
		log.Fatal(err)
	}

	r := gin.Default()
	r.Use(middlewares.CORSMiddleware())

	routes.SetupRoutes(r, dbConnection)

	port := fmt.Sprintf(
		":%s",
		os.Getenv("PORT"),
	)
	r.Run(port)
}
