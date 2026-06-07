package httpadapter

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/application"
	applicationservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/application/service"
)

type handler struct {
	applicationService *applicationservice.Service
}

type applyApartmentResponse struct {
	ApplicationID string `json:"application_id"`
	Status        string `json:"status"`
	Created       bool   `json:"created,omitempty"`
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
	ID                 string                `json:"id"`
	ApartmentID        string                `json:"apartment_id"`
	PropertyTitle      string                `json:"property_title"`
	OwnerName          string                `json:"owner_name"`
	Address            string                `json:"address"`
	ImageURL           string                `json:"image_url"`
	Places             int                   `json:"places"`
	Size               int                   `json:"size"`
	Bathrooms          int                   `json:"bathrooms"`
	Status             string                `json:"status"`
	CreatedAt          string                `json:"created_at"`
	DateLabel          string                `json:"date_label"`
	Compatibility      int                   `json:"compatibility"`
	RequestType        string                `json:"request_type"`
	StatusMessage      string                `json:"status_message"`
	ApplicationType    string                `json:"application_type,omitempty"`
	IsGroupApplication bool                  `json:"is_group_application,omitempty"`
	GroupID            string                `json:"group_id,omitempty"`
	GroupName          string                `json:"group_name,omitempty"`
	SubmittedByUserID  string                `json:"submitted_by_user_id,omitempty"`
	SubmittedByName    string                `json:"submitted_by_name,omitempty"`
	GroupMembers       []groupMemberResponse `json:"group_members,omitempty"`
	CanCancel          bool                  `json:"can_cancel"`
}

