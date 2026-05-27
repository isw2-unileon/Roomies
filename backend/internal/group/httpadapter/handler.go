package httpadapter

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/group"
	groupservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/group/service"
)

type handler struct {
	groupService *groupservice.Service
}

type createGroupRequest struct {
	Name           string   `json:"name"`
	Description    string   `json:"description"`
	ApartmentID    *string  `json:"apartment_id"`
	InvitedUserIDs []string `json:"invited_user_ids"`
}

type updateGroupApartmentRequest struct {
	ApartmentID *string `json:"apartment_id"`
}

type groupResponse struct {
	ID                      string               `json:"id"`
	Name                    string               `json:"name"`
	Description             string               `json:"description"`
	Status                  string               `json:"status"`
	CreatedBy               string               `json:"created_by"`
	CreatedAt               string               `json:"created_at"`
	UserRelation            string               `json:"user_relation"`
	InvitationID            string               `json:"invitation_id"`
	AcceptedMembersCount    int                  `json:"accepted_members_count"`
	PendingInvitationsCount int                  `json:"pending_invitations_count"`
	AverageBudgetMin        int                  `json:"average_budget_min"`
	AverageBudgetMax        int                  `json:"average_budget_max"`
	Apartment               *apartmentResponse   `json:"apartment"`
	Members                 []memberResponse     `json:"members,omitempty"`
	PendingInvitations      []invitationResponse `json:"pending_invitations,omitempty"`
}

type apartmentResponse struct {
	ID             string `json:"id"`
	Title          string `json:"title"`
	Address        string `json:"address"`
	Area           string `json:"area"`
	TotalSpots     int    `json:"total_spots"`
	OccupiedSpots  int    `json:"occupied_spots"`
	AvailableSpots int    `json:"available_spots"`
	BaseRent       int    `json:"base_rent"`
	ImageURL       string `json:"image_url"`
}

type memberResponse struct {
	UserID        string `json:"user_id"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	AvatarURL     string `json:"avatar_url"`
	Role          string `json:"role"`
	Status        string `json:"status"`
	Age           int    `json:"age"`
	University    string `json:"university"`
	BudgetMin     int    `json:"budget_min"`
	BudgetMax     int    `json:"budget_max"`
	PreferredArea string `json:"preferred_area"`
	MoveInDate    string `json:"move_in_date"`
	Pets          bool   `json:"pets"`
	Smoking       bool   `json:"smoking"`
	NoiseLevel    string `json:"noise_level"`
	Cleanliness   string `json:"cleanliness"`
	WorkSchedule  string `json:"work_schedule"`
	IsCurrentUser bool   `json:"is_current_user"`
}

type invitationResponse struct {
	ID            string            `json:"id"`
	GroupID       string            `json:"group_id"`
	InvitedBy     string            `json:"invited_by"`
	InvitedUserID string            `json:"invited_user_id"`
	Status        string            `json:"status"`
	CreatedAt     string            `json:"created_at"`
	RespondedAt   string            `json:"responded_at"`
	User          candidateResponse `json:"user"`
}

type candidateResponse struct {
	UserID        string `json:"user_id"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	AvatarURL     string `json:"avatar_url"`
	Age           int    `json:"age"`
	University    string `json:"university"`
	BudgetMin     int    `json:"budget_min"`
	BudgetMax     int    `json:"budget_max"`
	PreferredArea string `json:"preferred_area"`
	MoveInDate    string `json:"move_in_date"`
	Pets          bool   `json:"pets"`
	Smoking       bool   `json:"smoking"`
	NoiseLevel    string `json:"noise_level"`
	Cleanliness   string `json:"cleanliness"`
	WorkSchedule  string `json:"work_schedule"`
}

