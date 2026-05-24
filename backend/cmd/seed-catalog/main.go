package main

import (
	database "fitcha/pkg/db"
	"log"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Aviso: Arquivo .env nao encontrado, usando variaveis de ambiente do sistema")
	}

	db, err := database.InitDB()
	if err != nil {
		log.Fatal(err)
	}

	if err := database.SeedCatalogMachines(db); err != nil {
		log.Fatal("erro ao popular catalogo de maquinas: ", err)
	}

	log.Println("Catalogo de maquinas populado com sucesso.")
}
