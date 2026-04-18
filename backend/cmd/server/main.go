package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	authsupabase "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/adapter/supabase"
	authapp "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/app"
	authport "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/port"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/httpapi"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/platform/config"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/platform/database"
	profilepg "github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile/adapter/postgres"
	profileapp "github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile/app"
	"github.com/joho/godotenv"
)

var logger = slog.New(slog.NewJSONHandler(os.Stdout, nil))

func main() {
	ctx := context.Background()
	if err := godotenv.Load(); err != nil {
		logger.Warn(".env file not loaded", "error", err)
	}
	cfg := config.Load()
	if err := database.Connect(cfg.DatabaseURL); err != nil {
		logger.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	defer database.Close()
	profileRepo := profilepg.NewRepository(database.DB)
	profileService := profileapp.NewService(profileRepo)
	var authService authport.Service
	authProvider, err := authsupabase.NewClient(cfg.SupabaseURL, cfg.SupabaseAPIKey)
	if err != nil {
		logger.Warn("auth service disabled", "error", err)
	} else {
		authService = authapp.NewService(authProvider, profileRepo)
	}
	r := httpapi.NewRouter(cfg, authService, profileService)
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}
	ctx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		slog.Info("server listening", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("server error", "error", err)
			os.Exit(1)
		}
	}()
	<-ctx.Done()
	slog.Info("shutting down server")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown error", "error", err)
	}
	logger.Info("server stopped")
}
