package httpadapter

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth"
	authservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/service"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/httpauth"
)

type handler struct {
	authService *authservice.Service
	frontendURL string
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type registerRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}

type forgotPasswordRequest struct {
	Email string `json:"email"`
}

type confirmRequest struct {
	TokenHash string `json:"token_hash"`
	Token     string `json:"token"`
	Type      string `json:"type"`
	Email     string `json:"email"`
}

type resetPasswordRequest struct {
	Password string `json:"password"`
}

// RegisterRoutes wires authentication endpoints into the API router.
func RegisterRoutes(api *gin.RouterGroup, authService *authservice.Service, frontendURL string) {
	h := &handler{authService: authService, frontendURL: frontendURL}
	api.POST("/auth/login", h.login)
	api.POST("/auth/register", h.register)
	api.POST("/auth/forgot-password", h.forgotPassword)
	api.POST("/auth/confirm", h.confirm)
	api.POST("/auth/reset-password", h.resetPassword)
}

func (h *handler) login(c *gin.Context) {
	var request loginRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	result, err := h.authService.Login(c.Request.Context(), auth.LoginInput{Email: request.Email, Password: request.Password})
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
}

func (h *handler) register(c *gin.Context) {
	var request registerRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	emailRedirectTo := strings.TrimRight(h.frontendURL, "/") + "/auth/callback"
	result, err := h.authService.Register(c.Request.Context(), auth.RegisterInput{
		Email:    request.Email,
		Password: request.Password,
		FullName: request.FullName,
		Role:     request.Role,
	}, emailRedirectTo)
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
}

func (h *handler) forgotPassword(c *gin.Context) {
	var request forgotPasswordRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	redirectTo := strings.TrimRight(h.frontendURL, "/") + "/reset-password"
	if err := h.authService.ForgotPassword(c.Request.Context(), auth.ForgotPasswordInput{Email: request.Email}, redirectTo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "password recovery email sent"})
}

func (h *handler) confirm(c *gin.Context) {
	var request confirmRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	result, err := h.authService.VerifyEmail(c.Request.Context(), request.TokenHash, request.Token, request.Type, request.Email)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message":       "account verification successful",
		"access_token":  result.AccessToken,
		"refresh_token": result.RefreshToken,
		"token_type":    result.TokenType,
		"expires_in":    result.ExpiresIn,
	})
}

func (h *handler) resetPassword(c *gin.Context) {
	var request resetPasswordRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	accessToken, err := httpauth.ExtractBearerToken(c.GetHeader("Authorization"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	if err := h.authService.UpdatePassword(c.Request.Context(), accessToken, request.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
}
