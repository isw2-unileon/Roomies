package httpadapter

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	applicationservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/application/service"
)

type handler struct {
	applicationService *applicationservice.Service
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

// RegisterRoutes wires application endpoints into the API router.
func RegisterTenantRoutes(api *gin.RouterGroup, applicationService *applicationservice.Service) {
	h := &handler{applicationService: applicationService}
	api.POST("/apartments/:id/applications", h.applyToApartment)
	api.POST("/applications/:id/cancel", h.cancelTenantApplication)
	api.GET("/apartments/:id/interested", h.listInterestedTenants)
	api.GET("/tenant/applications", h.listTenantApplications)
}

func RegisterOwnerRoutes(*gin.RouterGroup, *applicationservice.Service) {
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
	applicationID, err := h.applicationService.ApplyToApartment(c.Request.Context(), apartmentID, tenantID, role)
	if err != nil {
		if errors.Is(err, applicationservice.ErrTenantRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "apartment applications are only available for tenant users"})
			return
		}
		if errors.Is(err, applicationservice.ErrApartmentNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "apartment not found"})
			return
		}
		if errors.Is(err, applicationservice.ErrApartmentFull) {
			c.JSON(http.StatusConflict, gin.H{"error": "apartment is full"})
			return
		}
		if errors.Is(err, applicationservice.ErrApplicationAlreadyExists) {
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
	interested, err := h.applicationService.ListInterestedTenants(c.Request.Context(), apartmentID)
	if err != nil {
		if errors.Is(err, applicationservice.ErrApartmentNotFound) {
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
	err := h.applicationService.CancelTenantApplication(c.Request.Context(), applicationID, tenantID, role)
	if err != nil {
		if errors.Is(err, applicationservice.ErrTenantRequired) {
			c.JSON(http.StatusForbidden, gin.H{"error": "applications are only available for tenant users"})
			return
		}
		if errors.Is(err, applicationservice.ErrApplicationNotCancelable) {
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
	applications, err := h.applicationService.ListTenantApplications(c.Request.Context(), tenantID, role)
	if err != nil {
		if errors.Is(err, applicationservice.ErrTenantRequired) {
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

func (h *handler) resolveUserAndRole(c *gin.Context) (string, string, bool) {
	userID := c.GetString("roomies.user_id")
	role := c.GetString("roomies.role")
	if userID == "" || role == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "authentication required"})
		return "", "", false
	}
	return userID, role, true
}
