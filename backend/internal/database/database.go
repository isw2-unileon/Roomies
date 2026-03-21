package database

import (
	"context"
	"errors"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func Connect(databaseURL string) error {
	if databaseURL == "" {
		return errors.New("database URL is empty")
	}

	pool, err := pgxpool.New(context.Background(), databaseURL)
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

func Close() {
	if DB != nil {
		DB.Close()
	}
}
