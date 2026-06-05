package httpadapter

import (
	"context"
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

type inviteUsersRequest struct {
	InvitedUserIDs []string `json:"invited_user_ids"`
}

type updateGroupApartmentRequest struct {
	ApartmentID *string `json:"apartment_id"`
}

type voteJoinRequestBody struct {
	Decision string `json:"decision"`
}

type groupResponse struct {
	ID                      string                      `json:"id"`
	Name                    string                      `json:"name"`
	Description             string                      `json:"description"`
	Status                  string                      `json:"status"`
	CreatedBy               string                      `json:"created_by"`
	CreatedAt               string                      `json:"created_at"`
	UserRelation            string                      `json:"user_relation"`
	InvitationID            string                      `json:"invitation_id"`
	AcceptedMembersCount    int                         `json:"accepted_members_count"`
	PendingInvitationsCount int                         `json:"pending_invitations_count"`
	IsFullyAccepted         bool                        `json:"is_fully_accepted"`
	AverageBudgetMax        int                         `json:"average_budget_max"`
	Apartment               *apartmentResponse          `json:"apartment"`
	CurrentApartmentRequest *apartmentRequestResponse   `json:"current_apartment_request"`
	CurrentJoinRequest      *currentJoinRequestResponse `json:"current_join_request"`
	Members                 []memberResponse            `json:"members,omitempty"`
	PendingInvitations      []invitationResponse        `json:"pending_invitations,omitempty"`
	JoinRequests            []joinRequestResponse       `json:"join_requests,omitempty"`
}

type apartmentRequestResponse struct {
	ID          string `json:"id"`
	ApartmentID string `json:"apartment_id"`
	GroupID     string `json:"group_id"`
	Type        string `json:"type"`
	Status      string `json:"status"`
	CreatedAt   string `json:"created_at"`
}

type joinRequestResponse struct {
	ID              string             `json:"id"`
	GroupID         string             `json:"group_id"`
	RequesterUserID string             `json:"requester_user_id"`
	Status          string             `json:"status"`
	CreatedAt       string             `json:"created_at"`
	UpdatedAt       string             `json:"updated_at"`
	Requester       candidateResponse  `json:"requester"`
	Votes           []joinVoteResponse `json:"votes"`
}

type currentJoinRequestResponse struct {
	ID              string `json:"id"`
	GroupID         string `json:"group_id"`
	RequesterUserID string `json:"requester_user_id"`
	Status          string `json:"status"`
	CreatedAt       string `json:"created_at"`
	UpdatedAt       string `json:"updated_at"`
}

type joinVoteResponse struct {
	RequestID   string `json:"request_id"`
	VoterUserID string `json:"voter_user_id"`
	VoterName   string `json:"voter_name"`
	Decision    string `json:"decision"`
	CreatedAt   string `json:"created_at"`
	UpdatedAt   string `json:"updated_at"`
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
	UserID             string `json:"user_id"`
	Name               string `json:"name"`
	Email              string `json:"email"`
	AvatarURL          string `json:"avatar_url"`
	Role               string `json:"role"`
	Status             string `json:"status"`
	Age                int    `json:"age"`
	Sex                string `json:"sex"`
	Situation          string `json:"situation"`
	Degree             string `json:"degree"`
	Profession         string `json:"profession"`
	BudgetMax          int    `json:"budget_max"`
	PreferredArea      string `json:"preferred_area"`
	Pets               bool   `json:"pets"`
	Smoking            bool   `json:"smoking"`
	SocializationLevel string `json:"socialization_level"`
	NightlifeLevel     string `json:"nightlife_level"`
	HasAccepted        bool   `json:"has_accepted"`
	IsCurrentUser      bool   `json:"is_current_user"`
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
	UserID             string `json:"user_id"`
	Name               string `json:"name"`
	Email              string `json:"email"`
	AvatarURL          string `json:"avatar_url"`
	Age                int    `json:"age"`
	Sex                string `json:"sex"`
	Situation          string `json:"situation"`
	Degree             string `json:"degree"`
	Profession         string `json:"profession"`
	BudgetMax          int    `json:"budget_max"`
	PreferredArea      string `json:"preferred_area"`
	Pets               bool   `json:"pets"`
	Smoking            bool   `json:"smoking"`
	SocializationLevel string `json:"socialization_level"`
	NightlifeLevel     string `json:"nightlife_level"`
}

// RegisterTenantRoutes registers tenant group HTTP routes.
func RegisterTenantRoutes(api *gin.RouterGroup, groupService *groupservice.Service) {
	h := &handler{groupService: groupService}

	api.GET("/tenant/groups", h.listTenantGroups)
	api.GET("/tenant/groups/:id", h.getTenantGroup)
	api.POST("/tenant/groups", h.createTenantGroup)
	api.DELETE("/tenant/groups/:id", h.deleteTenantGroup)
	api.POST("/tenant/groups/:id/invitations", h.inviteUsersToGroup)
	api.POST("/tenant/groups/:id/accept", h.acceptTenantGroup)
	api.POST("/tenant/groups/:id/join-request", h.createJoinRequest)
	api.GET("/tenant/groups/:id/join-requests", h.listJoinRequests)
	api.POST("/tenant/groups/:id/join-requests/:requestID/vote", h.voteJoinRequest)
	api.POST("/tenant/groups/:id/join-requests/:requestID/cancel", h.cancelJoinRequest)
	api.GET("/tenant/group-candidates", h.listGroupCandidates)
	api.POST("/tenant/group-invitations/:id/accept", h.acceptGroupInvitation)
	api.POST("/tenant/group-invitations/:id/reject", h.rejectGroupInvitation)
	api.PATCH("/tenant/groups/:id/apartment", h.updateGroupApartment)
	api.GET("/apartments/:id/my-group", h.getMyGroupForApartment)
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

func (h *handler) inviteUsersToGroup(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	groupID := strings.TrimSpace(c.Param("id"))
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group id is required"})
		return
	}

	var request inviteUsersRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if err := h.groupService.InviteUsers(c.Request.Context(), groupID, userID, role, request.InvitedUserIDs); err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "group invitations created"})
}

