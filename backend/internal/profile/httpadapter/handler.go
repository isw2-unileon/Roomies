package httpadapter

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	authservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/service"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/httpauth"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
	profileservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile/service"
)

type handler struct {
	authService    *authservice.Service
	profileService *profileservice.Service
}

type tenantProfileRequest struct {
	BudgetMin        int    `json:"budget_min"`
	BudgetMax        int    `json:"budget_max"`
	PreferredArea    string `json:"preferred_area"`
	MoveInDate       string `json:"move_in_date"`
	Pets             bool   `json:"pets"`
	Smoking          bool   `json:"smoking"`
	NoiseLevel       string `json:"noise_level"`
	Cleanliness      string `json:"cleanliness"`
	WorkSchedule     string `json:"work_schedule"`
	SleepSchedule    string `json:"sleep_schedule,omitempty"`
	SocialLifestyle  string `json:"social_lifestyle,omitempty"`
	StudyHabits      string `json:"study_habits,omitempty"`
	Language         string `json:"language,omitempty"`
	University       string `json:"university,omitempty"`
	Age              int    `json:"age,omitempty"`
	GuestPreferences string `json:"guest_preferences,omitempty"`
	PartyFrequency   string `json:"party_frequency,omitempty"`
}

// RegisterRoutes wires profile endpoints into the API router.
func RegisterRoutes(api *gin.RouterGroup, authService *authservice.Service, profileService *profileservice.Service) {
	h := &handler{authService: authService, profileService: profileService}
	api.GET("/profile/status", h.status)
	api.POST("/tenant-profile", h.saveTenantProfile)
}

func (h *handler) status(c *gin.Context) {
	accessToken, err := httpauth.ExtractBearerToken(c.GetHeader("Authorization"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	userID, err := h.authService.ResolveUserIDFromAccessToken(c.Request.Context(), accessToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	role, err := h.profileService.LookupRoleByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	needsTenantProfile, err := h.profileService.NeedsTenantProfile(c.Request.Context(), userID, role)
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
}

func (h *handler) saveTenantProfile(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	input, ok := bindAndValidateTenantProfile(c)
	if !ok {
		return
	}
	normalizeTenantProfileInput(&input)
	if err := h.profileService.SaveTenantProfile(c.Request.Context(), userID, role, input); err != nil {
		if errors.Is(err, profileservice.ErrTenantRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "tenant profile is only available for tenant users"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save tenant profile"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "tenant profile saved", "onboarding_complete": true})
}

func (h *handler) resolveUserAndRole(c *gin.Context) (string, string, bool) {
	accessToken, err := httpauth.ExtractBearerToken(c.GetHeader("Authorization"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return "", "", false
	}
	userID, err := h.authService.ResolveUserIDFromAccessToken(c.Request.Context(), accessToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return "", "", false
	}
	role, err := h.profileService.LookupRoleByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return "", "", false
	}
	return userID, role, true
}

func bindAndValidateTenantProfile(c *gin.Context) (profile.TenantProfileInput, bool) {
	var request tenantProfileRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return profile.TenantProfileInput{}, false
	}
	input := tenantProfileInputFromRequest(request)
	if ok := validateTenantProfileBasic(c, input); !ok {
		return profile.TenantProfileInput{}, false
	}
	if ok := validateTenantProfileEnums(c, input); !ok {
		return profile.TenantProfileInput{}, false
	}
	return input, true
}

func tenantProfileInputFromRequest(request tenantProfileRequest) profile.TenantProfileInput {
	return profile.TenantProfileInput{
		BudgetMin:        request.BudgetMin,
		BudgetMax:        request.BudgetMax,
		PreferredArea:    request.PreferredArea,
		MoveInDate:       request.MoveInDate,
		Pets:             request.Pets,
		Smoking:          request.Smoking,
		NoiseLevel:       request.NoiseLevel,
		Cleanliness:      request.Cleanliness,
		WorkSchedule:     request.WorkSchedule,
		SleepSchedule:    request.SleepSchedule,
		SocialLifestyle:  request.SocialLifestyle,
		StudyHabits:      request.StudyHabits,
		Language:         request.Language,
		University:       request.University,
		Age:              request.Age,
		GuestPreferences: request.GuestPreferences,
		PartyFrequency:   request.PartyFrequency,
	}
}

func validateTenantProfileBasic(c *gin.Context, input profile.TenantProfileInput) bool {
	if input.BudgetMin <= 0 || input.BudgetMax <= 0 || input.BudgetMin > input.BudgetMax {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid budget range"})
		return false
	}
	if strings.TrimSpace(input.PreferredArea) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "preferred_area is required"})
		return false
	}
	if _, err := time.Parse("2006-01-02", input.MoveInDate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "move_in_date must have YYYY-MM-DD format"})
		return false
	}
	return true
}

func validateTenantProfileEnums(c *gin.Context, input profile.TenantProfileInput) bool {
	workSchedule := strings.ToLower(strings.TrimSpace(input.WorkSchedule))
	if workSchedule != "morning" && workSchedule != "night" && workSchedule != "flexible" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "work_schedule must be morning, night or flexible"})
		return false
	}
	noiseLevel := strings.ToLower(strings.TrimSpace(input.NoiseLevel))
	if noiseLevel != "quiet" && noiseLevel != "moderate" && noiseLevel != "loud" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "noise_level must be quiet, moderate or loud"})
		return false
	}
	cleanliness := strings.ToLower(strings.TrimSpace(input.Cleanliness))
	if cleanliness != "very_clean" && cleanliness != "normal" && cleanliness != "relaxed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cleanliness must be very_clean, normal or relaxed"})
		return false
	}
	return true
}

func normalizeTenantProfileInput(input *profile.TenantProfileInput) {
	input.WorkSchedule = strings.ToLower(strings.TrimSpace(input.WorkSchedule))
	input.NoiseLevel = strings.ToLower(strings.TrimSpace(input.NoiseLevel))
	input.Cleanliness = strings.ToLower(strings.TrimSpace(input.Cleanliness))
	input.PreferredArea = strings.TrimSpace(input.PreferredArea)
}
