package httpserver

import (
	"net/http"
	"strings"

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
	secureCookies := strings.EqualFold(cfg.GinMode, gin.ReleaseMode)
	authhttp.RegisterPublicRoutes(api, authService, cfg.FrontendURL, secureCookies)

	authenticated := api.Group("")
	authenticated.Use(requireAuth(authService, profileService))
	authhttp.RegisterAuthenticatedRoutes(authenticated, authService, secureCookies)
	profilehttp.RegisterRoutes(authenticated, profileService)

	tenant := authenticated.Group("")
	tenant.Use(requireRole("tenant"))
	owner := authenticated.Group("")
	owner.Use(requireRole("owner"))

	if apartmentService != nil {
		apartmenthttp.RegisterPublicRoutes(api, apartmentService)
		apartmenthttp.RegisterTenantRoutes(tenant, apartmentService)
		apartmenthttp.RegisterOwnerRoutes(owner, apartmentService)
	}
	if applicationService != nil {
		applicationhttp.RegisterSharedRoutes(authenticated, applicationService)
		applicationhttp.RegisterTenantRoutes(tenant, applicationService)
		applicationhttp.RegisterOwnerRoutes(owner, applicationService)
	}
	return r
}