func (h *handler) listGroupCandidates(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	filters := group.CandidateFilters{
		Search:  strings.TrimSpace(c.Query("search")),
		GroupID: strings.TrimSpace(c.Query("group_id")),
	}

	candidates, err := h.groupService.ListGroupCandidates(c.Request.Context(), userID, role, filters)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"candidates": candidateResponses(candidates)})
}

func (h *handler) acceptGroupInvitation(c *gin.Context) {
	h.respondToGroupInvitation(
		c,
		h.groupService.AcceptInvitation,
		"group invitation accepted",
	)
}

func (h *handler) rejectGroupInvitation(c *gin.Context) {
	h.respondToGroupInvitation(
		c,
		h.groupService.RejectInvitation,
		"group invitation rejected",
	)
}

func (h *handler) respondToGroupInvitation(
	c *gin.Context,
	action func(ctx context.Context, invitationID, userID, role string) error,
	successMessage string,
) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	invitationID := strings.TrimSpace(c.Param("id"))
	if invitationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invitation id is required"})
		return
	}

	if err := action(c.Request.Context(), invitationID, userID, role); err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": successMessage})
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

func (h *handler) acceptTenantGroup(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	groupID := strings.TrimSpace(c.Param("id"))
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group id is required"})
		return
	}

	if err := h.groupService.AcceptGroup(c.Request.Context(), groupID, userID, role); err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "group accepted"})
}

func (h *handler) deleteTenantGroup(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	groupID := strings.TrimSpace(c.Param("id"))
	if groupID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group id is required"})
		return
	}

	if err := h.groupService.DeleteGroup(c.Request.Context(), groupID, userID, role); err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *handler) createJoinRequest(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	groupID := strings.TrimSpace(c.Param("id"))
	requestID, err := h.groupService.CreateJoinRequest(c.Request.Context(), groupID, userID, role)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "join request created", "request_id": requestID})
}

func (h *handler) listJoinRequests(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	groupID := strings.TrimSpace(c.Param("id"))
	requests, err := h.groupService.ListJoinRequests(c.Request.Context(), groupID, userID, role)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"requests": joinRequestResponses(requests)})
}

func (h *handler) voteJoinRequest(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	requestID := strings.TrimSpace(c.Param("requestID"))
	var body voteJoinRequestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	if err := h.groupService.VoteJoinRequest(c.Request.Context(), requestID, userID, role, body.Decision); err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "join request voted"})
}

func (h *handler) cancelJoinRequest(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}

	requestID := strings.TrimSpace(c.Param("requestID"))
	if err := h.groupService.CancelJoinRequest(c.Request.Context(), requestID, userID, role); err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "join request cancelled"})
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

