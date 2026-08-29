package main

import (
	"fitcha/internal/middlewares"
	"fitcha/internal/repositories"
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

	r := gin.New()

	errorLogRepo := repositories.NewErrorLogRepository(dbConnection)
	r.Use(gin.Logger())
	r.Use(middlewares.Recovery(errorLogRepo))
	r.Use(middlewares.CORSMiddleware())
	r.Use(middlewares.ErrorHandler(errorLogRepo))

	routes.SetupRoutes(r, dbConnection)

	port := fmt.Sprintf(
		":%s",
		os.Getenv("PORT"),
	)
	r.Run(port)
}
