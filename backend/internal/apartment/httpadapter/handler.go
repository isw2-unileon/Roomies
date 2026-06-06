package httpadapter

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	apartmentservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment/service"
)

type handler struct {
	apartmentService *apartmentservice.Service
}

type createApartmentRequest struct {
	Title           string   `json:"title"`
	Description     string   `json:"description"`
	Address         string   `json:"address"`
	Area            string   `json:"area"`
	TotalSpots      int      `json:"total_spots"`
	Bathrooms       int      `json:"bathrooms"`
	BaseRent        int      `json:"base_rent"`
	ImagePaths      []string `json:"image_paths"`
	Latitude        float64  `json:"latitude"`
	Longitude       float64  `json:"longitude"`
	SurfaceM2       int      `json:"surface_m2"`
	Floor           int      `json:"floor"`
	SmokingAllowed  *bool    `json:"smoking_allowed"`
	PetsAllowed     *bool    `json:"pets_allowed"`
	StudentsAllowed *bool    `json:"students_allowed"`
	Notes           string   `json:"notes"`
}

type ownerApartmentResponse struct {
	ID              string   `json:"id"`
	Title           string   `json:"title"`
	Description     string   `json:"description"`
	Address         string   `json:"address"`
	Area            string   `json:"area"`
	TotalSpots      int      `json:"total_spots"`
	OccupiedSpots   int      `json:"occupied_spots"`
	BaseRent        int      `json:"base_rent"`
	Status          string   `json:"status"`
	CreatedAt       string   `json:"created_at"`
	ImageURL        string   `json:"image_url"`
	ImageURLs       []string `json:"image_urls"`
	ImagePaths      []string `json:"image_paths"`
	Latitude        float64  `json:"latitude"`
	Longitude       float64  `json:"longitude"`
	Bathrooms       int      `json:"bathrooms"`
	SurfaceM2       int      `json:"surface_m2"`
	Floor           int      `json:"floor"`
	SmokingAllowed  *bool    `json:"smoking_allowed"`
	PetsAllowed     *bool    `json:"pets_allowed"`
	StudentsAllowed *bool    `json:"students_allowed"`
	Notes           string   `json:"notes"`
}

type tenantApartmentResponse struct {
	ID              string   `json:"id"`
	Title           string   `json:"title"`
	Description     string   `json:"description"`
	Address         string   `json:"address"`
	Area            string   `json:"area"`
	TotalSpots      int      `json:"total_spots"`
	AvailableSpots  int      `json:"available_spots"`
	BaseRent        int      `json:"base_rent"`
	Status          string   `json:"status"`
	CreatedAt       string   `json:"created_at"`
	ImageURL        string   `json:"image_url"`
	ImageURLs       []string `json:"image_urls"`
	ImagePaths      []string `json:"image_paths"`
	Compatibility   int      `json:"compatibility_score"`
	Latitude        float64  `json:"latitude"`
	Longitude       float64  `json:"longitude"`
	Bathrooms       int      `json:"bathrooms"`
	SurfaceM2       int      `json:"surface_m2"`
	Floor           int      `json:"floor"`
	SmokingAllowed  *bool    `json:"smoking_allowed"`
	PetsAllowed     *bool    `json:"pets_allowed"`
	StudentsAllowed *bool    `json:"students_allowed"`
	Notes           string   `json:"notes"`
}

type tenantApartmentDetailResponse struct {
	Apartment                tenantApartmentResponse `json:"apartment"`
	CompatibilityReasons     []string                `json:"compatibility_reasons"`
	CurrentApplicationID     string                  `json:"current_application_id"`
	CurrentApplicationStatus string                  `json:"current_application_status"`
	CanApply                 bool                    `json:"can_apply"`
	CanCancel                bool                    `json:"can_cancel"`
}

// RegisterPublicRoutes wires public apartment endpoints into the API router.
func RegisterPublicRoutes(api *gin.RouterGroup, apartmentService *apartmentservice.Service) {
	h := &handler{apartmentService: apartmentService}
	api.GET("/apartments", h.listAvailableApartments)
	api.GET("/apartments/map", h.listApartmentsByMap)
}

// RegisterTenantRoutes wires tenant apartment endpoints into the API router.
func RegisterTenantRoutes(api *gin.RouterGroup, apartmentService *apartmentservice.Service) {
	h := &handler{apartmentService: apartmentService}
	api.GET("/apartments/:id", h.getApartmentDetail)
	api.GET("/apartments/:id/tenants", h.listApartmentResidents)
}

