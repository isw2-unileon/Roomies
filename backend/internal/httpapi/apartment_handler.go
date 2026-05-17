package httpapi

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	apartmentservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment/service"
	authservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/service"
	profileservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile/service"
)

type apartmentHandler struct {
	authService      *authservice.Service
	profileService   *profileservice.Service
	apartmentService *apartmentservice.Service
}

func newApartmentHandler(authService *authservice.Service, profileService *profileservice.Service, apartmentService *apartmentservice.Service) *apartmentHandler {
	return &apartmentHandler{
		authService:      authService,
		profileService:   profileService,
		apartmentService: apartmentService,
	}
}

func (h *apartmentHandler) createApartment(c *gin.Context) {
	ownerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	if role != "owner" {
		c.JSON(http.StatusForbidden, gin.H{"error": "apartment publication is only available for owner users"})
		return
	}

	input, ok := bindAndValidateApartmentInput(c)
	if !ok {
		return
	}

	result, err := h.apartmentService.CreateApartment(c.Request.Context(), ownerID, input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":       "apartment published successfully",
		"apartment_id":  result.ApartmentID,
		"images_stored": result.ImagesStored,
	})
}

func (h *apartmentHandler) resolveUserAndRole(c *gin.Context) (string, string, bool) {
	accessToken, err := extractBearerToken(c.GetHeader("Authorization"))
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

func bindAndValidateApartmentInput(c *gin.Context) (apartment.CreateApartmentInput, bool) {
	var input apartment.CreateApartmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return apartment.CreateApartmentInput{}, false
	}

	if strings.TrimSpace(input.Title) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
		return apartment.CreateApartmentInput{}, false
	}
	if strings.TrimSpace(input.Address) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "address is required"})
		return apartment.CreateApartmentInput{}, false
	}
	if input.TotalSpots <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "total_spots must be greater than zero"})
		return apartment.CreateApartmentInput{}, false
	}
	if input.Bathrooms <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bathrooms must be greater than zero"})
		return apartment.CreateApartmentInput{}, false
	}
	if input.BaseRent <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "base_rent must be greater than zero"})
		return apartment.CreateApartmentInput{}, false
	}
	if strings.TrimSpace(input.AvailableFrom) != "" {
		if _, err := time.Parse("2006-01-02", input.AvailableFrom); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "available_from must have YYYY-MM-DD format"})
			return apartment.CreateApartmentInput{}, false
		}
	}

	normalizeApartmentInput(&input)
	return input, true
}

func normalizeApartmentInput(input *apartment.CreateApartmentInput) {
	input.Title = strings.TrimSpace(input.Title)
	input.Description = strings.TrimSpace(input.Description)
	input.Address = strings.TrimSpace(input.Address)
	input.Area = strings.TrimSpace(input.Area)
	input.AvailableFrom = strings.TrimSpace(input.AvailableFrom)
	cleanURLs := make([]string, 0, len(input.ImageURLs))
	for _, imageURL := range input.ImageURLs {
		trimmed := strings.TrimSpace(imageURL)
		if trimmed == "" {
			continue
		}
		cleanURLs = append(cleanURLs, trimmed)
	}
	input.ImageURLs = cleanURLs
}