func RegisterTenantRoutes(api *gin.RouterGroup, groupService *groupservice.Service) {
	h := &handler{groupService: groupService}

	api.GET("/tenant/groups", h.listTenantGroups)
	api.GET("/tenant/groups/:id", h.getTenantGroup)
	api.POST("/tenant/groups", h.createTenantGroup)
	api.GET("/tenant/group-candidates", h.listGroupCandidates)
	api.POST("/tenant/group-invitations/:id/accept", h.acceptGroupInvitation)
	api.POST("/tenant/group-invitations/:id/reject", h.rejectGroupInvitation)
	api.PATCH("/tenant/groups/:id/apartment", h.updateGroupApartment)
}

func (h *handler) listTenantGroups(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	filters := group.ListGroupsFilters{
		Search:       strings.TrimSpace(c.Query("search")),
		Status:       strings.TrimSpace(c.Query("status")),
		HasApartment: strings.TrimSpace(c.Query("has_apartment")),
		Members:      parseIntQuery(c.Query("members")),
		SortBy:       strings.TrimSpace(c.Query("sort")),
	}

	groups, err := h.groupService.ListTenantGroups(c.Request.Context(), userID, role, filters)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"groups": groupResponses(groups)})
}

func (h *handler) getTenantGroup(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	groupID := strings.TrimSpace(c.Param("id"))
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group id is required"})
		return
	}

	result, err := h.groupService.GetTenantGroupByID(c.Request.Context(), groupID, userID, role)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"group": groupResponseFromDomain(*result)})
}

func (h *handler) createTenantGroup(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	var request createGroupRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	input := group.CreateGroupInput{
		Name:           strings.TrimSpace(request.Name),
		Description:    strings.TrimSpace(request.Description),
		InvitedUserIDs: request.InvitedUserIDs,
	}
	if request.ApartmentID != nil {
		input.ApartmentID = strings.TrimSpace(*request.ApartmentID)
	}

	groupID, err := h.groupService.CreateGroup(c.Request.Context(), userID, role, input)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "group created successfully",
		"group_id": groupID,
	})
}

func (h *handler) listGroupCandidates(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	filters := group.CandidateFilters{
		Search:     strings.TrimSpace(c.Query("search")),
		University: strings.TrimSpace(c.Query("university")),
	}

	candidates, err := h.groupService.ListGroupCandidates(c.Request.Context(), userID, role, filters)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"candidates": candidateResponses(candidates)})
}

func (h *handler) acceptGroupInvitation(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	invitationID := strings.TrimSpace(c.Param("id"))
	if invitationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invitation id is required"})
		return
	}

	if err := h.groupService.AcceptInvitation(c.Request.Context(), invitationID, userID, role); err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "group invitation accepted"})
}

func (h *handler) rejectGroupInvitation(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	invitationID := strings.TrimSpace(c.Param("id"))
	if invitationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invitation id is required"})
		return
	}

	if err := h.groupService.RejectInvitation(c.Request.Context(), invitationID, userID, role); err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "group invitation rejected"})
}

func (h *handler) updateGroupApartment(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	groupID := strings.TrimSpace(c.Param("id"))
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group id is required"})
		return
	}

	var request updateGroupApartmentRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	input := group.UpdateGroupApartmentInput{}
	if request.ApartmentID != nil {
		input.ApartmentID = strings.TrimSpace(*request.ApartmentID)
	}

	if err := h.groupService.UpdateGroupApartment(c.Request.Context(), groupID, userID, role, input); err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "group apartment updated"})
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

func (h *handler) handleServiceError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, groupservice.ErrTenantRequired):
		c.JSON(http.StatusForbidden, gin.H{"error": "tenant role is required"})
	case errors.Is(err, groupservice.ErrForbidden):
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
	case errors.Is(err, groupservice.ErrGroupNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "group not found"})
	case errors.Is(err, groupservice.ErrInvitationNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "invitation not found"})
	case errors.Is(err, groupservice.ErrInvitationNotPending):
		c.JSON(http.StatusConflict, gin.H{"error": "invitation is not pending"})
	case errors.Is(err, groupservice.ErrApartmentFull):
		c.JSON(http.StatusConflict, gin.H{"error": "group exceeds apartment available spots"})
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}
}