// RegisterOwnerRoutes wires owner apartment endpoints into the API router.
func RegisterOwnerRoutes(api *gin.RouterGroup, apartmentService *apartmentservice.Service) {
	h := &handler{apartmentService: apartmentService}
	api.GET("/owner/apartments", h.listOwnerApartments)
	api.GET("/owner/apartments/:id", h.getOwnerApartment)
	api.PATCH("/owner/apartments/:id", h.updateOwnerApartment)
	api.POST("/owner/apartment-photos", h.uploadApartmentPhotos)
	api.POST("/apartments", h.createApartment)
	api.POST("/owner/apartments/:id/close", h.closeOwnerApartment)
	api.POST("/owner/apartments/:id/reopen", h.reopenOwnerApartment)
	api.GET("/owner/apartments/:id/tenants", h.listApartmentTenants)
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

func parseFloatQuery(raw string) (float64, error) {
	value := strings.TrimSpace(raw)
	if value == "" {
		return 0, errors.New("empty value")
	}
	parsed, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid float: %w", err)
	}
	return parsed, nil
}

func (h *handler) listApartmentsByMap(c *gin.Context) {
	lat, err := parseFloatQuery(c.Query("lat"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lat is required and must be a number"})
		return
	}
	lng, err := parseFloatQuery(c.Query("lng"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lng is required and must be a number"})
		return
	}
	radius, err := parseFloatQuery(c.Query("radius"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "radius is required and must be a number"})
		return
	}

	apartments, err := h.apartmentService.ListApartmentsInRadius(c.Request.Context(), lat, lng, radius)
	if err != nil {
		if errors.Is(err, apartmentservice.ErrInvalidMapParams) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load apartments by map"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"apartments": tenantApartmentResponses(apartments)})
}

func (h *handler) createApartment(c *gin.Context) {
	ownerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	input, ok := bindAndValidateApartmentInput(c, true)
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

func (h *handler) getOwnerApartment(c *gin.Context) {
	ownerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	apartmentID := strings.TrimSpace(c.Param("id"))
	if apartmentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "apartment id is required"})
		return
	}

	item, err := h.apartmentService.GetOwnerApartment(c.Request.Context(), ownerID, role, apartmentID)
	if err != nil {
		if errors.Is(err, apartmentservice.ErrOwnerRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "apartments are only available for owner users"})
			return
		}
		if errors.Is(err, apartmentservice.ErrApartmentNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "apartment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load owner apartment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"apartment": ownerApartmentResponseFrom(*item)})
}

func (h *handler) updateOwnerApartment(c *gin.Context) {
	ownerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	apartmentID := strings.TrimSpace(c.Param("id"))
	if apartmentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "apartment id is required"})
		return
	}
	input, ok := bindAndValidateApartmentInput(c, false)
	if !ok {
		return
	}

	item, err := h.apartmentService.UpdateOwnerApartment(c.Request.Context(), ownerID, role, apartmentID, input)
	if err != nil {
		if errors.Is(err, apartmentservice.ErrOwnerRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "apartments are only available for owner users"})
			return
		}
		if errors.Is(err, apartmentservice.ErrApartmentNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "apartment not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "apartment updated successfully",
		"apartment": ownerApartmentResponseFrom(*item),
	})
}

func (h *handler) closeOwnerApartment(c *gin.Context) {
	ownerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	apartmentID := strings.TrimSpace(c.Param("id"))
	if apartmentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "apartment id is required"})
		return
	}

	err := h.apartmentService.CloseOwnerApartment(c.Request.Context(), ownerID, role, apartmentID)
	if err != nil {
		if errors.Is(err, apartmentservice.ErrOwnerRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "apartments are only available for owner users"})
			return
		}
		if errors.Is(err, apartmentservice.ErrApartmentAlreadyClosed) {
			c.JSON(http.StatusConflict, gin.H{"error": "apartment is already closed"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not close apartment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "apartment closed successfully"})
}

func (h *handler) reopenOwnerApartment(c *gin.Context) {
	ownerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	apartmentID := strings.TrimSpace(c.Param("id"))
	if apartmentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "apartment id is required"})
		return
	}

	err := h.apartmentService.ReopenOwnerApartment(c.Request.Context(), ownerID, role, apartmentID)
	if err != nil {
		if errors.Is(err, apartmentservice.ErrOwnerRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "apartments are only available for owner users"})
			return
		}
		if errors.Is(err, apartmentservice.ErrApartmentNotClosed) {
			c.JSON(http.StatusConflict, gin.H{"error": "apartment is not closed"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not reopen apartment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "apartment reopened successfully"})
}

