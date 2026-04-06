// Package main is the entry point for the backend server.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/config"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/database"
	"github.com/joho/godotenv"
)

var logger = slog.New(slog.NewJSONHandler(os.Stdout, nil))

func main() {
	ctx := context.Background()

	godotenv.Load()

	cfg := config.Load()

	if err := database.Connect(cfg.DatabaseURL); err != nil {
		logger.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	defer database.Close()

	gin.SetMode(cfg.GinMode)

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		allowOrigin := cfg.CORSAllowOrigin
		if allowOrigin == "*" || (origin != "" && strings.EqualFold(origin, allowOrigin)) {
			if origin != "" && allowOrigin != "*" {
				c.Header("Access-Control-Allow-Origin", origin)
			} else {
				c.Header("Access-Control-Allow-Origin", allowOrigin)
			}
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
			c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		}

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	// Hello World endpoint consumed by the frontend to verify API connectivity.
	api.GET("/hello", func(c *gin.Context) {
		// Response contract expected by frontend/src/components/HelloWorld.tsx.
		c.JSON(http.StatusOK, gin.H{"message": "Hello from Roomies backend!"})
	})

	authService, err := auth.NewService(cfg.SupabaseURL, cfg.SupabaseAPIKey)
	if err != nil {
		logger.Warn("auth service disabled", "error", err)
	} else {
		api.POST("/auth/login", func(c *gin.Context) {
			var input auth.LoginInput
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
				return
			}

			result, err := authService.Login(c.Request.Context(), input)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message":          "login successful",
				"access_token":     result.AccessToken,
				"refresh_token":    result.RefreshToken,
				"token_type":       result.TokenType,
				"expires_in":       result.ExpiresIn,
				"user_id":          result.UserID,
				"role":             result.Role,
				"needs_onboarding": result.NeedsTenant,
			})
		})

		api.POST("/auth/register", func(c *gin.Context) {
			var input auth.RegisterInput
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
				return
			}

			result, err := authService.Register(c.Request.Context(), input)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusCreated, gin.H{
				"message":          "registration successful",
				"access_token":     result.AccessToken,
				"refresh_token":    result.RefreshToken,
				"token_type":       result.TokenType,
				"expires_in":       result.ExpiresIn,
				"user_id":          result.UserID,
				"role":             result.Role,
				"needs_onboarding": result.NeedsTenant,
			})
		})

		api.GET("/profile/status", func(c *gin.Context) {
			accessToken, err := extractBearerToken(c.GetHeader("Authorization"))
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
				return
			}

			userID, err := auth.ResolveUserIDFromAccessToken(c.Request.Context(), authService, accessToken)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
				return
			}

			role, err := auth.LookupRoleByUserID(c.Request.Context(), userID)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
				return
			}

			needsTenantProfile, err := auth.NeedsTenantProfile(c.Request.Context(), userID, role)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "could not resolve profile status"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"user_id":             userID,
				"role":                role,
				"needs_onboarding":    needsTenantProfile,
				"onboarding_complete": !needsTenantProfile,
			})
		})

		api.POST("/tenant-profile", func(c *gin.Context) {
			accessToken, err := extractBearerToken(c.GetHeader("Authorization"))
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
				return
			}

			userID, err := auth.ResolveUserIDFromAccessToken(c.Request.Context(), authService, accessToken)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
				return
			}

			role, err := auth.LookupRoleByUserID(c.Request.Context(), userID)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
				return
			}

			if role != "tenant" {
				c.JSON(http.StatusForbidden, gin.H{"error": "tenant profile is only available for tenant users"})
				return
			}

			type tenantProfileInput struct {
				BudgetMin     int    `json:"budget_min"`
				BudgetMax     int    `json:"budget_max"`
				PreferredArea string `json:"preferred_area"`
				MoveInDate    string `json:"move_in_date"`
				Schedule      string `json:"schedule"`
				Pets          bool   `json:"pets"`
				Smoker        bool   `json:"smoker"`
				NoiseLevel    string `json:"noise_level"`
				Cleanliness   string `json:"cleanliness"`
			}

			var input tenantProfileInput
			if err := c.ShouldBindJSON(&input); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
				return
			}

			if input.BudgetMin <= 0 || input.BudgetMax <= 0 || input.BudgetMin > input.BudgetMax {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid budget range"})
				return
			}

			if strings.TrimSpace(input.PreferredArea) == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "preferred_area is required"})
				return
			}

			if _, err := time.Parse("2006-01-02", input.MoveInDate); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "move_in_date must have YYYY-MM-DD format"})
				return
			}

			schedule := strings.ToLower(strings.TrimSpace(input.Schedule))
			if schedule != "morning" && schedule != "night" && schedule != "flexible" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "schedule must be morning, night or flexible"})
				return
			}

			noiseLevel := strings.ToLower(strings.TrimSpace(input.NoiseLevel))
			if noiseLevel != "quiet" && noiseLevel != "moderate" && noiseLevel != "loud" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "noise_level must be quiet, moderate or loud"})
				return
			}

			cleanliness := strings.ToLower(strings.TrimSpace(input.Cleanliness))
			if cleanliness != "very_clean" && cleanliness != "normal" && cleanliness != "relaxed" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "cleanliness must be very_clean, normal or relaxed"})
				return
			}

			result, err := database.DB.Exec(
				c.Request.Context(),
				`UPDATE public.tenant_profiles SET
					budget_min = $2,
					budget_max = $3,
					preferred_area = $4,
					move_in_date = $5,
					schedule = $6,
					pets = $7,
					smoker = $8,
					noise_level = $9,
					cleanliness = $10,
					updated_at = NOW()
				WHERE user_id = $1`,
				userID,
				input.BudgetMin,
				input.BudgetMax,
				strings.TrimSpace(input.PreferredArea),
				input.MoveInDate,
				schedule,
				input.Pets,
				input.Smoker,
				noiseLevel,
				cleanliness,
			)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save tenant profile"})
				return
			}

			if result.RowsAffected() == 0 {
				_, err = database.DB.Exec(
					c.Request.Context(),
					`INSERT INTO public.tenant_profiles
					(user_id, budget_min, budget_max, preferred_area, move_in_date, schedule, pets, smoker, noise_level, cleanliness, updated_at)
				VALUES
					($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
					userID,
					input.BudgetMin,
					input.BudgetMax,
					strings.TrimSpace(input.PreferredArea),
					input.MoveInDate,
					schedule,
					input.Pets,
					input.Smoker,
					noiseLevel,
					cleanliness,
				)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save tenant profile"})
					return
				}
			}

			c.JSON(http.StatusOK, gin.H{"message": "tenant profile saved", "onboarding_complete": true})
		})
	}

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

func extractBearerToken(authorizationHeader string) (string, error) {
	header := strings.TrimSpace(authorizationHeader)
	if header == "" {
		return "", errors.New("authorization token is required")
	}

	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", errors.New("authorization header must use Bearer token")
	}

	token := strings.TrimSpace(parts[1])
	if token == "" {
		return "", errors.New("authorization token is required")
	}

	return token, nil
}
