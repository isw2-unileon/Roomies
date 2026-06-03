package httpadapter

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
	profileservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile/service"
)

type handler struct {
	profileService *profileservice.Service
}

type tenantProfileRequest struct {
	BudgetMax     int    `json:"budget_max"`
	PreferredArea string `json:"preferred_area"`
	Pets          bool   `json:"pets"`
	Smoking       bool   `json:"smoking"`
	Age           int    `json:"age"`
	Sex           string `json:"sex"`
	Situation     string `json:"situation"`
	Degree        string `json:"degree,omitempty"`
	Profession    string `json:"profession,omitempty"`
	Socialization string `json:"socialization_level"`
	Nightlife     string `json:"nightlife_level"`
}

type tenantPersonalProfileRequest struct {
	FullName  string `json:"full_name"`
	AvatarURL string `json:"avatar_url"`
}

// RegisterRoutes wires profile endpoints into the API router.
func RegisterRoutes(api *gin.RouterGroup, profileService *profileservice.Service) {
	h := &handler{profileService: profileService}
	api.GET("/profile/status", h.status)
	api.POST("/tenant-profile", h.saveTenantProfile)
	api.GET("/tenant-profile/personal", h.getTenantPersonalProfile)
	api.PUT("/tenant-profile/personal", h.saveTenantPersonalProfile)
	api.POST("/tenant-profile/avatar", h.uploadTenantAvatar)
	api.GET("/tenant-profile/:userId", h.getTenantProfileByUserID)
}

func (h *handler) status(c *gin.Context) {
	userID, role, ok := currentUserAndRole(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
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

func (h *handler) getTenantPersonalProfile(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	personalProfile, err := h.profileService.GetTenantPersonalProfile(c.Request.Context(), userID, role)
	if err != nil {
		if errors.Is(err, profileservice.ErrTenantRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "tenant profile is only available for tenant users"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load tenant personal profile"})
		return
	}
	if personalProfile == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tenant profile not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"user_id":    personalProfile.UserID,
		"full_name":  personalProfile.FullName,
		"email":      personalProfile.Email,
		"avatar_url": personalProfile.AvatarURL,
	})
}

func (h *handler) saveTenantPersonalProfile(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	var request tenantPersonalProfileRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	fullName := strings.TrimSpace(request.FullName)
	if len(fullName) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "full_name must be at least 2 characters"})
		return
	}
	avatarURL := strings.TrimSpace(request.AvatarURL)
	err := h.profileService.SaveTenantPersonalProfile(c.Request.Context(), userID, role, profile.TenantPersonalProfileInput{
		FullName:  fullName,
		AvatarURL: avatarURL,
	})
	if err != nil {
		if errors.Is(err, profileservice.ErrTenantRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "tenant profile is only available for tenant users"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save tenant personal profile"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "tenant personal profile saved"})
}

func (h *handler) uploadTenantAvatar(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	fileHeader, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "avatar file is required"})
		return
	}
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("could not read file %q", fileHeader.Filename)})
		return
	}
	fileData, readErr := io.ReadAll(file)
	closeErr := file.Close()
	if readErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("could not read file %q", fileHeader.Filename)})
		return
	}
	if closeErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("could not close file %q", fileHeader.Filename)})
		return
	}
	avatarURL, err := h.profileService.UploadTenantAvatar(c.Request.Context(), userID, role, fileHeader.Filename, fileHeader.Header.Get("Content-Type"), fileData)
	if err != nil {
		if errors.Is(err, profileservice.ErrTenantRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "tenant profile is only available for tenant users"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "tenant avatar uploaded", "avatar_url": avatarURL})
}

func (h *handler) getTenantProfileByUserID(c *gin.Context) {
	_, _, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	targetUserID := strings.TrimSpace(c.Param("userId"))
	if targetUserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user id is required"})
		return
	}
	p, err := h.profileService.GetTenantProfileByUserID(c.Request.Context(), targetUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load tenant profile"})
		return
	}
	if p == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "tenant profile not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"budget_max":          p.BudgetMax,
		"preferred_area":      p.PreferredArea,
		"pets":                p.Pets,
		"smoking":             p.Smoking,
		"age":                 p.Age,
		"sex":                 p.Sex,
		"situation":           p.Situation,
		"degree":              p.Degree,
		"profession":          p.Profession,
		"socialization_level": p.Socialization,
		"nightlife_level":     p.Nightlife,
	})
}

func (h *handler) resolveUserAndRole(c *gin.Context) (string, string, bool) {
	userID, role, ok := currentUserAndRole(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
		return "", "", false
	}
	return userID, role, true
}

func currentUserAndRole(c *gin.Context) (string, string, bool) {
	userID := c.GetString("roomies.user_id")
	role := c.GetString("roomies.role")
	return userID, role, userID != "" && role != ""
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
		BudgetMax:     request.BudgetMax,
		PreferredArea: request.PreferredArea,
		Pets:          request.Pets,
		Smoking:       request.Smoking,
		Age:           request.Age,
		Sex:           request.Sex,
		Situation:     request.Situation,
		Degree:        request.Degree,
		Profession:    request.Profession,
		Socialization: request.Socialization,
		Nightlife:     request.Nightlife,
	}
}

func validateTenantProfileBasic(c *gin.Context, input profile.TenantProfileInput) bool {
	if input.BudgetMax <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "budget_max must be greater than 0"})
		return false
	}
	if strings.TrimSpace(input.PreferredArea) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "preferred_area is required"})
		return false
	}
	if input.Age <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "age must be greater than 0"})
		return false
	}
	if strings.TrimSpace(input.Sex) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "sex is required"})
		return false
	}
	if strings.TrimSpace(input.Situation) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "situation is required"})
		return false
	}
	return true
}

func validateTenantProfileEnums(c *gin.Context, input profile.TenantProfileInput) bool {
	sex := strings.ToLower(strings.TrimSpace(input.Sex))
	if sex != "male" && sex != "female" && sex != "other" && sex != "prefer_not_to_say" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "sex must be male, female, other or prefer_not_to_say"})
		return false
	}
	situation := strings.ToLower(strings.TrimSpace(input.Situation))
	if situation != "student" && situation != "worker" && situation != "unemployed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "situation must be student, worker or unemployed"})
		return false
	}
	if situation == "student" && strings.TrimSpace(input.Degree) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "degree is required when situation is student"})
		return false
	}
	if situation == "worker" && strings.TrimSpace(input.Profession) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "profession is required when situation is worker"})
		return false
	}
	if !isTenantLevelValue(input.Socialization) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "socialization_level must be low, medium or high"})
		return false
	}
	if !isTenantLevelValue(input.Nightlife) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "nightlife_level must be low, medium or high"})
		return false
	}
	return true
}

func normalizeTenantProfileInput(input *profile.TenantProfileInput) {
	input.PreferredArea = strings.TrimSpace(input.PreferredArea)
	input.Sex = strings.ToLower(strings.TrimSpace(input.Sex))
	input.Situation = strings.ToLower(strings.TrimSpace(input.Situation))
	input.Degree = strings.TrimSpace(input.Degree)
	input.Profession = strings.TrimSpace(input.Profession)
	input.Socialization = strings.ToLower(strings.TrimSpace(input.Socialization))
	input.Nightlife = strings.ToLower(strings.TrimSpace(input.Nightlife))
	if input.Situation != "student" {
		input.Degree = ""
	}
	if input.Situation != "worker" {
		input.Profession = ""
	}
}

func isTenantLevelValue(value string) bool {
	level := strings.ToLower(strings.TrimSpace(value))
	return level == "low" || level == "medium" || level == "high"
}
