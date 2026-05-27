package httpadapter

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth"
	authservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/service"
)

type handler struct {
	authService   *authservice.Service
	frontendURL   string
	secureCookies bool
}

const (
	accessTokenCookieName  = "roomies_access_token"
	refreshTokenCookieName = "roomies_refresh_token"
	refreshTokenMaxAge     = 60 * 60 * 24 * 30
)

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

// RegisterPublicRoutes wires public authentication endpoints into the API router.
func RegisterPublicRoutes(api *gin.RouterGroup, authService *authservice.Service, frontendURL string, secureCookies bool) {
	h := &handler{authService: authService, frontendURL: frontendURL, secureCookies: secureCookies}
	api.POST("/auth/login", h.login)
	api.POST("/auth/register", h.register)
	api.POST("/auth/forgot-password", h.forgotPassword)
	api.POST("/auth/confirm", h.confirm)
	api.POST("/auth/logout", h.logout)
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
	setSessionCookies(c, result.AccessToken, result.RefreshToken, maxAgeFromExpiresIn(result.ExpiresIn), h.secureCookies)
	c.JSON(http.StatusOK, gin.H{
		"message":          "login successful",
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
	setSessionCookies(c, result.AccessToken, result.RefreshToken, maxAgeFromExpiresIn(result.ExpiresIn), h.secureCookies)
	c.JSON(http.StatusCreated, gin.H{
		"message":          "registration successful",
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
	setSessionCookies(c, result.AccessToken, result.RefreshToken, maxAgeFromExpiresIn(result.ExpiresIn), h.secureCookies)
	c.JSON(http.StatusOK, gin.H{
		"message": "account verification successful",
	})
}

func (h *handler) resetPassword(c *gin.Context) {
	var request resetPasswordRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	accessToken := bearerToken(c.GetHeader("Authorization"))
	if accessToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
		return
	}
	if err := h.authService.UpdatePassword(c.Request.Context(), accessToken, request.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
}

func bearerToken(header string) string {
	value := strings.TrimSpace(header)
	if !strings.HasPrefix(strings.ToLower(value), "bearer ") {
		return ""
	}
	return strings.TrimSpace(value[len("bearer "):])
}

func (h *handler) logout(c *gin.Context) {
	clearSessionCookies(c, h.secureCookies)
	c.JSON(http.StatusOK, gin.H{"message": "logout successful"})
}

func setSessionCookies(c *gin.Context, accessToken, refreshToken string, accessMaxAge int, secure bool) {
	setCookie(c, accessTokenCookieName, accessToken, accessMaxAge, secure)
	setCookie(c, refreshTokenCookieName, refreshToken, refreshTokenMaxAge, secure)
}

func clearSessionCookies(c *gin.Context, secure bool) {
	setCookie(c, accessTokenCookieName, "", -1, secure)
	setCookie(c, refreshTokenCookieName, "", -1, secure)
}

func setCookie(c *gin.Context, name, value string, maxAge int, secure bool) {
		http.SetCookie(c.Writer, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteNoneMode,
	})
}

func maxAgeFromExpiresIn(expiresIn int64) int {
	if expiresIn <= 0 {
		return 3600
	}
	return int(expiresIn)
}
