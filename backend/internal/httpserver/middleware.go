package httpserver

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	authservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/service"
	profileservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile/service"
)

const (
	accessTokenCookieName = "roomies_access_token"
	contextUserIDKey      = "roomies.user_id"
	contextRoleKey        = "roomies.role"
	contextAccessTokenKey = "roomies.access_token"
)

func corsMiddleware(allowOrigin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if allowOrigin == "*" || (origin != "" && strings.EqualFold(origin, allowOrigin)) {
			if origin != "" && allowOrigin != "*" {
				c.Header("Access-Control-Allow-Origin", origin)
			} else {
				c.Header("Access-Control-Allow-Origin", allowOrigin)
			}
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Headers", "Content-Type")
			c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			if allowOrigin != "*" {
				c.Header("Access-Control-Allow-Credentials", "true")
			}
		}
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func requireAuth(authService *authservice.Service, profileService *profileservice.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		accessToken, err := c.Cookie(accessTokenCookieName)
		if err != nil || strings.TrimSpace(accessToken) == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
			return
		}

		userID, err := authService.ResolveUserIDFromAccessToken(c.Request.Context(), accessToken)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}
		role, err := profileService.LookupRoleByUserID(c.Request.Context(), userID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		c.Set(contextUserIDKey, userID)
		c.Set(contextRoleKey, role)
		c.Set(contextAccessTokenKey, accessToken)
		c.Next()
	}
}

func requireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		currentRole := c.GetString(contextRoleKey)
		if currentRole == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
			return
		}
		if !strings.EqualFold(strings.TrimSpace(currentRole), strings.TrimSpace(role)) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		c.Next()
	}
}
