package database

import (
	"context"
	"errors"
	"log/slog"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// DB is the shared PostgreSQL connection pool.
var DB *pgxpool.Pool

// Connect initializes the shared PostgreSQL connection pool.
func Connect(databaseURL string) error {
	if databaseURL == "" {
		return errors.New("database URL is empty")
	}
	poolConfig, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return err
	}
	poolConfig.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		return err
	}
	if err := pool.Ping(context.Background()); err != nil {
		return err
	}
	DB = pool
	slog.Info("Connected to database")
	return nil
}

// Close releases the shared PostgreSQL connection pool.
func Close() {
	if DB != nil {
		DB.Close()
	}
}
