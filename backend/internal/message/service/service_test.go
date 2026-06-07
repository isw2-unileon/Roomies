package service

import (
	"context"
	"errors"
	"testing"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/message"
)

type fakeMessageRepository struct {
	created          *message.Record
	conversations    []message.Conversation
	conversationMsgs []message.Record
	marked           int

	createCalled  bool
	lastSender    string
	lastReceiver  string
	lastApartment string
	lastContent   string
}

func (f *fakeMessageRepository) CreateMessage(ctx context.Context, senderID, receiverID, apartmentID, content string) (*message.Record, error) {
	f.createCalled = true
	f.lastSender = senderID
	f.lastReceiver = receiverID
	f.lastApartment = apartmentID
	f.lastContent = content
	if f.created != nil {
		return f.created, nil
	}
	return &message.Record{ID: "m1", SenderID: senderID, ReceiverID: receiverID, ApartmentID: apartmentID, Content: content}, nil
}

func (f *fakeMessageRepository) ListConversations(ctx context.Context, userID string) ([]message.Conversation, error) {
	return f.conversations, nil
}

func (f *fakeMessageRepository) ListConversationMessages(ctx context.Context, userID, apartmentID, otherUserID string) ([]message.Record, error) {
	return f.conversationMsgs, nil
}

func (f *fakeMessageRepository) MarkConversationRead(ctx context.Context, userID, apartmentID, otherUserID string) (int, error) {
	return f.marked, nil
}

func TestSendMessageCreatesRecord(t *testing.T) {
	repo := &fakeMessageRepository{}
	svc := NewService(repo)

	item, err := svc.SendMessage(context.Background(), "tenant-1", "owner-1", "apartment-1", " Hola propietario ", "tenant")
	if err != nil {
		t.Fatalf("SendMessage returned error: %v", err)
	}
	if item == nil || item.ID == "" {
		t.Fatal("item is nil or empty")
	}
	if !repo.createCalled {
		t.Fatal("CreateMessage was not called")
	}
	if repo.lastContent != "Hola propietario" {
		t.Fatalf("lastContent = %q, want trimmed value", repo.lastContent)
	}
}

func TestSendMessageRejectsInvalidPayload(t *testing.T) {
	repo := &fakeMessageRepository{}
	svc := NewService(repo)

	_, err := svc.SendMessage(context.Background(), "tenant-1", "tenant-1", "apartment-1", "hola", "tenant")
	if !errors.Is(err, ErrInvalidMessage) {
		t.Fatalf("err = %v, want %v", err, ErrInvalidMessage)
	}
}

func TestListConversationsRejectsRole(t *testing.T) {
	repo := &fakeMessageRepository{}
	svc := NewService(repo)

	_, err := svc.ListConversations(context.Background(), "tenant-1", "admin")
	if !errors.Is(err, ErrForbiddenRole) {
		t.Fatalf("err = %v, want %v", err, ErrForbiddenRole)
	}
}

func TestMarkConversationReadPassesThrough(t *testing.T) {
	repo := &fakeMessageRepository{marked: 3}
	svc := NewService(repo)

	updated, err := svc.MarkConversationRead(context.Background(), "owner-1", "apartment-1", "tenant-1", "owner")
	if err != nil {
		t.Fatalf("MarkConversationRead returned error: %v", err)
	}
	if updated != 3 {
		t.Fatalf("updated = %d, want 3", updated)
	}
}