func (h *handler) getMyGroupForApartment(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	apartmentID := strings.TrimSpace(c.Param("id"))
	if apartmentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "apartment id is required"})
		return
	}
	result, err := h.groupService.GetMyGroupForApartment(c.Request.Context(), userID, role, apartmentID)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}
	if result == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no group found for this apartment"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"group": groupResponseFromDomain(*result)})
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
	case errors.Is(err, groupservice.ErrGroupApartmentAlreadyAssigned):
		c.JSON(http.StatusConflict, gin.H{"error": "group apartment already assigned"})
	case errors.Is(err, groupservice.ErrGroupApartmentRemovalNotAllowed):
		c.JSON(http.StatusConflict, gin.H{"error": "group apartment removal is not allowed"})
	case errors.Is(err, groupservice.ErrGroupAlreadyExistsForApartment):
		c.JSON(http.StatusConflict, gin.H{"error": "you already have a group for this apartment"})
	case errors.Is(err, groupservice.ErrJoinRequestAlreadyPending):
		c.JSON(http.StatusConflict, gin.H{"error": "join request already pending"})
	case errors.Is(err, groupservice.ErrJoinRequestAlreadyRejected):
		c.JSON(http.StatusConflict, gin.H{"error": "join request already rejected"})
	case errors.Is(err, groupservice.ErrJoinRequestNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "join request not found"})
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
		IsFullyAccepted:         item.IsFullyAccepted,
		AverageBudgetMax:        item.AverageBudgetMax,
		Apartment:               apartmentResponseFromDomain(item.Apartment),
		CurrentApartmentRequest: apartmentRequestResponseFromDomain(item.CurrentApartmentRequest),
		CurrentJoinRequest:      currentJoinRequestResponseFromDomain(item.CurrentJoinRequest),
		Members:                 memberResponses(item.Members),
		PendingInvitations:      invitationResponses(item.PendingInvitations),
		JoinRequests:            joinRequestResponses(item.JoinRequests),
	}
}

func apartmentRequestResponseFromDomain(item *group.ApartmentRequest) *apartmentRequestResponse {
	if item == nil {
		return nil
	}

	return &apartmentRequestResponse{
		ID:          item.ID,
		ApartmentID: item.ApartmentID,
		GroupID:     item.GroupID,
		Type:        item.Type,
		Status:      item.Status,
		CreatedAt:   item.CreatedAt,
	}
}

func currentJoinRequestResponseFromDomain(item *group.UserJoinRequest) *currentJoinRequestResponse {
	if item == nil {
		return nil
	}

	return &currentJoinRequestResponse{
		ID:              item.ID,
		GroupID:         item.GroupID,
		RequesterUserID: item.RequesterUserID,
		Status:          item.Status,
		CreatedAt:       item.CreatedAt,
		UpdatedAt:       item.UpdatedAt,
	}
}

func joinRequestResponses(items []group.JoinRequest) []joinRequestResponse {
	result := make([]joinRequestResponse, 0, len(items))
	for _, item := range items {
		result = append(result, joinRequestResponse{
			ID:              item.ID,
			GroupID:         item.GroupID,
			RequesterUserID: item.RequesterUserID,
			Status:          item.Status,
			CreatedAt:       item.CreatedAt,
			UpdatedAt:       item.UpdatedAt,
			Requester:       candidateResponseFromDomain(item.Requester),
			Votes:           joinVoteResponses(item.Votes),
		})
	}
	return result
}

func joinVoteResponses(items []group.JoinRequestVote) []joinVoteResponse {
	result := make([]joinVoteResponse, 0, len(items))
	for _, item := range items {
		result = append(result, joinVoteResponse{
			RequestID:   item.RequestID,
			VoterUserID: item.VoterUserID,
			VoterName:   item.VoterName,
			Decision:    item.Decision,
			CreatedAt:   item.CreatedAt,
			UpdatedAt:   item.UpdatedAt,
		})
	}
	return result
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
			UserID:             item.UserID,
			Name:               item.Name,
			Email:              item.Email,
			AvatarURL:          item.AvatarURL,
			Role:               item.Role,
			Status:             item.Status,
			Age:                item.Age,
			Sex:                item.Sex,
			Situation:          item.Situation,
			Degree:             item.Degree,
			Profession:         item.Profession,
			BudgetMax:          item.BudgetMax,
			PreferredArea:      item.PreferredArea,
			Pets:               item.Pets,
			Smoking:            item.Smoking,
			SocializationLevel: item.SocializationLevel,
			NightlifeLevel:     item.NightlifeLevel,
			HasAccepted:        item.HasAccepted,
			IsCurrentUser:      item.IsCurrentUser,
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
		UserID:             item.UserID,
		Name:               item.Name,
		Email:              item.Email,
		AvatarURL:          item.AvatarURL,
		Age:                item.Age,
		Sex:                item.Sex,
		Situation:          item.Situation,
		Degree:             item.Degree,
		Profession:         item.Profession,
		BudgetMax:          item.BudgetMax,
		PreferredArea:      item.PreferredArea,
		Pets:               item.Pets,
		Smoking:            item.Smoking,
		SocializationLevel: item.SocializationLevel,
		NightlifeLevel:     item.NightlifeLevel,
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