type apartmentTenantResponse struct {
	UserID    string `json:"user_id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
	JoinedAt  string `json:"joined_at"`
}

func (h *handler) listApartmentTenants(c *gin.Context) {
	ownerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	apartmentID := strings.TrimSpace(c.Param("id"))
	if apartmentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "apartment id is required"})
		return
	}

	tenants, err := h.apartmentService.ListApartmentTenants(c.Request.Context(), ownerID, role, apartmentID)
	if err != nil {
		if errors.Is(err, apartmentservice.ErrOwnerRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "apartments are only available for owner users"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load apartment tenants"})
		return
	}

	responses := make([]apartmentTenantResponse, 0, len(tenants))
	for _, t := range tenants {
		responses = append(responses, apartmentTenantResponse{
			UserID:    t.UserID,
			Name:      t.Name,
			Email:     t.Email,
			AvatarURL: t.AvatarURL,
			JoinedAt:  t.JoinedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"tenants": responses})
}

func (h *handler) listApartmentResidents(c *gin.Context) {
	apartmentID := strings.TrimSpace(c.Param("id"))
	if apartmentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "apartment id is required"})
		return
	}

	tenants, err := h.apartmentService.ListApartmentResidents(c.Request.Context(), apartmentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not load apartment residents"})
		return
	}

	responses := make([]apartmentTenantResponse, 0, len(tenants))
	for _, t := range tenants {
		responses = append(responses, apartmentTenantResponse{
			UserID:    t.UserID,
			Name:      t.Name,
			Email:     t.Email,
			AvatarURL: t.AvatarURL,
			JoinedAt:  t.JoinedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"tenants": responses})
}

func (h *handler) uploadApartmentPhotos(c *gin.Context) {
	ownerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	if err := c.Request.ParseMultipartForm(50 << 20); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid multipart form"})
		return
	}

	apartmentID := strings.TrimSpace(c.PostForm("apartment_id"))
	apartmentName := strings.TrimSpace(c.PostForm("apartment_name"))

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid multipart form"})
		return
	}
	formFiles := form.File["photos"]
	if len(formFiles) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "at least one photo is required"})
		return
	}

	files := make([]apartmentservice.UploadFile, 0, len(formFiles))
	for _, fh := range formFiles {
		data, err := fh.Open()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("could not read file %q", fh.Filename)})
			return
		}
		fileData, readErr := io.ReadAll(data)
		closeErr := data.Close()
		if readErr != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("could not read file %q", fh.Filename)})
			return
		}
		if closeErr != nil {
			// Closing the uploaded file failed — treat as internal error.
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("could not close file %q", fh.Filename)})
			return
		}
		files = append(files, apartmentservice.UploadFile{
			Filename:    fh.Filename,
			ContentType: fh.Header.Get("Content-Type"),
			Data:        fileData,
		})
	}

	results, err := h.apartmentService.UploadApartmentPhotos(c.Request.Context(), ownerID, role, apartmentID, apartmentName, files)
	if err != nil {
		if errors.Is(err, apartmentservice.ErrOwnerRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "apartment photos are only available for owner users"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"photos": results})
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
			ID:              detail.Apartment.ID,
			Title:           detail.Apartment.Title,
			Description:     detail.Apartment.Description,
			Address:         detail.Apartment.Address,
			Area:            detail.Apartment.Area,
			TotalSpots:      detail.Apartment.TotalSpots,
			AvailableSpots:  detail.Apartment.TotalSpots - detail.Apartment.OccupiedSpots,
			BaseRent:        detail.Apartment.BaseRent,
			Status:          detail.Apartment.Status,
			CreatedAt:       detail.Apartment.CreatedAt,
			ImageURL:        firstImageURL(detail.Apartment.ImageURLs),
			ImageURLs:       nonNilStrings(detail.Apartment.ImageURLs),
			ImagePaths:      nonNilStrings(detail.Apartment.ImagePaths),
			Compatibility:   detail.CompatibilityScore,
			Latitude:        detail.Apartment.Latitude,
			Longitude:       detail.Apartment.Longitude,
			Bathrooms:       detail.Apartment.Bathrooms,
			SurfaceM2:       detail.Apartment.SurfaceM2,
			Floor:           detail.Apartment.Floor,
			SmokingAllowed:  detail.Apartment.SmokingAllowed,
			PetsAllowed:     detail.Apartment.PetsAllowed,
			StudentsAllowed: detail.Apartment.StudentsAllowed,
			Notes:           detail.Apartment.Notes,
		},
		CompatibilityReasons:     detail.CompatibilityReason,
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

func bindAndValidateApartmentInput(c *gin.Context, requirePublishOnlyFields bool) (apartment.CreateApartmentInput, bool) {
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
	if requirePublishOnlyFields && input.Bathrooms <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bathrooms must be greater than zero"})
		return apartment.CreateApartmentInput{}, false
	}
	if input.BaseRent <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "base_rent must be greater than zero"})
		return apartment.CreateApartmentInput{}, false
	}
	normalizeApartmentInput(&input)
	return input, true
}

func apartmentInputFromRequest(request createApartmentRequest) apartment.CreateApartmentInput {
	return apartment.CreateApartmentInput{
		Title:           request.Title,
		Description:     request.Description,
		Address:         request.Address,
		Area:            request.Area,
		TotalSpots:      request.TotalSpots,
		Bathrooms:       request.Bathrooms,
		BaseRent:        request.BaseRent,
		ImagePaths:      request.ImagePaths,
		Latitude:        request.Latitude,
		Longitude:       request.Longitude,
		SurfaceM2:       request.SurfaceM2,
		Floor:           request.Floor,
		SmokingAllowed:  request.SmokingAllowed,
		PetsAllowed:     request.PetsAllowed,
		StudentsAllowed: request.StudentsAllowed,
		Notes:           request.Notes,
	}
}

func normalizeApartmentInput(input *apartment.CreateApartmentInput) {
	input.Title = strings.TrimSpace(input.Title)
	input.Description = strings.TrimSpace(input.Description)
	input.Address = strings.TrimSpace(input.Address)
	input.Area = strings.TrimSpace(input.Area)
	cleanPaths := make([]string, 0, len(input.ImagePaths))
	for _, imagePath := range input.ImagePaths {
		trimmed := strings.TrimSpace(imagePath)
		if trimmed == "" {
			continue
		}
		cleanPaths = append(cleanPaths, trimmed)
	}
	input.ImagePaths = cleanPaths
}

func ownerApartmentResponses(apartments []apartment.Apartment) []ownerApartmentResponse {
	responses := make([]ownerApartmentResponse, 0, len(apartments))
	for _, item := range apartments {
		responses = append(responses, ownerApartmentResponseFrom(item))
	}
	return responses
}

func ownerApartmentResponseFrom(item apartment.Apartment) ownerApartmentResponse {
	imagePaths := nonNilStrings(item.ImagePaths)
	imageURLs := nonNilStrings(item.ImageURLs)
	return ownerApartmentResponse{
		ID:              item.ID,
		Title:           item.Title,
		Description:     item.Description,
		Address:         item.Address,
		Area:            item.Area,
		TotalSpots:      item.TotalSpots,
		OccupiedSpots:   item.OccupiedSpots,
		BaseRent:        item.BaseRent,
		Status:          item.Status,
		CreatedAt:       item.CreatedAt,
		ImageURL:        firstImageURL(imageURLs),
		ImageURLs:       imageURLs,
		ImagePaths:      imagePaths,
		Latitude:        item.Latitude,
		Longitude:       item.Longitude,
		Bathrooms:       item.Bathrooms,
		SurfaceM2:       item.SurfaceM2,
		Floor:           item.Floor,
		SmokingAllowed:  item.SmokingAllowed,
		PetsAllowed:     item.PetsAllowed,
		StudentsAllowed: item.StudentsAllowed,
		Notes:           item.Notes,
	}
}

func tenantApartmentResponses(apartments []apartment.Apartment) []tenantApartmentResponse {
	responses := make([]tenantApartmentResponse, 0, len(apartments))
	for _, item := range apartments {
		imageURLs := nonNilStrings(item.ImageURLs)
		responses = append(responses, tenantApartmentResponse{
			ID:              item.ID,
			Title:           item.Title,
			Description:     item.Description,
			Address:         item.Address,
			Area:            item.Area,
			TotalSpots:      item.TotalSpots,
			AvailableSpots:  item.TotalSpots - item.OccupiedSpots,
			BaseRent:        item.BaseRent,
			Status:          item.Status,
			CreatedAt:       item.CreatedAt,
			ImageURL:        firstImageURL(imageURLs),
			ImageURLs:       imageURLs,
			ImagePaths:      nonNilStrings(item.ImagePaths),
			Compatibility:   0,
			Latitude:        item.Latitude,
			Longitude:       item.Longitude,
			Bathrooms:       item.Bathrooms,
			SurfaceM2:       item.SurfaceM2,
			Floor:           item.Floor,
			SmokingAllowed:  item.SmokingAllowed,
			PetsAllowed:     item.PetsAllowed,
			StudentsAllowed: item.StudentsAllowed,
			Notes:           item.Notes,
		})
	}
	return responses
}

func firstImageURL(imageURLs []string) string {
	if len(imageURLs) == 0 {
		return ""
	}
	return imageURLs[0]
}

func nonNilStrings(values []string) []string {
	if values == nil {
		return []string{}
	}
	return values
}
