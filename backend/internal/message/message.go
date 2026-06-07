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

// GroupMessage contains a message sent to a group chat.
type GroupMessage struct {
	ID         string
	GroupID    string
	SenderID   string
	SenderName string
	Content    string
	CreatedAt  string
}

// GroupConversation contains the latest data for a group chat in the conversations list.
type GroupConversation struct {
	GroupID        string
	GroupName      string
	LastMessage    string
	LastMessageAt  string
	LastSenderName string
}

// ApartmentChat contains the group chat info for an apartment.
type ApartmentChat struct {
	GroupID   string
	GroupName string
}
