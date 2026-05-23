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

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{TranslateError: true})
	if err != nil {
		return nil, fmt.Errorf("Error with the database connection")
	}

	migrator := db.Migrator()

	if migrator.HasTable("users") && !migrator.HasTable("tb_users") {
		if err := migrator.RenameTable("users", "tb_users"); err != nil {
			return nil, fmt.Errorf("erro ao renomear tabela de usuarios")
		}
	}

	if err := migrateLegacyMachineTables(db); err != nil {
		return nil, err
	}

	if err := db.Exec("DROP TABLE IF EXISTS tb_plans").Error; err != nil {
		return nil, fmt.Errorf("erro ao remover tabela legada de assinaturas")
	}

	if err := db.Exec("ALTER TABLE IF EXISTS tb_users DROP COLUMN IF EXISTS plan_active").Error; err != nil {
		return nil, fmt.Errorf("erro ao remover coluna legada plan_active")
	}

	err = db.AutoMigrate(
		&models.User{},
		&models.Payment{},
		&models.Machine{},
		&models.UserMachine{},
		&models.Day{},
		&models.DayMachine{},
		&models.HistoryEntry{},
	)
	if err != nil {
		return nil, fmt.Errorf("erro na migracao")
	}

	return db, nil
}

func migrateLegacyMachineTables(db *gorm.DB) error {
	migrator := db.Migrator()

	if migrator.HasTable("tb_machines") && !migrator.HasTable("tb_user_machines") && hasColumn(db, "tb_machines", "user_id") {
		if err := migrator.RenameTable("tb_machines", "tb_user_machines"); err != nil {
			return fmt.Errorf("erro ao migrar tabela legada de maquinas")
		}
	}

	if hasColumn(db, "tb_day_machines", "machine_id") && !hasColumn(db, "tb_day_machines", "user_machine_id") {
		if err := db.Exec("ALTER TABLE tb_day_machines RENAME COLUMN machine_id TO user_machine_id").Error; err != nil {
			return fmt.Errorf("erro ao migrar referencias de dias para user_machines")
		}
	}

	if hasColumn(db, "tb_history_entries", "machine_id") && !hasColumn(db, "tb_history_entries", "user_machine_id") {
		if err := db.Exec("ALTER TABLE tb_history_entries RENAME COLUMN machine_id TO user_machine_id").Error; err != nil {
			return fmt.Errorf("erro ao migrar referencias de historico para user_machines")
		}
	}

	return nil
}

func hasColumn(db *gorm.DB, tableName, columnName string) bool {
	var exists bool
	_ = db.Raw(`
		SELECT EXISTS (
			SELECT 1
			FROM information_schema.columns
			WHERE table_schema = current_schema()
			  AND table_name = ?
			  AND column_name = ?
		)
	`, tableName, columnName).Scan(&exists).Error
	return exists
}
