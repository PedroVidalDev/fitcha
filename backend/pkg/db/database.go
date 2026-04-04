package database

import (
	"fitcha/internal/models"
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDB() (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		return nil, fmt.Errorf("Error with the database connection")
	}

	migrator := db.Migrator()

	if migrator.HasTable("users") && !migrator.HasTable("tb_users") {
		if err := migrator.RenameTable("users", "tb_users"); err != nil {
			return nil, fmt.Errorf("erro ao renomear tabela de usuarios")
		}
	}

	err = db.AutoMigrate(&models.User{}, &models.Plan{})

	if err != nil {
		return nil, fmt.Errorf("Erro na migracao")
	}

	return db, nil
}
