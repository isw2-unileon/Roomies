package httpapi

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	authport "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/port"
)

type authHandler struct {
	authService authport.Service
	frontendURL string
}
type confirmInput struct {
	TokenHash string `json:"token_hash"`
	Token     string `json:"token"`
	Type      string `json:"type"`
	Email     string `json:"email"`
}
type resetPasswordInput struct {
	Password string `json:"password"`
}

func newAuthHandler(authService authport.Service, frontendURL string) *authHandler {
	return &authHandler{
		authService: authService,
		frontendURL: frontendURL,
	}
}

func (h *authHandler) login(c *gin.Context) {
	var input authport.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	result, err := h.authService.Login(c.Request.Context(), input)
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

func (h *authHandler) register(c *gin.Context) {
	var input authport.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	emailRedirectTo := strings.TrimRight(h.frontendURL, "/") + "/auth/callback"
	result, err := h.authService.Register(c.Request.Context(), input, emailRedirectTo)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"message":          "registration successful, please confirm your email",
		"access_token":     result.AccessToken,
		"refresh_token":    result.RefreshToken,
		"token_type":       result.TokenType,
		"expires_in":       result.ExpiresIn,
		"user_id":          result.UserID,
		"role":             result.Role,
		"needs_onboarding": result.NeedsTenant,
	})
}

func (h *authHandler) forgotPassword(c *gin.Context) {
	var input authport.ForgotPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	redirectTo := strings.TrimRight(h.frontendURL, "/") + "/reset-password"
	if err := h.authService.ForgotPassword(c.Request.Context(), input, redirectTo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "password recovery email sent"})
}

func (h *authHandler) confirm(c *gin.Context) {
	var input confirmInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	result, err := h.authService.VerifyEmail(c.Request.Context(), input.TokenHash, input.Token, input.Type, input.Email)
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

func (h *authHandler) resetPassword(c *gin.Context) {
	var input resetPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	accessToken, err := extractBearerToken(c.GetHeader("Authorization"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	if err := h.authService.UpdatePassword(c.Request.Context(), accessToken, input.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
}
