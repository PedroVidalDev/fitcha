package database

import (
	"database/sql"
	"embed"
	"errors"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	postgresmigrate "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "github.com/jackc/pgx/v5/stdlib"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

func RunMigrations(dsn string) error {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("erro ao abrir conexao SQL para migrations: %w", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		return fmt.Errorf("erro ao validar conexao SQL para migrations: %w", err)
	}

	sourceDriver, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("erro ao carregar arquivos de migration: %w", err)
	}

	databaseDriver, err := postgresmigrate.WithInstance(db, &postgresmigrate.Config{})
	if err != nil {
		return fmt.Errorf("erro ao configurar driver postgres das migrations: %w", err)
	}

	migrator, err := migrate.NewWithInstance("iofs", sourceDriver, "postgres", databaseDriver)
	if err != nil {
		return fmt.Errorf("erro ao criar migrator: %w", err)
	}

	if err := migrator.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("erro ao aplicar migrations: %w", err)
	}

	return nil
}
