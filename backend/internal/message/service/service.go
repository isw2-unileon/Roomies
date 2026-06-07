package service

import (
	"context"
	"errors"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/message"
)

type repository interface {
	CreateMessage(ctx context.Context, senderID, receiverID, apartmentID, content string) (*message.Record, error)
	ListConversations(ctx context.Context, userID string) ([]message.Conversation, error)
	ListConversationMessages(ctx context.Context, userID, apartmentID, otherUserID string) ([]message.Record, error)
	MarkConversationRead(ctx context.Context, userID, apartmentID, otherUserID string) (int, error)
	ListGroupConversations(ctx context.Context, userID string) ([]message.GroupConversation, error)
	IsGroupMember(ctx context.Context, groupID, userID string) (bool, error)
	CreateGroupMessage(ctx context.Context, senderID, groupID, content string) (*message.GroupMessage, error)
	ListGroupMessages(ctx context.Context, groupID string) ([]message.GroupMessage, error)
	GetOrCreateApartmentChat(ctx context.Context, apartmentID, ownerID string) (*message.ApartmentChat, error)
}

// ErrInvalidMessage is returned when message payload is not valid.
var ErrInvalidMessage = errors.New("invalid message")

// ErrForbiddenRole is returned when role cannot use messages.
var ErrForbiddenRole = errors.New("messages are only available for tenant and owner users")

// Service contains message use cases.
type Service struct {
	repo repository
}

// NewService creates the message service.
func NewService(repo repository) *Service {
	return &Service{repo: repo}
}

// SendMessage creates a new message between two users for one apartment.
func (s *Service) SendMessage(ctx context.Context, senderID, receiverID, apartmentID, content, role string) (*message.Record, error) {
	if !isTenantOrOwner(role) {
		return nil, ErrForbiddenRole
	}
	senderID = strings.TrimSpace(senderID)
	receiverID = strings.TrimSpace(receiverID)
	apartmentID = strings.TrimSpace(apartmentID)
	content = strings.TrimSpace(content)

	if senderID == "" || receiverID == "" || content == "" || senderID == receiverID {
		return nil, ErrInvalidMessage
	}

	return s.repo.CreateMessage(ctx, senderID, receiverID, apartmentID, content)
}

// ListConversations returns the latest message for every apartment/user conversation.
func (s *Service) ListConversations(ctx context.Context, userID, role string) ([]message.Conversation, error) {
	if !isTenantOrOwner(role) {
		return nil, ErrForbiddenRole
	}
	userID = strings.TrimSpace(userID)
	if userID == "" {
		return nil, ErrInvalidMessage
	}
	return s.repo.ListConversations(ctx, userID)
}

// ListConversationMessages returns all messages in one conversation sorted by date ascending.
func (s *Service) ListConversationMessages(ctx context.Context, userID, apartmentID, otherUserID, role string) ([]message.Record, error) {
	if !isTenantOrOwner(role) {
		return nil, ErrForbiddenRole
	}
	if strings.TrimSpace(userID) == "" || strings.TrimSpace(otherUserID) == "" {
		return nil, ErrInvalidMessage
	}
	if strings.TrimSpace(userID) == strings.TrimSpace(otherUserID) {
		return nil, ErrInvalidMessage
	}
	return s.repo.ListConversationMessages(ctx, strings.TrimSpace(userID), strings.TrimSpace(apartmentID), strings.TrimSpace(otherUserID))
}

// MarkConversationRead marks unread messages as read for the authenticated user.
func (s *Service) MarkConversationRead(ctx context.Context, userID, apartmentID, otherUserID, role string) (int, error) {
	if !isTenantOrOwner(role) {
		return 0, ErrForbiddenRole
	}
	if strings.TrimSpace(userID) == "" || strings.TrimSpace(otherUserID) == "" {
		return 0, ErrInvalidMessage
	}
	if strings.TrimSpace(userID) == strings.TrimSpace(otherUserID) {
		return 0, ErrInvalidMessage
	}
	return s.repo.MarkConversationRead(ctx, strings.TrimSpace(userID), strings.TrimSpace(apartmentID), strings.TrimSpace(otherUserID))
}

// ListGroupConversations returns group chats the user belongs to.
func (s *Service) ListGroupConversations(ctx context.Context, userID, role string) ([]message.GroupConversation, error) {
	if !isTenantOrOwner(role) {
		return nil, ErrForbiddenRole
	}
	userID = strings.TrimSpace(userID)
	if userID == "" {
		return nil, ErrInvalidMessage
	}
	return s.repo.ListGroupConversations(ctx, userID)
}

// ErrNotGroupMember is returned when the user is not a member of the group.
var ErrNotGroupMember = errors.New("user is not a member of this group")

// SendGroupMessage creates a new message in a group chat.
func (s *Service) SendGroupMessage(ctx context.Context, senderID, groupID, content, role string) (*message.GroupMessage, error) {
	if !isTenantOrOwner(role) {
		return nil, ErrForbiddenRole
	}
	senderID = strings.TrimSpace(senderID)
	groupID = strings.TrimSpace(groupID)
	content = strings.TrimSpace(content)
	if senderID == "" || groupID == "" || content == "" {
		return nil, ErrInvalidMessage
	}
	isMember, err := s.repo.IsGroupMember(ctx, groupID, senderID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrNotGroupMember
	}
	return s.repo.CreateGroupMessage(ctx, senderID, groupID, content)
}

// ListGroupMessages returns all messages in a group chat.
func (s *Service) ListGroupMessages(ctx context.Context, userID, groupID, role string) ([]message.GroupMessage, error) {
	if !isTenantOrOwner(role) {
		return nil, ErrForbiddenRole
	}
	userID = strings.TrimSpace(userID)
	groupID = strings.TrimSpace(groupID)
	if userID == "" || groupID == "" {
		return nil, ErrInvalidMessage
	}
	isMember, err := s.repo.IsGroupMember(ctx, groupID, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrNotGroupMember
	}
	return s.repo.ListGroupMessages(ctx, groupID)
}

// GetOrCreateApartmentChat returns or creates the apartment group chat for the owner.
func (s *Service) GetOrCreateApartmentChat(ctx context.Context, apartmentID, ownerID, role string) (*message.ApartmentChat, error) {
	if strings.ToLower(strings.TrimSpace(role)) != "owner" {
		return nil, ErrForbiddenRole
	}
	apartmentID = strings.TrimSpace(apartmentID)
	ownerID = strings.TrimSpace(ownerID)
	if apartmentID == "" || ownerID == "" {
		return nil, ErrInvalidMessage
	}
	return s.repo.GetOrCreateApartmentChat(ctx, apartmentID, ownerID)
}

func isTenantOrOwner(role string) bool {
	normalized := strings.ToLower(strings.TrimSpace(role))
	return normalized == "tenant" || normalized == "owner"
}
