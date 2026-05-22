package httpadapter

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	apartmentservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment/service"
	authservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/service"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/httpauth"
	profileservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile/service"
)

type handler struct {
	authService      *authservice.Service
	profileService   *profileservice.Service
	apartmentService *apartmentservice.Service
}

type createApartmentRequest struct {
	Title         string   `json:"title"`
	Description   string   `json:"description"`
	Address       string   `json:"address"`
	Area          string   `json:"area"`
	TotalSpots    int      `json:"total_spots"`
	Bathrooms     int      `json:"bathrooms"`
	BaseRent      int      `json:"base_rent"`
	AvailableFrom string   `json:"available_from"`
	ImageURLs     []string `json:"image_urls"`
}

type ownerApartmentResponse struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	Address       string `json:"address"`
	Area          string `json:"area"`
	TotalSpots    int    `json:"total_spots"`
	OccupiedSpots int    `json:"occupied_spots"`
	BaseRent      int    `json:"base_rent"`
	Status        string `json:"status"`
	CreatedAt     string `json:"created_at"`
	ImageURL      string `json:"image_url"`
}

type tenantApartmentResponse struct {
	ID             string `json:"id"`
	Title          string `json:"title"`
	Address        string `json:"address"`
	Area           string `json:"area"`
	TotalSpots     int    `json:"total_spots"`
	AvailableSpots int    `json:"available_spots"`
	BaseRent       int    `json:"base_rent"`
	Status         string `json:"status"`
	CreatedAt      string `json:"created_at"`
	ImageURL       string `json:"image_url"`
}

// RegisterRoutes wires apartment endpoints into the API router.
func RegisterRoutes(api *gin.RouterGroup, authService *authservice.Service, profileService *profileservice.Service, apartmentService *apartmentservice.Service) {
	h := &handler{authService: authService, profileService: profileService, apartmentService: apartmentService}
	api.GET("/apartments", h.listAvailableApartments)
	api.GET("/owner/apartments", h.listOwnerApartments)
	api.POST("/apartments", h.createApartment)
}

func (h *handler) listAvailableApartments(c *gin.Context) {
	apartments, err := h.apartmentService.ListAvailableApartments(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load apartments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"apartments": tenantApartmentResponses(apartments)})
}

func (h *handler) createApartment(c *gin.Context) {
	ownerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	input, ok := bindAndValidateApartmentInput(c)
	if !ok {
		return
	}

	result, err := h.apartmentService.CreateApartment(c.Request.Context(), ownerID, role, input)
	if err != nil {
		if errors.Is(err, apartmentservice.ErrOwnerRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "apartment publication is only available for owner users"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":       "apartment published successfully",
		"apartment_id":  result.ApartmentID,
		"images_stored": result.ImagesStored,
	})
}

func (h *handler) listOwnerApartments(c *gin.Context) {
	ownerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	apartments, err := h.apartmentService.ListOwnerApartments(c.Request.Context(), ownerID, role)
	if err != nil {
		if errors.Is(err, apartmentservice.ErrOwnerRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "apartments are only available for owner users"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load owner apartments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"apartments": ownerApartmentResponses(apartments)})
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

func bindAndValidateApartmentInput(c *gin.Context) (apartment.CreateApartmentInput, bool) {
	var request createApartmentRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return apartment.CreateApartmentInput{}, false
	}
	input := apartmentInputFromRequest(request)

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

func apartmentInputFromRequest(request createApartmentRequest) apartment.CreateApartmentInput {
	return apartment.CreateApartmentInput{
		Title:         request.Title,
		Description:   request.Description,
		Address:       request.Address,
		Area:          request.Area,
		TotalSpots:    request.TotalSpots,
		Bathrooms:     request.Bathrooms,
		BaseRent:      request.BaseRent,
		AvailableFrom: request.AvailableFrom,
		ImageURLs:     request.ImageURLs,
	}
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

func ownerApartmentResponses(apartments []apartment.Apartment) []ownerApartmentResponse {
	responses := make([]ownerApartmentResponse, 0, len(apartments))
	for _, item := range apartments {
		responses = append(responses, ownerApartmentResponse{
			ID:            item.ID,
			Title:         item.Title,
			Address:       item.Address,
			Area:          item.Area,
			TotalSpots:    item.TotalSpots,
			OccupiedSpots: item.OccupiedSpots,
			BaseRent:      item.BaseRent,
			Status:        item.Status,
			CreatedAt:     item.CreatedAt,
			ImageURL:      item.ImageURL,
		})
	}
	return responses
}

func tenantApartmentResponses(apartments []apartment.Apartment) []tenantApartmentResponse {
	responses := make([]tenantApartmentResponse, 0, len(apartments))
	for _, item := range apartments {
		responses = append(responses, tenantApartmentResponse{
			ID:             item.ID,
			Title:          item.Title,
			Address:        item.Address,
			Area:           item.Area,
			TotalSpots:     item.TotalSpots,
			AvailableSpots: item.TotalSpots - item.OccupiedSpots,
			BaseRent:       item.BaseRent,
			Status:         item.Status,
			CreatedAt:      item.CreatedAt,
			ImageURL:       item.ImageURL,
		})
	}
	return responses
}
