package httpserver

import (
	"net/http"

	"github.com/gin-gonic/gin"
	apartmenthttp "github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment/httpadapter"
	apartmentservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment/service"
	applicationhttp "github.com/isw2-unileon/proyect-scaffolding/backend/internal/application/httpadapter"
	applicationservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/application/service"
	authhttp "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/httpadapter"
	authservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/service"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/platform/config"
	profilehttp "github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile/httpadapter"
	profileservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile/service"
)

// NewRouter builds the HTTP API router.
func NewRouter(cfg *config.Config, authService *authservice.Service, profileService *profileservice.Service, apartmentService *apartmentservice.Service, applicationService *applicationservice.Service) *gin.Engine {
	gin.SetMode(cfg.GinMode)
	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery(), corsMiddleware(cfg.CORSAllowOrigin))
	r.GET("", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/health")
	})
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	api := r.Group("/api")
	api.GET("/hello", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Hello from Roomies backend!"})
	})
	if authService == nil || profileService == nil {
		return r
	}
	authhttp.RegisterRoutes(api, authService, cfg.FrontendURL, ExtractBearerToken)
	profilehttp.RegisterRoutes(api, authService, profileService, ExtractBearerToken)
	if apartmentService != nil {
		apartmenthttp.RegisterRoutes(api, authService, profileService, apartmentService, ExtractBearerToken)
	}
	if applicationService != nil {
		applicationhttp.RegisterRoutes(api, authService, profileService, applicationService, ExtractBearerToken)
	}
	return r
}
