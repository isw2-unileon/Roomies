package message

// Record contains persisted message data.
type Record struct {
	ID          string
	SenderID    string
	ReceiverID  string
	ApartmentID string
	Content     string
	CreatedAt   string
	ReadAt      string
}

// Conversation contains the latest data for one conversation.
type Conversation struct {
	ApartmentID    string
	ApartmentTitle string
	OtherUserID    string
	OtherUserName  string
	LastMessage    string
	LastMessageAt  string
	LastSenderID   string
	UnreadCount    int
}