type applicantResponse struct {
	UserID    string `json:"user_id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	AvatarURL string `json:"avatar_url"`
}

type groupMemberResponse struct {
	UserID             string `json:"user_id"`
	Name               string `json:"name"`
	Email              string `json:"email"`
	AvatarURL          string `json:"avatar_url"`
	CompatibilityScore int    `json:"compatibility_score"`
}

type groupDetailsResponse struct {
	GroupID string                `json:"group_id"`
	Name    string                `json:"name"`
	Creator applicantResponse     `json:"creator"`
	Members []groupMemberResponse `json:"members"`
}

type ownerApplicationResponse struct {
	ID                 string                `json:"id"`
	ApartmentID        string                `json:"apartment_id"`
	PropertyTitle      string                `json:"property_title"`
	Address            string                `json:"address"`
	Type               string                `json:"type"`
	Status             string                `json:"status"`
	CreatedAt          string                `json:"created_at"`
	Tenant             *applicantResponse    `json:"tenant,omitempty"`
	Group              *groupDetailsResponse `json:"group,omitempty"`
	CompatibilityScore int                   `json:"compatibility_score"`
}

// RegisterTenantRoutes wires tenant application endpoints into the API router.
func RegisterTenantRoutes(api *gin.RouterGroup, applicationService *applicationservice.Service) {
	h := &handler{applicationService: applicationService}
	api.POST("/apartments/:id/applications", h.applyToApartment)
	api.POST("/tenant/groups/:id/applications", h.applyGroupToAssignedApartment)
	api.POST("/applications/:id/cancel", h.cancelTenantApplication)
	api.POST("/applications/:id/leave", h.leaveAcceptedApartment)
	api.GET("/tenant/applications", h.listTenantApplications)
}

// RegisterOwnerRoutes wires owner application endpoints into the API router.
func RegisterOwnerRoutes(api *gin.RouterGroup, applicationService *applicationservice.Service) {
	h := &handler{applicationService: applicationService}
	api.GET("/owner/applications", h.listOwnerApplications)
	api.GET("/owner/applications/:id", h.getOwnerApplication)
	api.POST("/owner/applications/:id/approve", h.approveOwnerApplication)
	api.POST("/owner/applications/:id/reject", h.rejectOwnerApplication)
	api.POST("/owner/apartments/:id/tenants/:tenantID/remove", h.removeAcceptedTenant)
}

// RegisterSharedRoutes wires authenticated application endpoints available to multiple roles.
func RegisterSharedRoutes(api *gin.RouterGroup, applicationService *applicationservice.Service) {
	h := &handler{applicationService: applicationService}
	api.GET("/apartments/:id/interested", h.listInterestedTenants)
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
		if errors.Is(err, applicationservice.ErrApartmentClosed) {
			c.JSON(http.StatusConflict, gin.H{"error": "apartment is closed"})
			return
		}
		if errors.Is(err, applicationservice.ErrTenantInClosedApartment) {
			c.JSON(http.StatusConflict, gin.H{"error": "No puedes solicitar plaza en otros pisos porque ya perteneces a un piso cerrado."})
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

func (h *handler) applyGroupToAssignedApartment(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	groupID := strings.TrimSpace(c.Param("id"))
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group id is required"})
		return
	}

	applicationRecord, created, err := h.applicationService.ApplyGroupToAssignedApartment(c.Request.Context(), groupID, userID, role)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}
	if applicationRecord == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create group application"})
		return
	}

	statusCode := http.StatusOK
	if created {
		statusCode = http.StatusCreated
	}
	c.JSON(statusCode, applyApartmentResponse{ApplicationID: applicationRecord.ID, Status: applicationRecord.Status, Created: created})
}

func (h *handler) listInterestedTenants(c *gin.Context) {
	viewerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	apartmentID := strings.TrimSpace(c.Param("id"))
	if apartmentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "apartment id is required"})
		return
	}
	interested, err := h.applicationService.ListInterestedTenants(c.Request.Context(), apartmentID, viewerID, role)
	if err != nil {
		if errors.Is(err, applicationservice.ErrApartmentNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "apartment not found"})
			return
		}
		if errors.Is(err, applicationservice.ErrInterestedTenantsForbidden) {
			c.JSON(http.StatusForbidden, gin.H{"error": "interested tenants are not available for this user"})
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

func (h *handler) leaveAcceptedApartment(c *gin.Context) {
	tenantID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	applicationID := strings.TrimSpace(c.Param("id"))
	if applicationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "application id is required"})
		return
	}
	if err := h.applicationService.LeaveAcceptedApartment(c.Request.Context(), applicationID, tenantID, role); err != nil {
		h.handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "apartment left"})
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
		members := make([]groupMemberResponse, 0, len(item.GroupMembers))
		for _, member := range item.GroupMembers {
			members = append(members, groupMemberResponse{
				UserID:    member.UserID,
				Name:      member.Name,
				Email:     member.Email,
				AvatarURL: member.AvatarURL,
			})
		}
		response = append(response, tenantApplicationResponse{
			ID:                 item.ID,
			ApartmentID:        item.ApartmentID,
			PropertyTitle:      item.PropertyTitle,
			OwnerName:          item.OwnerName,
			Address:            item.Address,
			ImageURL:           item.ImageURL,
			Places:             item.Places,
			Size:               item.Size,
			Bathrooms:          item.Bathrooms,
			Status:             item.Status,
			CreatedAt:          item.CreatedAt,
			DateLabel:          item.DateLabel,
			Compatibility:      item.CompatibilityScore,
			RequestType:        item.RequestType,
			StatusMessage:      item.StatusMessage,
			ApplicationType:    item.Type,
			IsGroupApplication: strings.EqualFold(item.Type, "group"),
			GroupID:            item.GroupID,
			GroupName:          item.GroupName,
			SubmittedByUserID:  item.SubmittedByUserID,
			SubmittedByName:    item.SubmittedByName,
			GroupMembers:       members,
			CanCancel:          item.CanCancel,
		})
	}
	c.JSON(http.StatusOK, gin.H{"applications": response})
}

func (h *handler) listOwnerApplications(c *gin.Context) {
	ownerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	applications, err := h.applicationService.ListOwnerApplications(c.Request.Context(), ownerID, role)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	response := make([]ownerApplicationResponse, 0, len(applications))
	for _, item := range applications {
		response = append(response, ownerApplicationResponseFromDomain(item))
	}
	c.JSON(http.StatusOK, gin.H{"applications": response})
}

func (h *handler) getOwnerApplication(c *gin.Context) {
	ownerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	applicationID := strings.TrimSpace(c.Param("id"))
	if applicationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "application id is required"})
		return
	}

	item, err := h.applicationService.GetOwnerApplicationByID(c.Request.Context(), applicationID, ownerID, role)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"application": ownerApplicationResponseFromDomain(*item)})
}

func (h *handler) approveOwnerApplication(c *gin.Context) {
	h.respondOwnerApplicationDecision(c, h.applicationService.ApproveOwnerApplication, "application approved")
}

func (h *handler) rejectOwnerApplication(c *gin.Context) {
	h.respondOwnerApplicationDecision(c, h.applicationService.RejectOwnerApplication, "application rejected")
}

func (h *handler) removeAcceptedTenant(c *gin.Context) {
	ownerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	apartmentID := strings.TrimSpace(c.Param("id"))
	tenantID := strings.TrimSpace(c.Param("tenantID"))
	if apartmentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "apartment id is required"})
		return
	}
	if tenantID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tenant id is required"})
		return
	}
	if err := h.applicationService.RemoveAcceptedTenant(c.Request.Context(), apartmentID, tenantID, ownerID, role); err != nil {
		h.handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "tenant removed"})
}

func (h *handler) respondOwnerApplicationDecision(
	c *gin.Context,
	action func(ctx context.Context, applicationID, ownerID, role string) error,
	successMessage string,
) {
	ownerID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	applicationID := strings.TrimSpace(c.Param("id"))
	if applicationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "application id is required"})
		return
	}

	if err := action(c.Request.Context(), applicationID, ownerID, role); err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": successMessage})
}

type serviceErrorMapping struct {
	target  error
	status  int
	message string
}

var serviceErrorMappings = []serviceErrorMapping{
	{applicationservice.ErrTenantRequired, http.StatusForbidden, "applications are only available for tenant users"},
	{applicationservice.ErrOwnerRequired, http.StatusForbidden, "applications are only available for owner users"},
	{applicationservice.ErrApartmentNotFound, http.StatusNotFound, "apartment not found"},
	{applicationservice.ErrApartmentFull, http.StatusConflict, "apartment is full"},
	{applicationservice.ErrApplicationAlreadyExists, http.StatusConflict, "application already exists"},
	{applicationservice.ErrApartmentClosed, http.StatusConflict, "apartment is closed"},
	{applicationservice.ErrTenantInClosedApartment, http.StatusConflict, "tenant belongs to a closed apartment"},
	{applicationservice.ErrApplicationNotCancelable, http.StatusConflict, "application is not cancelable"},
	{applicationservice.ErrInterestedTenantsForbidden, http.StatusForbidden, "interested tenants are not available for this user"},
	{applicationservice.ErrGroupNotFound, http.StatusNotFound, "group not found"},
	{applicationservice.ErrGroupApplicationForbidden, http.StatusForbidden, "only the group creator can submit this request"},
	{applicationservice.ErrGroupNotReady, http.StatusConflict, "group is not fully accepted"},
	{applicationservice.ErrGroupApartmentRequired, http.StatusConflict, "group has no assigned apartment"},
	{applicationservice.ErrOwnerApplicationNotFound, http.StatusNotFound, "application not found"},
	{applicationservice.ErrOwnerApplicationAlreadyHandled, http.StatusConflict, "application is not pending owner review"},
	{applicationservice.ErrOwnerApplicationConflict, http.StatusConflict, "another group has already been accepted for this apartment"},
}

func (h *handler) handleServiceError(c *gin.Context, err error) {
	for _, mapping := range serviceErrorMappings {
		if errors.Is(err, mapping.target) {
			c.JSON(mapping.status, gin.H{"error": mapping.message})
			return
		}
	}
	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
}

func ownerApplicationResponseFromDomain(item application.OwnerApplication) ownerApplicationResponse {
	response := ownerApplicationResponse{
		ID:                 item.ID,
		ApartmentID:        item.ApartmentID,
		PropertyTitle:      item.PropertyTitle,
		Address:            item.Address,
		Type:               item.Type,
		Status:             item.Status,
		CreatedAt:          item.CreatedAt,
		CompatibilityScore: item.CompatibilityScore,
	}
	if item.Tenant != nil {
		response.Tenant = &applicantResponse{
			UserID:    item.Tenant.UserID,
			Name:      item.Tenant.Name,
			Email:     item.Tenant.Email,
			AvatarURL: item.Tenant.AvatarURL,
		}
	}
	if item.Group != nil {
		members := make([]groupMemberResponse, 0, len(item.Group.Members))
		for _, member := range item.Group.Members {
			members = append(members, groupMemberResponse{
				UserID:             member.UserID,
				Name:               member.Name,
				Email:              member.Email,
				AvatarURL:          member.AvatarURL,
				CompatibilityScore: member.CompatibilityScore,
			})
		}
		response.Group = &groupDetailsResponse{
			GroupID: item.Group.GroupID,
			Name:    item.Group.Name,
			Creator: applicantResponse{
				UserID:    item.Group.Creator.UserID,
				Name:      item.Group.Creator.Name,
				Email:     item.Group.Creator.Email,
				AvatarURL: item.Group.Creator.AvatarURL,
			},
			Members: members,
		}
	}
	return response
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
