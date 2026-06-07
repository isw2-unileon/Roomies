package httpadapter

import (
	"errors"
	"log/slog"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/message"
	messageservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/message/service"
)

type handler struct {
	messageService *messageservice.Service
}

type createMessageRequest struct {
	ReceiverID  string `json:"receiver_id"`
	ApartmentID string `json:"apartment_id"`
	Content     string `json:"content"`
}

type messageResponse struct {
	ID          string `json:"id"`
	SenderID    string `json:"sender_id"`
	ReceiverID  string `json:"receiver_id"`
	ApartmentID string `json:"apartment_id"`
	Content     string `json:"content"`
	CreatedAt   string `json:"created_at"`
	ReadAt      string `json:"read_at,omitempty"`
}

type conversationResponse struct {
	ApartmentID    string `json:"apartment_id"`
	ApartmentTitle string `json:"apartment_title"`
	OtherUserID    string `json:"other_user_id"`
	OtherUserName  string `json:"other_user_name"`
	LastMessage    string `json:"last_message"`
	LastMessageAt  string `json:"last_message_at"`
	LastSenderID   string `json:"last_sender_id"`
	UnreadCount    int    `json:"unread_count"`
}

// RegisterRoutes wires message endpoints into the authenticated API router.
func RegisterRoutes(api *gin.RouterGroup, messageService *messageservice.Service) {
	h := &handler{messageService: messageService}
	api.POST("/messages", h.createMessage)
	api.GET("/messages/conversations", h.listConversations)
	api.GET("/messages/group-conversations", h.listGroupConversations)
	api.GET("/messages/conversations/:apartmentId/:otherUserId", h.listConversationMessages)
	api.POST("/messages/conversations/:apartmentId/:otherUserId/read", h.markConversationRead)
}

// RegisterGroupRoutes wires group chat endpoints into the tenant API router.
func RegisterGroupRoutes(api *gin.RouterGroup, messageService *messageservice.Service) {
	h := &handler{messageService: messageService}
	api.POST("/tenant/groups/:id/messages", h.createGroupMessage)
	api.GET("/tenant/groups/:id/messages", h.listGroupMessages)
}

// RegisterOwnerGroupRoutes wires owner apartment chat endpoints.
func RegisterOwnerGroupRoutes(api *gin.RouterGroup, messageService *messageservice.Service) {
	h := &handler{messageService: messageService}
	api.POST("/owner/apartments/:id/apartment-chat", h.getOrCreateApartmentChat)
	api.POST("/owner/groups/:id/messages", h.createGroupMessage)
	api.GET("/owner/groups/:id/messages", h.listGroupMessages)
}

func (h *handler) createMessage(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	var req createMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	item, err := h.messageService.SendMessage(c.Request.Context(), userID, req.ReceiverID, req.ApartmentID, req.Content, role)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": messageResponseFromDomain(*item)})
}

func (h *handler) listGroupConversations(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	items, err := h.messageService.ListGroupConversations(c.Request.Context(), userID, role)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}
	response := make([]gin.H, 0, len(items))
	for _, item := range items {
		response = append(response, gin.H{
			"group_id":         item.GroupID,
			"group_name":       item.GroupName,
			"last_message":     item.LastMessage,
			"last_message_at":  item.LastMessageAt,
			"last_sender_name": item.LastSenderName,
		})
	}
	c.JSON(http.StatusOK, gin.H{"group_conversations": response})
}

func (h *handler) listConversations(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	items, err := h.messageService.ListConversations(c.Request.Context(), userID, role)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	response := make([]conversationResponse, 0, len(items))
	for _, item := range items {
		response = append(response, conversationResponseFromDomain(item))
	}
	c.JSON(http.StatusOK, gin.H{"conversations": response})
}

func (h *handler) listConversationMessages(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	apartmentID := normalizeApartmentParam(c.Param("apartmentId"))
	otherUserID := strings.TrimSpace(c.Param("otherUserId"))
	items, err := h.messageService.ListConversationMessages(c.Request.Context(), userID, apartmentID, otherUserID, role)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	response := make([]messageResponse, 0, len(items))
	for _, item := range items {
		response = append(response, messageResponseFromDomain(item))
	}
	c.JSON(http.StatusOK, gin.H{"messages": response})
}

