package postgres

import (
	"context"
	"fmt"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/message"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository stores message data in PostgreSQL.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a PostgreSQL message repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// CreateMessage inserts a new message.
func (r *Repository) CreateMessage(ctx context.Context, senderID, receiverID, apartmentID, content string) (*message.Record, error) {
	const query = `INSERT INTO public.messages (sender_id, receiver_id, apartment_id, content)
	VALUES ($1, $2, $3, $4)
	RETURNING id::text, sender_id::text, receiver_id::text, COALESCE(apartment_id::text, ''), content,
		TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		COALESCE(TO_CHAR(read_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '') AS read_at`

	var aptParam any = apartmentID
	if apartmentID == "" {
		aptParam = nil
	}

	var item message.Record
	if err := r.db.QueryRow(ctx, query, senderID, receiverID, aptParam, content).Scan(
		&item.ID,
		&item.SenderID,
		&item.ReceiverID,
		&item.ApartmentID,
		&item.Content,
		&item.CreatedAt,
		&item.ReadAt,
	); err != nil {
		return nil, fmt.Errorf("create message: %w", err)
	}
	return &item, nil
}

// ListConversations returns latest messages grouped by conversation.
func (r *Repository) ListConversations(ctx context.Context, userID string) ([]message.Conversation, error) {
	const query = `SELECT
		COALESCE(m.apartment_id::text, ''),
		COALESCE(a.title, ''),
		CASE
			WHEN m.sender_id = $1::uuid THEN m.receiver_id::text
			ELSE m.sender_id::text
		END AS other_user_id,
		COALESCE(u.full_name, ''),
		m.content,
		TO_CHAR(m.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_message_at,
		m.sender_id::text,
		COALESCE(unread.unread_count, 0)::int
	FROM (
		SELECT DISTINCT ON (
			COALESCE(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid),
			CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END,
			CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END
		)
			id,
			apartment_id,
			sender_id,
			receiver_id,
			content,
			created_at
		FROM public.messages
		WHERE group_id IS NULL AND (sender_id = $1::uuid OR receiver_id = $1::uuid)
		ORDER BY
			COALESCE(apartment_id, '00000000-0000-0000-0000-000000000000'::uuid),
			CASE WHEN sender_id < receiver_id THEN sender_id ELSE receiver_id END,
			CASE WHEN sender_id < receiver_id THEN receiver_id ELSE sender_id END,
			created_at DESC
	) m
	LEFT JOIN public.apartments a ON a.id = m.apartment_id
	LEFT JOIN public.users u ON u.id = CASE
		WHEN m.sender_id = $1::uuid THEN m.receiver_id
		ELSE m.sender_id
	END
	LEFT JOIN LATERAL (
		SELECT COUNT(*)::int AS unread_count
		FROM public.messages mi
		WHERE (mi.apartment_id IS NOT DISTINCT FROM m.apartment_id)
			AND mi.sender_id = CASE WHEN m.sender_id = $1::uuid THEN m.receiver_id ELSE m.sender_id END
			AND mi.receiver_id = $1::uuid
			AND mi.read_at IS NULL
	) unread ON TRUE
	ORDER BY m.created_at DESC`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("list conversations: %w", err)
	}
	defer rows.Close()

	result := make([]message.Conversation, 0)
	for rows.Next() {
		var item message.Conversation
		if err := rows.Scan(
			&item.ApartmentID,
			&item.ApartmentTitle,
			&item.OtherUserID,
			&item.OtherUserName,
			&item.LastMessage,
			&item.LastMessageAt,
			&item.LastSenderID,
			&item.UnreadCount,
		); err != nil {
			return nil, fmt.Errorf("scan conversations: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate conversations: %w", err)
	}
	return result, nil
}

// ListConversationMessages returns the complete conversation history.
func (r *Repository) ListConversationMessages(ctx context.Context, userID, apartmentID, otherUserID string) ([]message.Record, error) {
	const query = `SELECT
		id::text,
		sender_id::text,
		receiver_id::text,
		COALESCE(apartment_id::text, ''),
		content,
		TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		COALESCE(TO_CHAR(read_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '') AS read_at
	FROM public.messages
	WHERE (apartment_id IS NOT DISTINCT FROM $1)
		AND (
			(sender_id = $2::uuid AND receiver_id = $3::uuid)
			OR
			(sender_id = $3::uuid AND receiver_id = $2::uuid)
		)
	ORDER BY created_at ASC`

	var aptParam any = apartmentID
	if apartmentID == "" {
		aptParam = nil
	}

	rows, err := r.db.Query(ctx, query, aptParam, userID, otherUserID)
	if err != nil {
		return nil, fmt.Errorf("list conversation messages: %w", err)
	}
	defer rows.Close()

	result := make([]message.Record, 0)
	for rows.Next() {
		var item message.Record
		if err := rows.Scan(
			&item.ID,
			&item.SenderID,
			&item.ReceiverID,
			&item.ApartmentID,
			&item.Content,
			&item.CreatedAt,
			&item.ReadAt,
		); err != nil {
			return nil, fmt.Errorf("scan conversation messages: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate conversation messages: %w", err)
	}
	return result, nil
}

// MarkConversationRead updates unread messages as read.
func (r *Repository) MarkConversationRead(ctx context.Context, userID, apartmentID, otherUserID string) (int, error) {
	const query = `UPDATE public.messages
	SET read_at = NOW()
	WHERE (apartment_id IS NOT DISTINCT FROM $1)
		AND sender_id = $2::uuid
		AND receiver_id = $3::uuid
		AND read_at IS NULL`

	var aptParam any = apartmentID
	if apartmentID == "" {
		aptParam = nil
	}

	cmdTag, err := r.db.Exec(ctx, query, aptParam, otherUserID, userID)
	if err != nil {
		return 0, fmt.Errorf("mark conversation read: %w", err)
	}
	return int(cmdTag.RowsAffected()), nil
}

// ListGroupConversations returns the user's group chats with last message info.
func (r *Repository) ListGroupConversations(ctx context.Context, userID string) ([]message.GroupConversation, error) {
	const query = `SELECT
		g.id::text,
		COALESCE(g.name, ''),
		COALESCE(m.content, ''),
		COALESCE(TO_CHAR(m.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), ''),
		COALESCE(u.full_name, '')
	FROM public.group_members gm
	JOIN public.groups g ON g.id = gm.group_id
	LEFT JOIN LATERAL (
		SELECT content, created_at, sender_id
		FROM public.messages
		WHERE group_id = g.id
		ORDER BY created_at DESC
		LIMIT 1
	) m ON TRUE
	LEFT JOIN public.users u ON u.id = m.sender_id
	WHERE gm.user_id = $1::uuid AND gm.status = 'ACCEPTED'
	ORDER BY m.created_at DESC NULLS LAST`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("list group conversations: %w", err)
	}
	defer rows.Close()

	result := make([]message.GroupConversation, 0)
	for rows.Next() {
		var item message.GroupConversation
		if err := rows.Scan(
			&item.GroupID,
			&item.GroupName,
			&item.LastMessage,
			&item.LastMessageAt,
			&item.LastSenderName,
		); err != nil {
			return nil, fmt.Errorf("scan group conversations: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate group conversations: %w", err)
	}
	return result, nil
}

// IsGroupMember checks if a user is an accepted member of a group.
func (r *Repository) IsGroupMember(ctx context.Context, groupID, userID string) (bool, error) {
	const query = `SELECT EXISTS(
		SELECT 1 FROM public.group_members
		WHERE group_id = $1::uuid AND user_id = $2::uuid AND status = 'ACCEPTED'
	)`
	var exists bool
	if err := r.db.QueryRow(ctx, query, groupID, userID).Scan(&exists); err != nil {
		return false, fmt.Errorf("is group member: %w", err)
	}
	return exists, nil
}

// CreateGroupMessage inserts a message into a group chat.
func (r *Repository) CreateGroupMessage(ctx context.Context, senderID, groupID, content string) (*message.GroupMessage, error) {
	const query = `INSERT INTO public.messages (sender_id, group_id, content)
	VALUES ($1, $2, $3)
	RETURNING id::text,
		group_id::text,
		sender_id::text,
		(SELECT COALESCE(u.full_name, '') FROM public.users u WHERE u.id = sender_id),
		content,
		TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`

	var item message.GroupMessage
	if err := r.db.QueryRow(ctx, query, senderID, groupID, content).Scan(
		&item.ID,
		&item.GroupID,
		&item.SenderID,
		&item.SenderName,
		&item.Content,
		&item.CreatedAt,
	); err != nil {
		return nil, fmt.Errorf("create group message: %w", err)
	}
	return &item, nil
}

// GetOrCreateApartmentChat returns or creates the apartment group chat for the owner.
func (r *Repository) GetOrCreateApartmentChat(ctx context.Context, apartmentID, ownerID string) (*message.ApartmentChat, error) {
	var groupID, groupName string
	selectQuery := `SELECT g.id::text, COALESCE(g.name, '') FROM public.groups g
		WHERE g.apartment_id = $1::uuid AND g.created_by = $2::uuid AND g.status = 'ACCEPTED'
		LIMIT 1`
	err := r.db.QueryRow(ctx, selectQuery, apartmentID, ownerID).Scan(&groupID, &groupName)
	if err == nil {
		r.syncApartmentChatMembers(ctx, groupID, apartmentID, ownerID)
		return &message.ApartmentChat{GroupID: groupID, GroupName: groupName}, nil
	}

	var aptTitle string
	_ = r.db.QueryRow(ctx, `SELECT COALESCE(title,'') FROM public.apartments WHERE id=$1::uuid`, apartmentID).Scan(&aptTitle)
	if aptTitle == "" {
		aptTitle = "Apartment Chat"
	}

	insertQuery := `INSERT INTO public.groups (created_by, name, status, apartment_id, owner_accepted)
		VALUES ($1, $2, 'ACCEPTED', $3, true)
		RETURNING id::text, name`
	if err := r.db.QueryRow(ctx, insertQuery, ownerID, aptTitle, apartmentID).Scan(&groupID, &groupName); err != nil {
		return nil, fmt.Errorf("create apartment chat group: %w", err)
	}

	memberInsert := `INSERT INTO public.group_members (group_id, user_id, role, status, joined_at, member_accepted)
		VALUES ($1::uuid, $2::uuid, 'owner', 'ACCEPTED', NOW(), true)
		ON CONFLICT (group_id, user_id) DO NOTHING`
	_, _ = r.db.Exec(ctx, memberInsert, groupID, ownerID)

	r.syncApartmentChatMembers(ctx, groupID, apartmentID, ownerID)
	return &message.ApartmentChat{GroupID: groupID, GroupName: groupName}, nil
}

func (r *Repository) syncApartmentChatMembers(ctx context.Context, groupID, apartmentID, ownerID string) {
	const tenantQuery = `SELECT app.tenant_id::text FROM public.applications app
		WHERE app.apartment_id = $1::uuid AND app.status = 'FULLY_CONFIRMED' AND app.tenant_id IS NOT NULL`
	rows, err := r.db.Query(ctx, tenantQuery, apartmentID)
	if err != nil {
		return
	}
	defer rows.Close()
	for rows.Next() {
		var tenantID string
		if err := rows.Scan(&tenantID); err != nil {
			continue
		}
		if tenantID == ownerID {
			continue
		}
		addMember := `INSERT INTO public.group_members (group_id, user_id, role, status, joined_at, member_accepted)
			VALUES ($1::uuid, $2::uuid, 'member', 'ACCEPTED', NOW(), true)
			ON CONFLICT (group_id, user_id) DO NOTHING`
		_, _ = r.db.Exec(ctx, addMember, groupID, tenantID)
	}
}

// ListGroupMessages returns all messages for a group sorted by date ascending.
func (r *Repository) ListGroupMessages(ctx context.Context, groupID string) ([]message.GroupMessage, error) {
	const query = `SELECT
		m.id::text,
		m.group_id::text,
		m.sender_id::text,
		COALESCE(u.full_name, ''),
		m.content,
		TO_CHAR(m.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
	FROM public.messages m
	LEFT JOIN public.users u ON u.id = m.sender_id
	WHERE m.group_id = $1::uuid
	ORDER BY m.created_at ASC`

	rows, err := r.db.Query(ctx, query, groupID)
	if err != nil {
		return nil, fmt.Errorf("list group messages: %w", err)
	}
	defer rows.Close()

	result := make([]message.GroupMessage, 0)
	for rows.Next() {
		var item message.GroupMessage
		if err := rows.Scan(
			&item.ID,
			&item.GroupID,
			&item.SenderID,
			&item.SenderName,
			&item.Content,
			&item.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan group messages: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate group messages: %w", err)
	}
	return result, nil
}