func groupResponses(items []group.Group) []groupResponse {
	result := make([]groupResponse, 0, len(items))
	for _, item := range items {
		result = append(result, groupResponseFromDomain(item))
	}
	return result
}

func groupResponseFromDomain(item group.Group) groupResponse {
	return groupResponse{
		ID:                      item.ID,
		Name:                    item.Name,
		Description:             item.Description,
		Status:                  item.Status,
		CreatedBy:               item.CreatedBy,
		CreatedAt:               item.CreatedAt,
		UserRelation:            item.UserRelation,
		InvitationID:            item.InvitationID,
		AcceptedMembersCount:    item.AcceptedMembersCount,
		PendingInvitationsCount: item.PendingInvitationsCount,
		AverageBudgetMin:        item.AverageBudgetMin,
		AverageBudgetMax:        item.AverageBudgetMax,
		Apartment:               apartmentResponseFromDomain(item.Apartment),
		Members:                 memberResponses(item.Members),
		PendingInvitations:      invitationResponses(item.PendingInvitations),
	}
}

func apartmentResponseFromDomain(item *group.Apartment) *apartmentResponse {
	if item == nil {
		return nil
	}

	return &apartmentResponse{
		ID:             item.ID,
		Title:          item.Title,
		Address:        item.Address,
		Area:           item.Area,
		TotalSpots:     item.TotalSpots,
		OccupiedSpots:  item.OccupiedSpots,
		AvailableSpots: item.AvailableSpots,
		BaseRent:       item.BaseRent,
		ImageURL:       item.ImageURL,
	}
}

func memberResponses(items []group.Member) []memberResponse {
	result := make([]memberResponse, 0, len(items))
	for _, item := range items {
		result = append(result, memberResponse{
			UserID:        item.UserID,
			Name:          item.Name,
			Email:         item.Email,
			AvatarURL:     item.AvatarURL,
			Role:          item.Role,
			Status:        item.Status,
			Age:           item.Age,
			University:    item.University,
			BudgetMin:     item.BudgetMin,
			BudgetMax:     item.BudgetMax,
			PreferredArea: item.PreferredArea,
			MoveInDate:    item.MoveInDate,
			Pets:          item.Pets,
			Smoking:       item.Smoking,
			NoiseLevel:    item.NoiseLevel,
			Cleanliness:   item.Cleanliness,
			WorkSchedule:  item.WorkSchedule,
			IsCurrentUser: item.IsCurrentUser,
		})
	}
	return result
}

func invitationResponses(items []group.Invitation) []invitationResponse {
	result := make([]invitationResponse, 0, len(items))
	for _, item := range items {
		result = append(result, invitationResponse{
			ID:            item.ID,
			GroupID:       item.GroupID,
			InvitedBy:     item.InvitedBy,
			InvitedUserID: item.InvitedUserID,
			Status:        item.Status,
			CreatedAt:     item.CreatedAt,
			RespondedAt:   item.RespondedAt,
			User:          candidateResponseFromDomain(item.User),
		})
	}
	return result
}

func candidateResponses(items []group.Candidate) []candidateResponse {
	result := make([]candidateResponse, 0, len(items))
	for _, item := range items {
		result = append(result, candidateResponseFromDomain(item))
	}
	return result
}

func candidateResponseFromDomain(item group.Candidate) candidateResponse {
	return candidateResponse{
		UserID:        item.UserID,
		Name:          item.Name,
		Email:         item.Email,
		AvatarURL:     item.AvatarURL,
		Age:           item.Age,
		University:    item.University,
		BudgetMin:     item.BudgetMin,
		BudgetMax:     item.BudgetMax,
		PreferredArea: item.PreferredArea,
		MoveInDate:    item.MoveInDate,
		Pets:          item.Pets,
		Smoking:       item.Smoking,
		NoiseLevel:    item.NoiseLevel,
		Cleanliness:   item.Cleanliness,
		WorkSchedule:  item.WorkSchedule,
	}
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
