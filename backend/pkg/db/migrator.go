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

const workoutMigrationVersion = 4

func RunMigrations(dsn string) error {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return fmt.Errorf("erro ao abrir conexao SQL para migrations: %w", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		return fmt.Errorf("erro ao validar conexao SQL para migrations: %w", err)
	}

	migrator, err := newMigrator(db)
	if err != nil {
		return err
	}

	if err := applyMigrations(migrator); err != nil {
		var dirtyErr migrate.ErrDirty
		if errors.As(err, &dirtyErr) {
			recovered, recoveryErr := tryRecoverDirtyWorkoutMigration(db, migrator, dirtyErr)
			if recoveryErr != nil {
				return recoveryErr
			}
			if recovered {
				return nil
			}
		}

		return fmt.Errorf("erro ao aplicar migrations: %w", err)
	}

	return nil
}

func newMigrator(db *sql.DB) (*migrate.Migrate, error) {
	sourceDriver, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return nil, fmt.Errorf("erro ao carregar arquivos de migration: %w", err)
	}

	databaseDriver, err := postgresmigrate.WithInstance(db, &postgresmigrate.Config{})
	if err != nil {
		return nil, fmt.Errorf("erro ao configurar driver postgres das migrations: %w", err)
	}

	migrator, err := migrate.NewWithInstance("iofs", sourceDriver, "postgres", databaseDriver)
	if err != nil {
		return nil, fmt.Errorf("erro ao criar migrator: %w", err)
	}

	return migrator, nil
}

func applyMigrations(migrator *migrate.Migrate) error {
	if err := migrator.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}

	return nil
}

func tryRecoverDirtyWorkoutMigration(db *sql.DB, migrator *migrate.Migrate, dirtyErr migrate.ErrDirty) (bool, error) {
	if dirtyErr.Version != workoutMigrationVersion {
		return false, nil
	}

	recoverable, err := isRecoverableDirtyWorkoutMigration(db)
	if err != nil {
		return false, fmt.Errorf("erro ao verificar possibilidade de recuperar migration %d: %w", workoutMigrationVersion, err)
	}

	if !recoverable {
		return false, nil
	}

	if _, err := db.Exec(`
		DROP TABLE IF EXISTS tb_workout_machines;
		DROP TABLE IF EXISTS tb_workouts;
	`); err != nil {
		return false, fmt.Errorf("erro ao limpar resquicios da migration %d: %w", workoutMigrationVersion, err)
	}

	if err := migrator.Force(workoutMigrationVersion - 1); err != nil {
		return false, fmt.Errorf("erro ao resetar estado dirty da migration %d: %w", workoutMigrationVersion, err)
	}

	if err := applyMigrations(migrator); err != nil {
		return false, fmt.Errorf("erro ao reaplicar migration %d apos recuperar estado dirty: %w", workoutMigrationVersion, err)
	}

	return true, nil
}

func isRecoverableDirtyWorkoutMigration(db *sql.DB) (bool, error) {
	var hasDays bool
	var hasDayMachines bool
	var hasWorkouts bool
	var hasWorkoutMachines bool

	err := db.QueryRow(`
		SELECT
			EXISTS (
				SELECT 1
				FROM information_schema.tables
				WHERE table_schema = current_schema()
				  AND table_name = 'tb_days'
			),
			EXISTS (
				SELECT 1
				FROM information_schema.tables
				WHERE table_schema = current_schema()
				  AND table_name = 'tb_day_machines'
			),
			EXISTS (
				SELECT 1
				FROM information_schema.tables
				WHERE table_schema = current_schema()
				  AND table_name = 'tb_workouts'
			),
			EXISTS (
				SELECT 1
				FROM information_schema.tables
				WHERE table_schema = current_schema()
				  AND table_name = 'tb_workout_machines'
			)
	`).Scan(&hasDays, &hasDayMachines, &hasWorkouts, &hasWorkoutMachines)
	if err != nil {
		return false, err
	}

	return hasDays && hasDayMachines && !hasWorkouts && !hasWorkoutMachines, nil
}
