package httpadapter

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	apartmentservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment/service"
)

type handler struct {
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
	Description    string `json:"description"`
	Address        string `json:"address"`
	Area           string `json:"area"`
	TotalSpots     int    `json:"total_spots"`
	AvailableSpots int    `json:"available_spots"`
	BaseRent       int    `json:"base_rent"`
	Status         string `json:"status"`
	CreatedAt      string `json:"created_at"`
	ImageURL       string `json:"image_url"`
	OwnerName      string `json:"owner_name"`
	Compatibility  int    `json:"compatibility_score"`
}

type tenantApartmentDetailResponse struct {
	Apartment                tenantApartmentResponse `json:"apartment"`
	CompatibilityReasons     []string                `json:"compatibility_reasons"`
	Rules                    apartmentRulesResponse  `json:"rules"`
	CurrentApplicationID     string                  `json:"current_application_id"`
	CurrentApplicationStatus string                  `json:"current_application_status"`
	CanApply                 bool                    `json:"can_apply"`
	CanCancel                bool                    `json:"can_cancel"`
}

type apartmentRulesResponse struct {
	SmokingAllowed         *bool  `json:"smoking_allowed"`
	PetsAllowed            *bool  `json:"pets_allowed"`
	MaxNoiseLevel          string `json:"max_noise_level"`
	CleanlinessExpectation string `json:"cleanliness_expectation"`
	PreferredSchedule      string `json:"preferred_schedule"`
}

// RegisterRoutes wires apartment endpoints into the API router.
func RegisterPublicRoutes(api *gin.RouterGroup, apartmentService *apartmentservice.Service) {
	h := &handler{apartmentService: apartmentService}
	api.GET("/apartments", h.listAvailableApartments)
}

func RegisterTenantRoutes(api *gin.RouterGroup, apartmentService *apartmentservice.Service) {
	h := &handler{apartmentService: apartmentService}
	api.GET("/apartments/:id", h.getApartmentDetail)
}

func RegisterOwnerRoutes(api *gin.RouterGroup, apartmentService *apartmentservice.Service) {
	h := &handler{apartmentService: apartmentService}
	api.GET("/owner/apartments", h.listOwnerApartments)
	api.POST("/apartments", h.createApartment)
}

func (h *handler) listAvailableApartments(c *gin.Context) {
	filters := apartment.ListApartmentsFilters{
		Query:             strings.TrimSpace(c.Query("q")),
		Area:              strings.TrimSpace(c.Query("area")),
		PriceMin:          parseIntQuery(c.Query("price_min")),
		PriceMax:          parseIntQuery(c.Query("price_max")),
		TotalRoomsMin:     parseIntQuery(c.Query("total_rooms_min")),
		TotalRoomsMax:     parseIntQuery(c.Query("total_rooms_max")),
		AvailableRoomsMin: parseIntQuery(c.Query("available_rooms_min")),
		AvailableRoomsMax: parseIntQuery(c.Query("available_rooms_max")),
		Availability:      strings.TrimSpace(c.Query("availability")),
		SortBy:            strings.TrimSpace(c.Query("sort_by")),
	}

	apartments, err := h.apartmentService.ListAvailableApartmentsFiltered(c.Request.Context(), filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load apartments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"apartments": tenantApartmentResponses(apartments)})
}

func parseIntQuery(raw string) int {
	value := strings.TrimSpace(raw)
	if value == "" {
		return 0
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0
	}
	return parsed
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

func (h *handler) getApartmentDetail(c *gin.Context) {
	tenantID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	apartmentID := strings.TrimSpace(c.Param("id"))
	if apartmentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "apartment id is required"})
		return
	}
	detail, err := h.apartmentService.GetApartmentDetailForTenant(c.Request.Context(), apartmentID, tenantID, role)
	if err != nil {
		if errors.Is(err, apartmentservice.ErrTenantRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "apartment detail is only available for tenant users"})
			return
		}
		if errors.Is(err, apartmentservice.ErrApartmentNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "apartment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load apartment detail"})
		return
	}

	c.JSON(http.StatusOK, tenantApartmentDetailResponse{
		Apartment: tenantApartmentResponse{
			ID:             detail.Apartment.ID,
			Title:          detail.Apartment.Title,
			Description:    detail.Apartment.Description,
			Address:        detail.Apartment.Address,
			Area:           detail.Apartment.Area,
			TotalSpots:     detail.Apartment.TotalSpots,
			AvailableSpots: detail.Apartment.TotalSpots - detail.Apartment.OccupiedSpots,
			BaseRent:       detail.Apartment.BaseRent,
			Status:         detail.Apartment.Status,
			CreatedAt:      detail.Apartment.CreatedAt,
			ImageURL:       detail.Apartment.ImageURL,
			OwnerName:      detail.Apartment.OwnerName,
			Compatibility:  detail.CompatibilityScore,
		},
		CompatibilityReasons: detail.CompatibilityReason,
		Rules: apartmentRulesResponse{
			SmokingAllowed:         detail.Rules.SmokingAllowed,
			PetsAllowed:            detail.Rules.PetsAllowed,
			MaxNoiseLevel:          detail.Rules.MaxNoiseLevel,
			CleanlinessExpectation: detail.Rules.CleanlinessExpectation,
			PreferredSchedule:      detail.Rules.PreferredSchedule,
		},
		CurrentApplicationID:     detail.CurrentApplicationID,
		CurrentApplicationStatus: detail.CurrentApplicationStatus,
		CanApply:                 detail.CanApply,
		CanCancel:                detail.CanCancel,
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
	userID := c.GetString("roomies.user_id")
	role := c.GetString("roomies.role")
	if userID == "" || role == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
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
			Description:    item.Description,
			Address:        item.Address,
			Area:           item.Area,
			TotalSpots:     item.TotalSpots,
			AvailableSpots: item.TotalSpots - item.OccupiedSpots,
			BaseRent:       item.BaseRent,
			Status:         item.Status,
			CreatedAt:      item.CreatedAt,
			ImageURL:       item.ImageURL,
			OwnerName:      item.OwnerName,
			Compatibility:  0,
		})
	}
	return responses
}
