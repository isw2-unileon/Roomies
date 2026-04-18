package httpapi

import (
	"net/http"

	"github.com/gin-gonic/gin"
	authport "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/port"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/platform/config"
	profileport "github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile/port"
)

// NewRouter builds the HTTP API router.
func NewRouter(cfg *config.Config, authService authport.Service, profileService profileport.Service) *gin.Engine {
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
	authH := newAuthHandler(authService, cfg.FrontendURL)
	profileH := newProfileHandler(authService, profileService)
	api.POST("/auth/login", authH.login)
	api.POST("/auth/register", authH.register)
	api.POST("/auth/forgot-password", authH.forgotPassword)
	api.POST("/auth/confirm", authH.confirm)
	api.POST("/auth/reset-password", authH.resetPassword)
	api.GET("/profile/status", profileH.status)
	api.POST("/tenant-profile", profileH.saveTenantProfile)
	return r
}
