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

type applyApartmentResponse struct {
	ApplicationID string `json:"application_id"`
	Status        string `json:"status"`
}

type interestedTenantResponse struct {
	UserID        string `json:"user_id"`
	Name          string `json:"name"`
	Age           int    `json:"age"`
	Studies       string `json:"studies"`
	AvatarURL     string `json:"avatar_url"`
	Compatibility int    `json:"compatibility"`
}

type tenantApplicationResponse struct {
	ID            string `json:"id"`
	ApartmentID   string `json:"apartment_id"`
	PropertyTitle string `json:"property_title"`
	OwnerName     string `json:"owner_name"`
	Address       string `json:"address"`
	ImageURL      string `json:"image_url"`
	Places        int    `json:"places"`
	Size          int    `json:"size"`
	Bathrooms     int    `json:"bathrooms"`
	Status        string `json:"status"`
	CreatedAt     string `json:"created_at"`
	DateLabel     string `json:"date_label"`
	Compatibility int    `json:"compatibility"`
	RequestType   string `json:"request_type"`
	StatusMessage string `json:"status_message"`
}

// RegisterRoutes wires apartment endpoints into the API router.
func RegisterRoutes(api *gin.RouterGroup, authService *authservice.Service, profileService *profileservice.Service, apartmentService *apartmentservice.Service) {
	h := &handler{authService: authService, profileService: profileService, apartmentService: apartmentService}
	api.GET("/apartments", h.listAvailableApartments)
	api.GET("/apartments/:id", h.getApartmentDetail)
	api.POST("/apartments/:id/applications", h.applyToApartment)
	api.POST("/applications/:id/cancel", h.cancelTenantApplication)
	api.GET("/apartments/:id/interested", h.listInterestedTenants)
	api.GET("/tenant/applications", h.listTenantApplications)
	api.GET("/owner/apartments", h.listOwnerApartments)
	api.POST("/apartments", h.createApartment)
}

func (h *handler) listAvailableApartments(c *gin.Context) {
	filters := apartment.ListApartmentsFilters{
		Query:             strings.TrimSpace(c.Query("q")),
		Area:              strings.TrimSpace(c.Query("area")),
		PriceMin:          parseIntQuery(c.Query("price_min"), 0),
		PriceMax:          parseIntQuery(c.Query("price_max"), 0),
		TotalRoomsMin:     parseIntQuery(c.Query("total_rooms_min"), 0),
		TotalRoomsMax:     parseIntQuery(c.Query("total_rooms_max"), 0),
		AvailableRoomsMin: parseIntQuery(c.Query("available_rooms_min"), 0),
		AvailableRoomsMax: parseIntQuery(c.Query("available_rooms_max"), 0),
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

func parseIntQuery(raw string, fallback int) int {
	value := strings.TrimSpace(raw)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
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

func (h *handler) applyToApartment(c *gin.Context) {
	tenantID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	apartmentID := strings.TrimSpace(c.Param("id"))
	if apartmentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "apartment id is required"})
		return
	}
	applicationID, err := h.apartmentService.ApplyToApartment(c.Request.Context(), apartmentID, tenantID, role)
	if err != nil {
		if errors.Is(err, apartmentservice.ErrTenantRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "apartment applications are only available for tenant users"})
			return
		}
		if errors.Is(err, apartmentservice.ErrApartmentNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "apartment not found"})
			return
		}
		if errors.Is(err, apartmentservice.ErrApartmentFull) {
			c.JSON(http.StatusConflict, gin.H{"error": "apartment is full"})
			return
		}
		if errors.Is(err, apartmentservice.ErrApplicationAlreadyExists) {
			c.JSON(http.StatusConflict, gin.H{"error": "application already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create application"})
		return
	}
	c.JSON(http.StatusCreated, applyApartmentResponse{ApplicationID: applicationID, Status: "pending"})
}

func (h *handler) listInterestedTenants(c *gin.Context) {
	apartmentID := strings.TrimSpace(c.Param("id"))
	if apartmentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "apartment id is required"})
		return
	}
	interested, err := h.apartmentService.ListInterestedTenants(c.Request.Context(), apartmentID)
	if err != nil {
		if errors.Is(err, apartmentservice.ErrApartmentNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "apartment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load interested tenants"})
		return
	}
	response := make([]interestedTenantResponse, 0, len(interested))
	for _, item := range interested {
		response = append(response, interestedTenantResponse{
			UserID:        item.UserID,
			Name:          item.Name,
			Age:           item.Age,
			Studies:       item.Studies,
			AvatarURL:     item.AvatarURL,
			Compatibility: item.Compatibility,
		})
	}
	c.JSON(http.StatusOK, gin.H{"tenants": response})
}

func (h *handler) cancelTenantApplication(c *gin.Context) {
	tenantID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	applicationID := strings.TrimSpace(c.Param("id"))
	if applicationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "application id is required"})
		return
	}
	err := h.apartmentService.CancelTenantApplication(c.Request.Context(), applicationID, tenantID, role)
	if err != nil {
		if errors.Is(err, apartmentservice.ErrTenantRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "applications are only available for tenant users"})
			return
		}
		if errors.Is(err, apartmentservice.ErrApplicationNotCancelable) {
			c.JSON(http.StatusConflict, gin.H{"error": "application is not cancelable"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not cancel application"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "application cancelled"})
}

func (h *handler) listTenantApplications(c *gin.Context) {
	tenantID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	applications, err := h.apartmentService.ListTenantApplications(c.Request.Context(), tenantID, role)
	if err != nil {
		if errors.Is(err, apartmentservice.ErrTenantRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "applications are only available for tenant users"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load tenant applications"})
		return
	}
	response := make([]tenantApplicationResponse, 0, len(applications))
	for _, item := range applications {
		response = append(response, tenantApplicationResponse{
			ID:            item.ID,
			ApartmentID:   item.ApartmentID,
			PropertyTitle: item.PropertyTitle,
			OwnerName:     item.OwnerName,
			Address:       item.Address,
			ImageURL:      item.ImageURL,
			Places:        item.Places,
			Size:          item.Size,
			Bathrooms:     item.Bathrooms,
			Status:        item.Status,
			CreatedAt:     item.CreatedAt,
			DateLabel:     item.DateLabel,
			Compatibility: item.CompatibilityScore,
			RequestType:   item.RequestType,
			StatusMessage: item.StatusMessage,
		})
	}
	c.JSON(http.StatusOK, gin.H{"applications": response})
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
