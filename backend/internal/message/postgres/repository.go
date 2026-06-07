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
	RETURNING id::text, sender_id::text, receiver_id::text, apartment_id::text, content,
		TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		COALESCE(TO_CHAR(read_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '') AS read_at`

	var item message.Record
	if err := r.db.QueryRow(ctx, query, senderID, receiverID, apartmentID, content).Scan(
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
		m.apartment_id::text,
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
			apartment_id,
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
		WHERE sender_id = $1::uuid OR receiver_id = $1::uuid
		ORDER BY
			apartment_id,
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
		WHERE mi.apartment_id = m.apartment_id
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
		apartment_id::text,
		content,
		TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		COALESCE(TO_CHAR(read_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '') AS read_at
	FROM public.messages
	WHERE apartment_id = $1::uuid
		AND (
			(sender_id = $2::uuid AND receiver_id = $3::uuid)
			OR
			(sender_id = $3::uuid AND receiver_id = $2::uuid)
		)
	ORDER BY created_at ASC`

	rows, err := r.db.Query(ctx, query, apartmentID, userID, otherUserID)
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
	WHERE apartment_id = $1::uuid
		AND sender_id = $2::uuid
		AND receiver_id = $3::uuid
		AND read_at IS NULL`

	cmdTag, err := r.db.Exec(ctx, query, apartmentID, otherUserID, userID)
	if err != nil {
		return 0, fmt.Errorf("mark conversation read: %w", err)
	}
	return int(cmdTag.RowsAffected()), nil
}