func (h *handler) markConversationRead(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	apartmentID := normalizeApartmentParam(c.Param("apartmentId"))
	otherUserID := strings.TrimSpace(c.Param("otherUserId"))
	updated, err := h.messageService.MarkConversationRead(c.Request.Context(), userID, apartmentID, otherUserID, role)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"updated": updated})
}

func messageResponseFromDomain(item message.Record) messageResponse {
	return messageResponse{
		ID:          item.ID,
		SenderID:    item.SenderID,
		ReceiverID:  item.ReceiverID,
		ApartmentID: item.ApartmentID,
		Content:     item.Content,
		CreatedAt:   item.CreatedAt,
		ReadAt:      item.ReadAt,
	}
}

func conversationResponseFromDomain(item message.Conversation) conversationResponse {
	return conversationResponse{
		ApartmentID:    item.ApartmentID,
		ApartmentTitle: item.ApartmentTitle,
		OtherUserID:    item.OtherUserID,
		OtherUserName:  item.OtherUserName,
		LastMessage:    item.LastMessage,
		LastMessageAt:  item.LastMessageAt,
		LastSenderID:   item.LastSenderID,
		UnreadCount:    item.UnreadCount,
	}
}

type createGroupMessageRequest struct {
	Content string `json:"content"`
}

type groupMessageResponse struct {
	ID         string `json:"id"`
	GroupID    string `json:"group_id"`
	SenderID   string `json:"sender_id"`
	SenderName string `json:"sender_name"`
	Content    string `json:"content"`
	CreatedAt  string `json:"created_at"`
}

func (h *handler) createGroupMessage(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	groupID := strings.TrimSpace(c.Param("id"))
	var req createGroupMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}
	item, err := h.messageService.SendGroupMessage(c.Request.Context(), userID, groupID, req.Content, role)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": groupMessageResponse{
		ID: item.ID, GroupID: item.GroupID, SenderID: item.SenderID,
		SenderName: item.SenderName, Content: item.Content, CreatedAt: item.CreatedAt,
	}})
}

func (h *handler) listGroupMessages(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	groupID := strings.TrimSpace(c.Param("id"))
	items, err := h.messageService.ListGroupMessages(c.Request.Context(), userID, groupID, role)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}
	response := make([]groupMessageResponse, 0, len(items))
	for _, item := range items {
		response = append(response, groupMessageResponse{
			ID: item.ID, GroupID: item.GroupID, SenderID: item.SenderID,
			SenderName: item.SenderName, Content: item.Content, CreatedAt: item.CreatedAt,
		})
	}
	c.JSON(http.StatusOK, gin.H{"messages": response})
}

func (h *handler) getOrCreateApartmentChat(c *gin.Context) {
	userID, role, ok := h.resolveUserAndRole(c)
	if !ok {
		return
	}
	apartmentID := strings.TrimSpace(c.Param("id"))
	chat, err := h.messageService.GetOrCreateApartmentChat(c.Request.Context(), apartmentID, userID, role)
	if err != nil {
		h.handleServiceError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"group_id": chat.GroupID, "group_name": chat.GroupName})
}

func normalizeApartmentParam(raw string) string {
	v := strings.TrimSpace(raw)
	if v == "direct" {
		return ""
	}
	return v
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
	case errors.Is(err, messageservice.ErrForbiddenRole):
		c.JSON(http.StatusForbidden, gin.H{"error": "messages are only available for tenant and owner users"})
	case errors.Is(err, messageservice.ErrInvalidMessage):
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid message payload"})
	case errors.Is(err, messageservice.ErrNotGroupMember):
		c.JSON(http.StatusForbidden, gin.H{"error": "you are not a member of this group"})
	default:
		slog.Error("message service error", "error", err, "path", c.Request.URL.Path)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not process message request"})
	}
}
