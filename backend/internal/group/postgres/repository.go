package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/group"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository stores tenant group data in PostgreSQL.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a PostgreSQL tenant group repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// ListTenantGroups returns the groups related to a tenant.
func (r *Repository) ListTenantGroups(ctx context.Context, userID string, filters group.ListGroupsFilters) ([]group.Group, error) {
	query, args := buildListTenantGroupsQuery(userID, filters)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list tenant groups: %w", err)
	}
	defer rows.Close()

	result := make([]group.Group, 0)
	for rows.Next() {
		item, err := scanGroupSummary(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate tenant groups: %w", err)
	}

	return result, nil
}

// GetTenantGroupByID returns a group detail when the tenant is related to it.
func (r *Repository) GetTenantGroupByID(ctx context.Context, groupID, userID string) (*group.Group, error) {
	const query = `SELECT
		g.id::text,
		COALESCE(g.name, ''),
		COALESCE(g.description, ''),
		g.status,
		g.created_by::text,
		TO_CHAR(g.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		CASE
			WHEN g.created_by = $2 THEN 'creator'
			WHEN EXISTS (
				SELECT 1
				FROM public.group_members gm
				WHERE gm.group_id = g.id
					AND gm.user_id = $2
					AND gm.status = 'ACCEPTED'
			) THEN 'member'
			WHEN EXISTS (
				SELECT 1
				FROM public.group_invitations gi
				WHERE gi.group_id = g.id
					AND gi.invited_user_id = $2
					AND gi.status = 'PENDING'
			) THEN 'pending_invitation'
			ELSE 'viewer'
		END AS user_relation,
		COALESCE((
			SELECT gi.id::text
			FROM public.group_invitations gi
			WHERE gi.group_id = g.id
				AND gi.invited_user_id = $2
				AND gi.status = 'PENDING'
			ORDER BY gi.created_at DESC
			LIMIT 1
		), '') AS invitation_id,
		COALESCE((
			SELECT COUNT(*)
			FROM public.group_members gm
			WHERE gm.group_id = g.id
				AND gm.status = 'ACCEPTED'
		), 0)::int AS accepted_members_count,
		COALESCE((
			SELECT COUNT(*)
			FROM public.group_invitations gi
			WHERE gi.group_id = g.id
				AND gi.status = 'PENDING'
		), 0)::int AS pending_invitations_count,
		(
			COALESCE(g.owner_accepted, FALSE)
			AND NOT EXISTS (
				SELECT 1
				FROM public.group_members gm
				WHERE gm.group_id = g.id
					AND gm.status = 'ACCEPTED'
					AND gm.role <> 'owner'
					AND COALESCE(gm.member_accepted, FALSE) = FALSE
			)
		) AS is_fully_accepted,
		COALESCE((
			SELECT ROUND(AVG(tp.budget_max))::int
			FROM public.group_members gm
			LEFT JOIN public.tenant_profiles tp ON tp.user_id = gm.user_id
			WHERE gm.group_id = g.id
				AND gm.status = 'ACCEPTED'
		), 0)::int AS average_budget_max,
		COALESCE(a.id::text, '') AS apartment_id,
		COALESCE(a.title, '') AS apartment_title,
		COALESCE(a.address, '') AS apartment_address,
		COALESCE(a.area, '') AS apartment_area,
		COALESCE(a.total_spots, 0) AS total_spots,
		COALESCE(a.occupied_spots, 0) AS occupied_spots,
		COALESCE(a.available_spots, 0) AS available_spots,
		COALESCE(a.base_rent, 0) AS base_rent,
		COALESCE((
			SELECT ap.url
			FROM public.apartment_photos ap
			WHERE ap.apartment_id = a.id
			ORDER BY ap.position ASC, ap.created_at ASC
			LIMIT 1
		), '') AS image_url,
		COALESCE((
			SELECT app.id::text
			FROM public.applications app
			WHERE app.group_id = g.id
				AND app.apartment_id = g.apartment_id
			ORDER BY app.created_at DESC
			LIMIT 1
		), '') AS current_application_id,
		COALESCE((
			SELECT app.apartment_id::text
			FROM public.applications app
			WHERE app.group_id = g.id
				AND app.apartment_id = g.apartment_id
			ORDER BY app.created_at DESC
			LIMIT 1
		), '') AS current_application_apartment_id,
		COALESCE((
			SELECT app.group_id::text
			FROM public.applications app
			WHERE app.group_id = g.id
				AND app.apartment_id = g.apartment_id
			ORDER BY app.created_at DESC
			LIMIT 1
		), '') AS current_application_group_id,
		COALESCE((
			SELECT app.type
			FROM public.applications app
			WHERE app.group_id = g.id
				AND app.apartment_id = g.apartment_id
			ORDER BY app.created_at DESC
			LIMIT 1
		), '') AS current_application_type,
		COALESCE((
			SELECT app.status
			FROM public.applications app
			WHERE app.group_id = g.id
				AND app.apartment_id = g.apartment_id
			ORDER BY app.created_at DESC
			LIMIT 1
		), '') AS current_application_status,
		COALESCE((
			SELECT TO_CHAR(app.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
			FROM public.applications app
			WHERE app.group_id = g.id
				AND app.apartment_id = g.apartment_id
			ORDER BY app.created_at DESC
			LIMIT 1
		), '') AS current_application_created_at,
		COALESCE((
			SELECT gjr.id::text
			FROM public.group_join_requests gjr
			WHERE gjr.group_id = g.id
				AND gjr.requester_user_id = $2
			ORDER BY gjr.created_at DESC, gjr.updated_at DESC
			LIMIT 1
		), '') AS current_join_request_id,
		COALESCE((
			SELECT gjr.group_id::text
			FROM public.group_join_requests gjr
			WHERE gjr.group_id = g.id
				AND gjr.requester_user_id = $2
			ORDER BY gjr.created_at DESC, gjr.updated_at DESC
			LIMIT 1
		), '') AS current_join_request_group_id,
		COALESCE((
			SELECT gjr.requester_user_id::text
			FROM public.group_join_requests gjr
			WHERE gjr.group_id = g.id
				AND gjr.requester_user_id = $2
			ORDER BY gjr.created_at DESC, gjr.updated_at DESC
			LIMIT 1
		), '') AS current_join_request_requester_user_id,
		COALESCE((
			SELECT COALESCE(gjr.source, 'DIRECT_REQUEST')
			FROM public.group_join_requests gjr
			WHERE gjr.group_id = g.id
				AND gjr.requester_user_id = $2
			ORDER BY gjr.created_at DESC, gjr.updated_at DESC
			LIMIT 1
		), '') AS current_join_request_source,
		COALESCE((
			SELECT gjr.status
			FROM public.group_join_requests gjr
			WHERE gjr.group_id = g.id
				AND gjr.requester_user_id = $2
			ORDER BY gjr.created_at DESC, gjr.updated_at DESC
			LIMIT 1
		), '') AS current_join_request_status,
		COALESCE((
			SELECT TO_CHAR(gjr.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
			FROM public.group_join_requests gjr
			WHERE gjr.group_id = g.id
				AND gjr.requester_user_id = $2
			ORDER BY gjr.created_at DESC, gjr.updated_at DESC
			LIMIT 1
		), '') AS current_join_request_created_at,
		COALESCE((
			SELECT TO_CHAR(gjr.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
			FROM public.group_join_requests gjr
			WHERE gjr.group_id = g.id
				AND gjr.requester_user_id = $2
			ORDER BY gjr.created_at DESC, gjr.updated_at DESC
			LIMIT 1
		), '') AS current_join_request_updated_at
	FROM public.groups g
	LEFT JOIN public.apartments a ON a.id = g.apartment_id
	WHERE g.id = $1`

	row := r.db.QueryRow(ctx, query, groupID, userID)

	item, err := scanGroupSummary(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get tenant group by id: %w", err)
	}

	members, err := r.listGroupMembers(ctx, groupID, userID)
	if err != nil {
		return nil, err
	}
	item.Members = members

	invitations, err := r.listPendingInvitations(ctx, groupID)
	if err != nil {
		return nil, err
	}
	item.PendingInvitations = invitations

	if item.UserRelation == group.UserRelationCreator || item.UserRelation == group.UserRelationMember {
		joinRequests, joinErr := r.ListJoinRequests(ctx, groupID)
		if joinErr != nil {
			return nil, joinErr
		}
		item.JoinRequests = joinRequests
	}

	return &item, nil
}

// CreateGroup inserts a new tenant group.
func (r *Repository) CreateGroup(ctx context.Context, creatorID string, input group.CreateGroupInput) (string, error) {
	const query = `INSERT INTO public.groups
		(created_by, name, description, apartment_id, status)
	VALUES
		($1, $2, $3, $4, 'FORMING')
	RETURNING id::text`

	var apartmentID interface{}
	if strings.TrimSpace(input.ApartmentID) != "" {
		apartmentID = strings.TrimSpace(input.ApartmentID)
	}

	var id string
	if err := r.db.QueryRow(
		ctx,
		query,
		creatorID,
		input.Name,
		nullIfEmpty(input.Description),
		apartmentID,
	).Scan(&id); err != nil {
		return "", fmt.Errorf("create group: %w", err)
	}

	return id, nil
}

// AddGroupOwnerMember adds the group creator as accepted owner.
func (r *Repository) AddGroupOwnerMember(ctx context.Context, groupID, creatorID string) error {
	const query = `INSERT INTO public.group_members
		(group_id, user_id, role, status, joined_at, member_accepted)
	VALUES
		($1, $2, 'owner', 'ACCEPTED', NOW(), TRUE)
	ON CONFLICT (group_id, user_id)
	DO UPDATE SET
		role = 'owner',
		status = 'ACCEPTED',
		joined_at = COALESCE(public.group_members.joined_at, NOW()),
		member_accepted = TRUE`

	if _, err := r.db.Exec(ctx, query, groupID, creatorID); err != nil {
		return fmt.Errorf("add group owner member: %w", err)
	}

	return nil
}

// DeleteGroup deletes a tenant group and relies on database cascades for related records.
func (r *Repository) DeleteGroup(ctx context.Context, groupID string) error {
	const query = `DELETE FROM public.groups
	WHERE id = $1`

	result, err := r.db.Exec(ctx, query, groupID)
	if err != nil {
		return fmt.Errorf("delete group: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("group not found")
	}

	return nil
}

// CreatePendingInvitations creates pending invitations for selected tenants.
func (r *Repository) CreatePendingInvitations(ctx context.Context, groupID, invitedBy string, invitedUserIDs []string) error {
	const query = `INSERT INTO public.group_invitations
		(group_id, invited_by, invited_user_id, status)
	SELECT $1, $2, $3, 'PENDING'
	WHERE NOT EXISTS (
		SELECT 1
		FROM public.group_invitations gi
		WHERE gi.group_id = $1
			AND gi.invited_user_id = $3
			AND gi.status = 'PENDING'
	)`

	for _, invitedUserID := range invitedUserIDs {
		if strings.TrimSpace(invitedUserID) == "" {
			continue
		}
		if _, err := r.db.Exec(ctx, query, groupID, invitedBy, invitedUserID); err != nil {
			return fmt.Errorf("create pending invitation: %w", err)
		}
	}

	return nil
}

// ListGroupCandidates returns tenant profiles that can be invited to groups.
func (r *Repository) ListGroupCandidates(ctx context.Context, currentUserID string, filters group.CandidateFilters) ([]group.Candidate, error) {
	query, args := buildListGroupCandidatesQuery(currentUserID, filters)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list group candidates: %w", err)
	}
	defer rows.Close()

	result := make([]group.Candidate, 0)
	for rows.Next() {
		var item group.Candidate
		if err := rows.Scan(
			&item.UserID,
			&item.Name,
			&item.Email,
			&item.AvatarURL,
			&item.Age,
			&item.Sex,
			&item.Situation,
			&item.Degree,
			&item.Profession,
			&item.BudgetMax,
			&item.PreferredArea,
			&item.Pets,
			&item.Smoking,
			&item.SocializationLevel,
			&item.NightlifeLevel,
		); err != nil {
			return nil, fmt.Errorf("scan group candidate: %w", err)
		}
		result = append(result, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate group candidates: %w", err)
	}

	return result, nil
}

// FilterInvitableTenantIDs keeps only tenant IDs that are not already accepted members and do not have a pending invitation.
func (r *Repository) FilterInvitableTenantIDs(ctx context.Context, groupID string, userIDs []string) ([]string, error) {
	if len(userIDs) == 0 {
		return []string{}, nil
	}

	const query = `SELECT u.id::text
	FROM public.users u
	WHERE u.id::text = ANY($1)
		AND u.role = 'tenant'
		AND NOT EXISTS (
			SELECT 1
			FROM public.group_members gm
			WHERE gm.group_id = $2
				AND gm.user_id = u.id
				AND gm.status = 'ACCEPTED'
		)
		AND NOT EXISTS (
			SELECT 1
			FROM public.group_invitations gi
			WHERE gi.group_id = $2
				AND gi.invited_user_id = u.id
				AND gi.status = 'PENDING'
		)
	ORDER BY u.full_name ASC`

	rows, err := r.db.Query(ctx, query, userIDs, groupID)
	if err != nil {
		return nil, fmt.Errorf("filter invitable tenant ids: %w", err)
	}
	defer rows.Close()

	result := make([]string, 0, len(userIDs))
	for rows.Next() {
		var userID string
		if err := rows.Scan(&userID); err != nil {
			return nil, fmt.Errorf("scan invitable tenant id: %w", err)
		}
		result = append(result, userID)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate invitable tenant ids: %w", err)
	}

	return result, nil
}

// GetApartmentCapacity returns the total spots for an apartment.
func (r *Repository) GetApartmentCapacity(ctx context.Context, apartmentID string) (int, error) {
	const query = `SELECT total_spots
	FROM public.apartments
	WHERE id = $1
		AND status IN ('AVAILABLE', 'PARTIALLY_OCCUPIED')`

	var totalSpots int
	if err := r.db.QueryRow(ctx, query, apartmentID).Scan(&totalSpots); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, fmt.Errorf("apartment not found or not available")
		}
		return 0, fmt.Errorf("get apartment capacity: %w", err)
	}

	return totalSpots, nil
}

// CountAcceptedMembersAndPendingInvitations counts accepted members and pending invitations.
func (r *Repository) CountAcceptedMembersAndPendingInvitations(ctx context.Context, groupID string) (int, error) {
	const query = `SELECT
		(
			SELECT COUNT(*)
			FROM public.group_members gm
			WHERE gm.group_id = $1
				AND gm.status = 'ACCEPTED'
		)
		+
		(
			SELECT COUNT(*)
			FROM public.group_invitations gi
			WHERE gi.group_id = $1
				AND gi.status = 'PENDING'
		) AS total_people`

	var total int
	if err := r.db.QueryRow(ctx, query, groupID).Scan(&total); err != nil {
		return 0, fmt.Errorf("count group people: %w", err)
	}

	return total, nil
}

// GetInvitationForUser returns an invitation that belongs to the given tenant.
func (r *Repository) GetInvitationForUser(ctx context.Context, invitationID, userID string) (*group.Invitation, error) {
	const query = `SELECT
		gi.id::text,
		gi.group_id::text,
		gi.invited_by::text,
		gi.invited_user_id::text,
		gi.status,
		TO_CHAR(gi.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		COALESCE(TO_CHAR(gi.responded_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '') AS responded_at
	FROM public.group_invitations gi
	WHERE gi.id = $1
		AND gi.invited_user_id = $2`

	var item group.Invitation
	if err := r.db.QueryRow(ctx, query, invitationID, userID).Scan(
		&item.ID,
		&item.GroupID,
		&item.InvitedBy,
		&item.InvitedUserID,
		&item.Status,
		&item.CreatedAt,
		&item.RespondedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get invitation for user: %w", err)
	}

	return &item, nil
}

// AcceptInvitation marks a pending invitation as accepted.
func (r *Repository) AcceptInvitation(ctx context.Context, invitationID, userID string) error {
	const query = `UPDATE public.group_invitations
	SET status = 'ACCEPTED',
		responded_at = NOW()
	WHERE id = $1
		AND invited_user_id = $2
		AND status = 'PENDING'`

	result, err := r.db.Exec(ctx, query, invitationID, userID)
	if err != nil {
		return fmt.Errorf("accept invitation: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("pending invitation not found")
	}

	return nil
}

// RejectInvitation marks a pending invitation as rejected.
func (r *Repository) RejectInvitation(ctx context.Context, invitationID, userID string) error {
	const query = `UPDATE public.group_invitations
	SET status = 'REJECTED',
		responded_at = NOW()
	WHERE id = $1
		AND invited_user_id = $2
		AND status = 'PENDING'`

	result, err := r.db.Exec(ctx, query, invitationID, userID)
	if err != nil {
		return fmt.Errorf("reject invitation: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("pending invitation not found")
	}

	return nil
}

// AddGroupMember adds or restores a tenant as accepted group member.
func (r *Repository) AddGroupMember(ctx context.Context, groupID, userID, role string) error {
	const query = `INSERT INTO public.group_members
		(group_id, user_id, role, status, joined_at, member_accepted)
	VALUES
		($1, $2, $3, 'ACCEPTED', NOW(), FALSE)
	ON CONFLICT (group_id, user_id)
	DO UPDATE SET
		role = EXCLUDED.role,
		status = 'ACCEPTED',
		joined_at = COALESCE(public.group_members.joined_at, NOW())`

	if _, err := r.db.Exec(ctx, query, groupID, userID, role); err != nil {
		return fmt.Errorf("add group member: %w", err)
	}

	return nil
}

// IsGroupCreator checks whether the tenant created the group.
func (r *Repository) IsGroupCreator(ctx context.Context, groupID, userID string) (bool, error) {
	const query = `SELECT EXISTS (
		SELECT 1
		FROM public.groups
		WHERE id = $1
			AND created_by = $2
	)`

	var exists bool
	if err := r.db.QueryRow(ctx, query, groupID, userID).Scan(&exists); err != nil {
		return false, fmt.Errorf("check group creator: %w", err)
	}

	return exists, nil
}

// CanUserAcceptGroup checks whether the tenant can accept the group.
func (r *Repository) CanUserAcceptGroup(ctx context.Context, groupID, userID string) (bool, error) {
	const query = `SELECT (
		EXISTS (
			SELECT 1
			FROM public.groups g
			WHERE g.id = $1
				AND g.created_by = $2
		)
		OR EXISTS (
			SELECT 1
			FROM public.group_members gm
			WHERE gm.group_id = $1
				AND gm.user_id = $2
				AND gm.status = 'ACCEPTED'
		)
	)`

	var canAccept bool
	if err := r.db.QueryRow(ctx, query, groupID, userID).Scan(&canAccept); err != nil {
		return false, fmt.Errorf("check group accept permission: %w", err)
	}

	return canAccept, nil
}

// AcceptGroupForUser marks the group acceptance for the owner/member.
func (r *Repository) AcceptGroupForUser(ctx context.Context, groupID, userID string) error {
	const ownerQuery = `UPDATE public.groups
	SET owner_accepted = TRUE
	WHERE id = $1
		AND created_by = $2`

	ownerResult, err := r.db.Exec(ctx, ownerQuery, groupID, userID)
	if err != nil {
		return fmt.Errorf("accept group as owner: %w", err)
	}
	if ownerResult.RowsAffected() > 0 {
		return nil
	}

	const memberQuery = `UPDATE public.group_members
	SET member_accepted = TRUE
	WHERE group_id = $1
		AND user_id = $2
		AND status = 'ACCEPTED'`

	memberResult, err := r.db.Exec(ctx, memberQuery, groupID, userID)
	if err != nil {
		return fmt.Errorf("accept group as member: %w", err)
	}
	if memberResult.RowsAffected() == 0 {
		return fmt.Errorf("group member not found")
	}

	return nil
}

// UpdateGroupApartment assigns or removes the apartment linked to a group.
func (r *Repository) UpdateGroupApartment(ctx context.Context, groupID string, apartmentID *string) error {
	const query = `UPDATE public.groups
	SET apartment_id = $2
	WHERE id = $1`

	result, err := r.db.Exec(ctx, query, groupID, apartmentID)
	if err != nil {
		return fmt.Errorf("update group apartment: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("group not found")
	}

	return nil
}

// FilterExistingTenantIDs keeps only user IDs that belong to tenant users.
func (r *Repository) FilterExistingTenantIDs(ctx context.Context, userIDs []string) ([]string, error) {
	if len(userIDs) == 0 {
		return []string{}, nil
	}

	const query = `SELECT u.id::text
	FROM public.users u
	WHERE u.id::text = ANY($1)
		AND u.role = 'tenant'
	ORDER BY u.full_name ASC`

	rows, err := r.db.Query(ctx, query, userIDs)
	if err != nil {
		return nil, fmt.Errorf("filter existing tenant ids: %w", err)
	}
	defer rows.Close()

	result := make([]string, 0, len(userIDs))
	for rows.Next() {
		var userID string
		if err := rows.Scan(&userID); err != nil {
			return nil, fmt.Errorf("scan existing tenant id: %w", err)
		}
		result = append(result, userID)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate existing tenant ids: %w", err)
	}

	return result, nil
}

// HasPendingJoinRequest checks whether the user already has a pending request for the group.
func (r *Repository) HasPendingJoinRequest(ctx context.Context, groupID, requesterUserID string) (bool, error) {
	const query = `SELECT EXISTS (
		SELECT 1
		FROM public.group_join_requests gjr
		WHERE gjr.group_id = $1
			AND gjr.requester_user_id = $2
			AND gjr.status = 'PENDING'
	)`

	var exists bool
	if err := r.db.QueryRow(ctx, query, groupID, requesterUserID).Scan(&exists); err != nil {
		return false, fmt.Errorf("check pending join request: %w", err)
	}

	return exists, nil
}

// HasRejectedJoinRequest checks whether the user already has a rejected request for the group.
func (r *Repository) HasRejectedJoinRequest(ctx context.Context, groupID, requesterUserID string) (bool, error) {
	const query = `SELECT EXISTS (
		SELECT 1
		FROM public.group_join_requests gjr
		WHERE gjr.group_id = $1
			AND gjr.requester_user_id = $2
			AND gjr.status = 'REJECTED'
	)`

	var exists bool
	if err := r.db.QueryRow(ctx, query, groupID, requesterUserID).Scan(&exists); err != nil {
		return false, fmt.Errorf("check rejected join request: %w", err)
	}

	return exists, nil
}

// CreateJoinRequest creates a pending join request for a group.
func (r *Repository) CreateJoinRequest(ctx context.Context, groupID, requesterUserID, source string) (string, error) {
	const query = `INSERT INTO public.group_join_requests
		(group_id, requester_user_id, source, status)
	VALUES
		($1, $2, $3, 'PENDING')
	RETURNING id::text`

	var requestID string
	if err := r.db.QueryRow(ctx, query, groupID, requesterUserID, source).Scan(&requestID); err != nil {
		return "", fmt.Errorf("create join request: %w", err)
	}

	return requestID, nil
}

// CanUserReviewJoinRequests checks if the user is an accepted group member.
func (r *Repository) CanUserReviewJoinRequests(ctx context.Context, groupID, userID string) (bool, error) {
	const query = `SELECT EXISTS (
		SELECT 1
		FROM public.group_members gm
		WHERE gm.group_id = $1
			AND gm.user_id = $2
			AND gm.status = 'ACCEPTED'
	)`

	var canReview bool
	if err := r.db.QueryRow(ctx, query, groupID, userID).Scan(&canReview); err != nil {
		return false, fmt.Errorf("check join request review permission: %w", err)
	}

	return canReview, nil
}

// ListJoinRequests returns pending join requests and their votes.
func (r *Repository) ListJoinRequests(ctx context.Context, groupID string) ([]group.JoinRequest, error) {
	const query = `SELECT
		gjr.id::text,
		gjr.group_id::text,
		gjr.requester_user_id::text,
		COALESCE(gjr.source, 'DIRECT_REQUEST'),
		gjr.status,
		TO_CHAR(gjr.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		TO_CHAR(gjr.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
		u.id::text,
		u.full_name,
		u.email,
		COALESCE(u.avatar_url, ''),
		COALESCE(tp.age, 0),
		COALESCE(tp.sex, ''),
		COALESCE(tp.tenant_situation, ''),
		COALESCE(tp.degree, ''),
		COALESCE(tp.profession, ''),
		COALESCE(tp.budget_max, 0),
		COALESCE(tp.preferred_area, ''),
		COALESCE(tp.pets, FALSE),
		COALESCE(tp.smoking, FALSE),
		COALESCE(tp.socialization_level, ''),
		COALESCE(tp.nightlife_level, '')
	FROM public.group_join_requests gjr
	INNER JOIN public.users u ON u.id = gjr.requester_user_id
	LEFT JOIN public.tenant_profiles tp ON tp.user_id = u.id
	WHERE gjr.group_id = $1
		AND gjr.status = 'PENDING'
	ORDER BY gjr.created_at DESC`

	rows, err := r.db.Query(ctx, query, groupID)
	if err != nil {
		return nil, fmt.Errorf("list join requests: %w", err)
	}
	defer rows.Close()

	result := make([]group.JoinRequest, 0)
	for rows.Next() {
		var item group.JoinRequest
		if err := rows.Scan(append([]any{
			&item.ID,
			&item.GroupID,
			&item.RequesterUserID,
			&item.Source,
			&item.Status,
			&item.CreatedAt,
			&item.UpdatedAt,
		}, candidateProfileDests(&item.Requester)...)...); err != nil {
			return nil, fmt.Errorf("scan join request: %w", err)
		}

		votes, voteErr := r.listJoinRequestVotes(ctx, item.ID)
		if voteErr != nil {
			return nil, voteErr
		}
		item.Votes = votes
		result = append(result, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate join requests: %w", err)
	}

	return result, nil
}

// CanUserVoteJoinRequest checks if user can vote a pending join request.
func (r *Repository) CanUserVoteJoinRequest(ctx context.Context, requestID, voterUserID string) (bool, error) {
	const query = `SELECT EXISTS (
		SELECT 1
		FROM public.group_join_requests gjr
		INNER JOIN public.group_members gm ON gm.group_id = gjr.group_id
		WHERE gjr.id = $1
			AND gjr.status = 'PENDING'
			AND gm.user_id = $2
			AND gm.status = 'ACCEPTED'
	)`

	var canVote bool
	if err := r.db.QueryRow(ctx, query, requestID, voterUserID).Scan(&canVote); err != nil {
		return false, fmt.Errorf("check join request vote permission: %w", err)
	}

	return canVote, nil
}

// VoteJoinRequest casts or updates a member vote.
func (r *Repository) VoteJoinRequest(ctx context.Context, requestID, voterUserID, decision string) error {
	const query = `INSERT INTO public.group_join_request_votes
		(request_id, voter_user_id, decision)
	VALUES
		($1, $2, $3)
	ON CONFLICT (request_id, voter_user_id)
	DO UPDATE SET
		decision = EXCLUDED.decision,
		updated_at = NOW()`

	if _, err := r.db.Exec(ctx, query, requestID, voterUserID, decision); err != nil {
		return fmt.Errorf("vote join request: %w", err)
	}

	return nil
}

// FinalizeJoinRequestApproval updates request status when it reaches a terminal consensus and adds the member atomically.
func (r *Repository) FinalizeJoinRequestApproval(ctx context.Context, requestID string) (string, bool, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return "", false, fmt.Errorf("begin finalize join request approval: %w", err)
	}
	defer rollbackTx(ctx, tx)

	joinRequest, err := loadJoinRequestForUpdate(ctx, tx, requestID)
	if err != nil {
		return "", false, err
	}
	if joinRequest == nil {
		return "", false, nil
	}
	if joinRequest.Status != group.JoinRequestStatusPending {
		return joinRequest.Status, false, tx.Commit(ctx)
	}

	hasReject, err := hasRejectVote(ctx, tx, requestID)
	if err != nil {
		return "", false, err
	}
	if hasReject {
		return rejectJoinRequestAs(ctx, tx, requestID, group.JoinRequestStatusRejected, "set join request rejected", "commit rejected join request")
	}

	return finalizePendingJoinRequest(ctx, tx, requestID, joinRequest.GroupID, joinRequest.RequesterUserID)
}

func finalizePendingJoinRequest(ctx context.Context, tx pgx.Tx, requestID, groupID, requesterUserID string) (string, bool, error) {
	approvals, expected, err := countJoinRequestApprovals(ctx, tx, requestID)
	if err != nil {
		return "", false, err
	}
	if expected == 0 || approvals < expected {
		if err := tx.Commit(ctx); err != nil {
			return "", false, fmt.Errorf("commit pending join request: %w", err)
		}
		return group.JoinRequestStatusPending, false, nil
	}

	var totalSpots int
	if err := tx.QueryRow(ctx, `SELECT COALESCE(a.total_spots, 0)
	FROM public.groups g
	LEFT JOIN public.apartments a ON a.id = g.apartment_id
	WHERE g.id = $1
	FOR UPDATE OF g`, groupID).Scan(&totalSpots); err != nil {
		return "", false, fmt.Errorf("lock group for join request finalization: %w", err)
	}

	var acceptedMembers int
	if err := tx.QueryRow(ctx, `SELECT COUNT(*)::int
	FROM public.group_members
	WHERE group_id = $1
		AND status = 'ACCEPTED'`, groupID).Scan(&acceptedMembers); err != nil {
		return "", false, fmt.Errorf("count accepted members for join request finalization: %w", err)
	}

	if totalSpots > 0 && acceptedMembers+1 > totalSpots {
		return rejectJoinRequestByCapacity(ctx, tx, requestID, groupID, totalSpots)
	}
	return approveJoinRequest(ctx, tx, requestID, groupID, requesterUserID, totalSpots)
}

func rejectJoinRequestByCapacity(ctx context.Context, tx pgx.Tx, requestID, groupID string, totalSpots int) (string, bool, error) {
	if _, err := tx.Exec(ctx, `UPDATE public.group_join_requests SET status = 'REJECTED', updated_at = NOW() WHERE id = $1 AND status = 'PENDING'`, requestID); err != nil {
		return "", false, fmt.Errorf("reject full-capacity join request: %w", err)
	}
	if err := closePendingGroupAdmissionsTx(ctx, tx, groupID, totalSpots); err != nil {
		return "", false, err
	}
	if err := tx.Commit(ctx); err != nil {
		return "", false, fmt.Errorf("commit full-capacity join request rejection: %w", err)
	}
	return group.JoinRequestStatusRejected, true, nil
}

func approveJoinRequest(ctx context.Context, tx pgx.Tx, requestID, groupID, requesterUserID string, totalSpots int) (string, bool, error) {
	if _, err := tx.Exec(ctx, `UPDATE public.group_join_requests SET status = 'APPROVED', updated_at = NOW() WHERE id = $1 AND status = 'PENDING'`, requestID); err != nil {
		return "", false, fmt.Errorf("set join request approved: %w", err)
	}
	if err := addApprovedJoinRequestMember(ctx, tx, groupID, requesterUserID); err != nil {
		return "", false, err
	}
	if err := closePendingGroupAdmissionsTx(ctx, tx, groupID, totalSpots); err != nil {
		return "", false, err
	}

	if err := tx.Commit(ctx); err != nil {
		return "", false, fmt.Errorf("commit approved join request: %w", err)
	}
	return group.JoinRequestStatusApproved, true, nil
}

func loadJoinRequestForUpdate(ctx context.Context, tx pgx.Tx, requestID string) (*group.JoinRequest, error) {
	const query = `SELECT
		gjr.id::text,
		gjr.group_id::text,
		gjr.requester_user_id::text,
		COALESCE(gjr.source, 'DIRECT_REQUEST'),
		gjr.status,
		TO_CHAR(gjr.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		TO_CHAR(gjr.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at
	FROM public.group_join_requests gjr
	WHERE gjr.id = $1
	FOR UPDATE`

	var item group.JoinRequest
	if err := tx.QueryRow(ctx, query, requestID).Scan(
		&item.ID,
		&item.GroupID,
		&item.RequesterUserID,
		&item.Source,
		&item.Status,
		&item.CreatedAt,
		&item.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("load join request for finalization: %w", err)
	}
	return &item, nil
}

func hasRejectVote(ctx context.Context, tx pgx.Tx, requestID string) (bool, error) {
	var hasReject bool
	if err := tx.QueryRow(ctx,
		`SELECT EXISTS (SELECT 1 FROM public.group_join_request_votes WHERE request_id = $1 AND decision = 'REJECT')`,
		requestID,
	).Scan(&hasReject); err != nil {
		return false, fmt.Errorf("check reject votes: %w", err)
	}
	return hasReject, nil
}

func countJoinRequestApprovals(ctx context.Context, tx pgx.Tx, requestID string) (approvals int, expected int, err error) {
	const query = `SELECT
		COALESCE((
			SELECT COUNT(*)
			FROM public.group_join_request_votes gjrv
			WHERE gjrv.request_id = $1
				AND gjrv.decision = 'APPROVE'
		), 0)::int,
		COALESCE((
			SELECT COUNT(*)
			FROM public.group_members gm
			INNER JOIN public.group_join_requests gjr ON gjr.group_id = gm.group_id
			WHERE gjr.id = $1
				AND gm.status = 'ACCEPTED'
		), 0)::int`
	if err := tx.QueryRow(ctx, query, requestID).Scan(&approvals, &expected); err != nil {
		return 0, 0, fmt.Errorf("count join request approvals: %w", err)
	}
	return approvals, expected, nil
}

func rejectJoinRequestAs(ctx context.Context, tx pgx.Tx, requestID, status, updateWrap, commitWrap string) (string, bool, error) {
	if _, err := tx.Exec(ctx, `UPDATE public.group_join_requests SET status = $2, updated_at = NOW() WHERE id = $1 AND status = 'PENDING'`, requestID, status); err != nil {
		return "", false, fmt.Errorf("%s: %w", updateWrap, err)
	}
	if err := tx.Commit(ctx); err != nil {
		return "", false, fmt.Errorf("%s: %w", commitWrap, err)
	}
	return status, true, nil
}

func addApprovedJoinRequestMember(ctx context.Context, tx pgx.Tx, groupID, requesterUserID string) error {
	if _, err := tx.Exec(ctx, `INSERT INTO public.group_members
		(group_id, user_id, role, status, joined_at, member_accepted)
	VALUES
		($1, $2, $3, 'ACCEPTED', NOW(), TRUE)
	ON CONFLICT (group_id, user_id)
	DO UPDATE SET
		role = EXCLUDED.role,
		status = 'ACCEPTED',
		joined_at = COALESCE(public.group_members.joined_at, NOW()),
		member_accepted = TRUE`, groupID, requesterUserID, group.MemberRoleMember); err != nil {
		return fmt.Errorf("add approved join request member: %w", err)
	}
	return nil
}

func closePendingGroupAdmissionsTx(ctx context.Context, tx pgx.Tx, groupID string, totalSpots int) error {
	if totalSpots <= 0 {
		return nil
	}

	var acceptedMembers int
	if err := tx.QueryRow(ctx, `SELECT COUNT(*)::int FROM public.group_members WHERE group_id = $1 AND status = 'ACCEPTED'`, groupID).Scan(&acceptedMembers); err != nil {
		return fmt.Errorf("count accepted members while closing pending admissions: %w", err)
	}
	if acceptedMembers < totalSpots {
		return nil
	}

	if _, err := tx.Exec(ctx, `UPDATE public.group_join_requests
	SET status = 'REJECTED', updated_at = NOW()
	WHERE group_id = $1
		AND status = 'PENDING'`, groupID); err != nil {
		return fmt.Errorf("close pending join requests for full group: %w", err)
	}
	if _, err := tx.Exec(ctx, `UPDATE public.group_invitations
	SET status = 'EXPIRED', responded_at = NOW()
	WHERE group_id = $1
		AND status = 'PENDING'`, groupID); err != nil {
		return fmt.Errorf("expire pending invitations for full group: %w", err)
	}
	return nil
}

// ResolveJoinRequestStatus updates request status when it reaches a terminal consensus.
func (r *Repository) ResolveJoinRequestStatus(ctx context.Context, requestID string) (string, bool, error) {
	const rejectExistsQuery = `SELECT EXISTS (
		SELECT 1
		FROM public.group_join_request_votes gjrv
		WHERE gjrv.request_id = $1
			AND gjrv.decision = 'REJECT'
	)`

	var hasReject bool
	if err := r.db.QueryRow(ctx, rejectExistsQuery, requestID).Scan(&hasReject); err != nil {
		return "", false, fmt.Errorf("check reject votes: %w", err)
	}
	if hasReject {
		if _, err := r.db.Exec(ctx, `UPDATE public.group_join_requests SET status = 'REJECTED', updated_at = NOW() WHERE id = $1 AND status = 'PENDING'`, requestID); err != nil {
			return "", false, fmt.Errorf("set join request rejected: %w", err)
		}
		return group.JoinRequestStatusRejected, true, nil
	}

	const countsQuery = `SELECT
		COALESCE((
			SELECT COUNT(*)
			FROM public.group_join_request_votes gjrv
			WHERE gjrv.request_id = $1
				AND gjrv.decision = 'APPROVE'
		), 0)::int,
		COALESCE((
			SELECT COUNT(*)
			FROM public.group_members gm
			INNER JOIN public.group_join_requests gjr ON gjr.group_id = gm.group_id
			WHERE gjr.id = $1
				AND gm.status = 'ACCEPTED'
		), 0)::int`

	var approvals int
	var expected int
	if err := r.db.QueryRow(ctx, countsQuery, requestID).Scan(&approvals, &expected); err != nil {
		return "", false, fmt.Errorf("count join request approvals: %w", err)
	}

	if expected > 0 && approvals >= expected {
		if _, err := r.db.Exec(ctx, `UPDATE public.group_join_requests SET status = 'APPROVED', updated_at = NOW() WHERE id = $1 AND status = 'PENDING'`, requestID); err != nil {
			return "", false, fmt.Errorf("set join request approved: %w", err)
		}
		return group.JoinRequestStatusApproved, true, nil
	}

	return group.JoinRequestStatusPending, false, nil
}

// GetJoinRequest returns a join request by id.
func (r *Repository) GetJoinRequest(ctx context.Context, requestID string) (*group.JoinRequest, error) {
	const query = `SELECT
		id::text,
		group_id::text,
		requester_user_id::text,
		COALESCE(source, 'DIRECT_REQUEST'),
		status,
		TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		TO_CHAR(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at
	FROM public.group_join_requests
	WHERE id = $1`

	var item group.JoinRequest
	if err := r.db.QueryRow(ctx, query, requestID).Scan(
		&item.ID,
		&item.GroupID,
		&item.RequesterUserID,
		&item.Source,
		&item.Status,
		&item.CreatedAt,
		&item.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get join request: %w", err)
	}

	return &item, nil
}

// CancelJoinRequest cancels a pending request owned by the requester.
func (r *Repository) CancelJoinRequest(ctx context.Context, requestID, requesterUserID string) error {
	const query = `UPDATE public.group_join_requests
	SET status = 'CANCELLED',
		updated_at = NOW()
	WHERE id = $1
		AND requester_user_id = $2
		AND status = 'PENDING'`

	result, err := r.db.Exec(ctx, query, requestID, requesterUserID)
	if err != nil {
		return fmt.Errorf("cancel join request: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("pending join request not found")
	}

	return nil
}

func (r *Repository) listJoinRequestVotes(ctx context.Context, requestID string) ([]group.JoinRequestVote, error) {
	const query = `SELECT
		gjrv.request_id::text,
		gjrv.voter_user_id::text,
		gjrv.decision,
		TO_CHAR(gjrv.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		TO_CHAR(gjrv.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
		u.full_name
	FROM public.group_join_request_votes gjrv
	INNER JOIN public.users u ON u.id = gjrv.voter_user_id
	WHERE gjrv.request_id = $1
	ORDER BY gjrv.created_at ASC`

	rows, err := r.db.Query(ctx, query, requestID)
	if err != nil {
		return nil, fmt.Errorf("list join request votes: %w", err)
	}
	defer rows.Close()

	result := make([]group.JoinRequestVote, 0)
	for rows.Next() {
		var vote group.JoinRequestVote
		if err := rows.Scan(
			&vote.RequestID,
			&vote.VoterUserID,
			&vote.Decision,
			&vote.CreatedAt,
			&vote.UpdatedAt,
			&vote.VoterName,
		); err != nil {
			return nil, fmt.Errorf("scan join request vote: %w", err)
		}
		result = append(result, vote)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate join request votes: %w", err)
	}

	return result, nil
}

func (r *Repository) listGroupMembers(ctx context.Context, groupID, currentUserID string) ([]group.Member, error) {
	const query = `SELECT
		u.id::text,
		u.full_name,
		u.email,
		COALESCE(u.avatar_url, ''),
		gm.role,
		gm.status,
		COALESCE(tp.age, 0),
		COALESCE(tp.sex, ''),
		COALESCE(tp.tenant_situation, ''),
		COALESCE(tp.degree, ''),
		COALESCE(tp.profession, ''),
		COALESCE(tp.budget_max, 0),
		COALESCE(tp.preferred_area, ''),
		COALESCE(tp.pets, FALSE),
		COALESCE(tp.smoking, FALSE),
		COALESCE(tp.socialization_level, ''),
		COALESCE(tp.nightlife_level, ''),
		COALESCE(gm.member_accepted, FALSE),
		(u.id = $2) AS is_current_user
	FROM public.group_members gm
	INNER JOIN public.users u ON u.id = gm.user_id
	LEFT JOIN public.tenant_profiles tp ON tp.user_id = u.id
	WHERE gm.group_id = $1
		AND gm.status = 'ACCEPTED'
	ORDER BY
		CASE WHEN gm.role = 'owner' THEN 0 ELSE 1 END,
		gm.joined_at ASC NULLS LAST,
		u.full_name ASC`

	rows, err := r.db.Query(ctx, query, groupID, currentUserID)
	if err != nil {
		return nil, fmt.Errorf("list group members: %w", err)
	}
	defer rows.Close()

	result := make([]group.Member, 0)
	for rows.Next() {
		var item group.Member
		if err := rows.Scan(
			&item.UserID,
			&item.Name,
			&item.Email,
			&item.AvatarURL,
			&item.Role,
			&item.Status,
			&item.Age,
			&item.Sex,
			&item.Situation,
			&item.Degree,
			&item.Profession,
			&item.BudgetMax,
			&item.PreferredArea,
			&item.Pets,
			&item.Smoking,
			&item.SocializationLevel,
			&item.NightlifeLevel,
			&item.HasAccepted,
			&item.IsCurrentUser,
		); err != nil {
			return nil, fmt.Errorf("scan group member: %w", err)
		}
		result = append(result, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate group members: %w", err)
	}

	return result, nil
}

func (r *Repository) listPendingInvitations(ctx context.Context, groupID string) ([]group.Invitation, error) {
	const query = `SELECT
		gi.id::text,
		gi.group_id::text,
		gi.invited_by::text,
		gi.invited_user_id::text,
		gi.status,
		TO_CHAR(gi.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		COALESCE(TO_CHAR(gi.responded_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'), '') AS responded_at,
		u.id::text,
		u.full_name,
		u.email,
		COALESCE(u.avatar_url, ''),
		COALESCE(tp.age, 0),
		COALESCE(tp.sex, ''),
		COALESCE(tp.tenant_situation, ''),
		COALESCE(tp.degree, ''),
		COALESCE(tp.profession, ''),
		COALESCE(tp.budget_max, 0),
		COALESCE(tp.preferred_area, ''),
		COALESCE(tp.pets, FALSE),
		COALESCE(tp.smoking, FALSE),
		COALESCE(tp.socialization_level, ''),
		COALESCE(tp.nightlife_level, '')
	FROM public.group_invitations gi
	INNER JOIN public.users u ON u.id = gi.invited_user_id
	LEFT JOIN public.tenant_profiles tp ON tp.user_id = u.id
	WHERE gi.group_id = $1
		AND gi.status = 'PENDING'
	ORDER BY gi.created_at DESC`

	rows, err := r.db.Query(ctx, query, groupID)
	if err != nil {
		return nil, fmt.Errorf("list pending invitations: %w", err)
	}
	defer rows.Close()

	result := make([]group.Invitation, 0)
	for rows.Next() {
		var item group.Invitation
		if err := rows.Scan(append([]any{
			&item.ID,
			&item.GroupID,
			&item.InvitedBy,
			&item.InvitedUserID,
			&item.Status,
			&item.CreatedAt,
			&item.RespondedAt,
		}, candidateProfileDests(&item.User)...)...); err != nil {
			return nil, fmt.Errorf("scan pending invitation: %w", err)
		}
		result = append(result, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate pending invitations: %w", err)
	}

	return result, nil
}

func buildListTenantGroupsQuery(userID string, filters group.ListGroupsFilters) (string, []interface{}) {
	baseQuery := `SELECT
		g.id::text,
		COALESCE(g.name, ''),
		COALESCE(g.description, ''),
		g.status,
		g.created_by::text,
		TO_CHAR(g.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		CASE
			WHEN g.created_by = $1 THEN 'creator'
			WHEN EXISTS (
				SELECT 1
				FROM public.group_members gm
				WHERE gm.group_id = g.id
					AND gm.user_id = $1
					AND gm.status = 'ACCEPTED'
			) THEN 'member'
			WHEN EXISTS (
				SELECT 1
				FROM public.group_invitations gi
				WHERE gi.group_id = g.id
					AND gi.invited_user_id = $1
					AND gi.status = 'PENDING'
			) THEN 'pending_invitation'
			ELSE 'viewer'
		END AS user_relation,
		COALESCE((
			SELECT gi.id::text
			FROM public.group_invitations gi
			WHERE gi.group_id = g.id
				AND gi.invited_user_id = $1
				AND gi.status = 'PENDING'
			ORDER BY gi.created_at DESC
			LIMIT 1
		), '') AS invitation_id,
		COALESCE((
			SELECT COUNT(*)
			FROM public.group_members gm
			WHERE gm.group_id = g.id
				AND gm.status = 'ACCEPTED'
		), 0)::int AS accepted_members_count,
		COALESCE((
			SELECT COUNT(*)
			FROM public.group_invitations gi
			WHERE gi.group_id = g.id
				AND gi.status = 'PENDING'
		), 0)::int AS pending_invitations_count,
		(
			COALESCE(g.owner_accepted, FALSE)
			AND NOT EXISTS (
				SELECT 1
				FROM public.group_members gm
				WHERE gm.group_id = g.id
					AND gm.status = 'ACCEPTED'
					AND gm.role <> 'owner'
					AND COALESCE(gm.member_accepted, FALSE) = FALSE
			)
		) AS is_fully_accepted,
		COALESCE((
			SELECT ROUND(AVG(tp.budget_max))::int
			FROM public.group_members gm
			LEFT JOIN public.tenant_profiles tp ON tp.user_id = gm.user_id
			WHERE gm.group_id = g.id
				AND gm.status = 'ACCEPTED'
		), 0)::int AS average_budget_max,
		COALESCE(a.id::text, '') AS apartment_id,
		COALESCE(a.title, '') AS apartment_title,
		COALESCE(a.address, '') AS apartment_address,
		COALESCE(a.area, '') AS apartment_area,
		COALESCE(a.total_spots, 0) AS total_spots,
		COALESCE(a.occupied_spots, 0) AS occupied_spots,
		COALESCE(a.available_spots, 0) AS available_spots,
		COALESCE(a.base_rent, 0) AS base_rent,
		COALESCE((
			SELECT ap.url
			FROM public.apartment_photos ap
			WHERE ap.apartment_id = a.id
			ORDER BY ap.position ASC, ap.created_at ASC
			LIMIT 1
		), '') AS image_url,
		COALESCE((
			SELECT app.id::text
			FROM public.applications app
			WHERE app.group_id = g.id
				AND app.apartment_id = g.apartment_id
			ORDER BY app.created_at DESC
			LIMIT 1
		), '') AS current_application_id,
		COALESCE((
			SELECT app.apartment_id::text
			FROM public.applications app
			WHERE app.group_id = g.id
				AND app.apartment_id = g.apartment_id
			ORDER BY app.created_at DESC
			LIMIT 1
		), '') AS current_application_apartment_id,
		COALESCE((
			SELECT app.group_id::text
			FROM public.applications app
			WHERE app.group_id = g.id
				AND app.apartment_id = g.apartment_id
			ORDER BY app.created_at DESC
			LIMIT 1
		), '') AS current_application_group_id,
		COALESCE((
			SELECT app.type
			FROM public.applications app
			WHERE app.group_id = g.id
				AND app.apartment_id = g.apartment_id
			ORDER BY app.created_at DESC
			LIMIT 1
		), '') AS current_application_type,
		COALESCE((
			SELECT app.status
			FROM public.applications app
			WHERE app.group_id = g.id
				AND app.apartment_id = g.apartment_id
			ORDER BY app.created_at DESC
			LIMIT 1
		), '') AS current_application_status,
		COALESCE((
			SELECT TO_CHAR(app.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
			FROM public.applications app
			WHERE app.group_id = g.id
				AND app.apartment_id = g.apartment_id
			ORDER BY app.created_at DESC
			LIMIT 1
		), '') AS current_application_created_at,
		COALESCE((
			SELECT gjr.id::text
			FROM public.group_join_requests gjr
			WHERE gjr.group_id = g.id
				AND gjr.requester_user_id = $1
			ORDER BY gjr.created_at DESC, gjr.updated_at DESC
			LIMIT 1
		), '') AS current_join_request_id,
		COALESCE((
			SELECT gjr.group_id::text
			FROM public.group_join_requests gjr
			WHERE gjr.group_id = g.id
				AND gjr.requester_user_id = $1
			ORDER BY gjr.created_at DESC, gjr.updated_at DESC
			LIMIT 1
		), '') AS current_join_request_group_id,
		COALESCE((
			SELECT gjr.requester_user_id::text
			FROM public.group_join_requests gjr
			WHERE gjr.group_id = g.id
				AND gjr.requester_user_id = $1
			ORDER BY gjr.created_at DESC, gjr.updated_at DESC
			LIMIT 1
		), '') AS current_join_request_requester_user_id,
		COALESCE((
			SELECT COALESCE(gjr.source, 'DIRECT_REQUEST')
			FROM public.group_join_requests gjr
			WHERE gjr.group_id = g.id
				AND gjr.requester_user_id = $1
			ORDER BY gjr.created_at DESC, gjr.updated_at DESC
			LIMIT 1
		), '') AS current_join_request_source,
		COALESCE((
			SELECT gjr.status
			FROM public.group_join_requests gjr
			WHERE gjr.group_id = g.id
				AND gjr.requester_user_id = $1
			ORDER BY gjr.created_at DESC, gjr.updated_at DESC
			LIMIT 1
		), '') AS current_join_request_status,
		COALESCE((
			SELECT TO_CHAR(gjr.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
			FROM public.group_join_requests gjr
			WHERE gjr.group_id = g.id
				AND gjr.requester_user_id = $1
			ORDER BY gjr.created_at DESC, gjr.updated_at DESC
			LIMIT 1
		), '') AS current_join_request_created_at,
		COALESCE((
			SELECT TO_CHAR(gjr.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
			FROM public.group_join_requests gjr
			WHERE gjr.group_id = g.id
				AND gjr.requester_user_id = $1
			ORDER BY gjr.created_at DESC, gjr.updated_at DESC
			LIMIT 1
		), '') AS current_join_request_updated_at
	FROM public.groups g
	LEFT JOIN public.apartments a ON a.id = g.apartment_id
	WHERE TRUE`

	args := []interface{}{userID}
	whereClauses := make([]string, 0)

	if filters.Search != "" {
		args = append(args, "%"+filters.Search+"%")
		arg := fmt.Sprintf("$%d", len(args))
		whereClauses = append(whereClauses, "(COALESCE(g.name, '') ILIKE "+arg+" OR COALESCE(g.description, '') ILIKE "+arg+" OR COALESCE(a.title, '') ILIKE "+arg+" OR COALESCE(a.address, '') ILIKE "+arg+" OR COALESCE(a.area, '') ILIKE "+arg+")")
	}

	if filters.Status != "" {
		switch filters.Status {
		case group.StatusClosed:
			args = append(args, group.StatusClosed)
			whereClauses = append(whereClauses, fmt.Sprintf("g.status = $%d", len(args)))
		case "REQUEST_SENT":
			args = append(args, group.JoinRequestStatusPending)
			whereClauses = append(whereClauses, fmt.Sprintf(`COALESCE((
				SELECT gjr.status
				FROM public.group_join_requests gjr
				WHERE gjr.group_id = g.id
					AND gjr.requester_user_id = $1
				ORDER BY gjr.created_at DESC, gjr.updated_at DESC
				LIMIT 1
			), '') = $%d`, len(args)))
		case "REJECTED":
			args = append(args, group.JoinRequestStatusRejected)
			whereClauses = append(whereClauses, fmt.Sprintf(`COALESCE((
				SELECT gjr.status
				FROM public.group_join_requests gjr
				WHERE gjr.group_id = g.id
					AND gjr.requester_user_id = $1
				ORDER BY gjr.created_at DESC, gjr.updated_at DESC
				LIMIT 1
			), '') = $%d`, len(args)))
		case "ACCEPTED":
			args = append(args, group.JoinRequestStatusApproved)
			whereClauses = append(whereClauses, fmt.Sprintf(`(
				g.created_by = $1
				OR EXISTS (
					SELECT 1
					FROM public.group_members gm
					WHERE gm.group_id = g.id
						AND gm.user_id = $1
						AND gm.status = 'ACCEPTED'
				)
				OR COALESCE((
					SELECT gjr.status
					FROM public.group_join_requests gjr
					WHERE gjr.group_id = g.id
						AND gjr.requester_user_id = $1
					ORDER BY gjr.created_at DESC, gjr.updated_at DESC
					LIMIT 1
				), '') = $%d
			)`, len(args)))
		}
	}

	if filters.HasApartment == "true" {
		whereClauses = append(whereClauses, "g.apartment_id IS NOT NULL")
	}

	if filters.HasApartment == "false" {
		whereClauses = append(whereClauses, "g.apartment_id IS NULL")
	}

	if filters.Members > 0 {
		args = append(args, filters.Members)
		whereClauses = append(whereClauses, fmt.Sprintf(`(
			SELECT COUNT(*)
			FROM public.group_members gm
			WHERE gm.group_id = g.id
				AND gm.status = 'ACCEPTED'
		) = $%d`, len(args)))
	}

	query := baseQuery
	if len(whereClauses) > 0 {
		query += " AND " + strings.Join(whereClauses, " AND ")
	}

	query += buildTenantGroupsOrderBy(filters.SortBy)

	return query, args
}

func buildTenantGroupsOrderBy(sortBy string) string {
	switch strings.ToLower(strings.TrimSpace(sortBy)) {
	case "members":
		return ` ORDER BY accepted_members_count DESC, pending_invitations_count DESC, g.created_at DESC`
	case "name":
		return ` ORDER BY g.name ASC NULLS LAST, g.created_at DESC`
	default:
		return ` ORDER BY g.created_at DESC`
	}
}

func buildListGroupCandidatesQuery(currentUserID string, filters group.CandidateFilters) (string, []interface{}) {
	baseQuery := `SELECT
		u.id::text,
		u.full_name,
		u.email,
		COALESCE(u.avatar_url, ''),
		COALESCE(tp.age, 0),
		COALESCE(tp.sex, ''),
		COALESCE(tp.tenant_situation, ''),
		COALESCE(tp.degree, ''),
		COALESCE(tp.profession, ''),
		COALESCE(tp.budget_max, 0),
		COALESCE(tp.preferred_area, ''),
		COALESCE(tp.pets, FALSE),
		COALESCE(tp.smoking, FALSE),
		COALESCE(tp.socialization_level, ''),
		COALESCE(tp.nightlife_level, '')
	FROM public.users u
	LEFT JOIN public.tenant_profiles tp ON tp.user_id = u.id
	WHERE u.role = 'tenant'
		AND u.id <> $1`

	args := []interface{}{currentUserID}
	whereClauses := make([]string, 0)

	if filters.Search != "" {
		args = append(args, "%"+filters.Search+"%")
		arg := fmt.Sprintf("$%d", len(args))
		whereClauses = append(whereClauses, "(u.full_name ILIKE "+arg+" OR u.email ILIKE "+arg+" OR COALESCE(tp.preferred_area, '') ILIKE "+arg+")")
	}

	if filters.GroupID != "" {
		args = append(args, filters.GroupID)
		arg := fmt.Sprintf("$%d", len(args))
		whereClauses = append(whereClauses, `NOT EXISTS (
			SELECT 1
			FROM public.group_members gm
			WHERE gm.group_id = `+arg+`
				AND gm.user_id = u.id
				AND gm.status = 'ACCEPTED'
		)`)
		whereClauses = append(whereClauses, `NOT EXISTS (
			SELECT 1
			FROM public.group_invitations gi
			WHERE gi.group_id = `+arg+`
				AND gi.invited_user_id = u.id
				AND gi.status = 'PENDING'
		)`)
	}

	query := baseQuery
	if len(whereClauses) > 0 {
		query += " AND " + strings.Join(whereClauses, " AND ")
	}

	query += " ORDER BY u.full_name ASC"

	return query, args
}

type groupScanner interface {
	Scan(dest ...interface{}) error
}

func candidateProfileDests(user *group.Candidate) []any {
	return []any{
		&user.UserID,
		&user.Name,
		&user.Email,
		&user.AvatarURL,
		&user.Age,
		&user.Sex,
		&user.Situation,
		&user.Degree,
		&user.Profession,
		&user.BudgetMax,
		&user.PreferredArea,
		&user.Pets,
		&user.Smoking,
		&user.SocializationLevel,
		&user.NightlifeLevel,
	}
}

func scanGroupSummary(row groupScanner) (group.Group, error) {
	var item group.Group
	var apartmentID string
	var apartmentTitle string
	var apartmentAddress string
	var apartmentArea string
	var totalSpots int
	var occupiedSpots int
	var availableSpots int
	var baseRent int
	var imageURL string
	var currentApplicationID string
	var currentApplicationApartmentID string
	var currentApplicationGroupID string
	var currentApplicationType string
	var currentApplicationStatus string
	var currentApplicationCreatedAt string
	var currentJoinRequestID string
	var currentJoinRequestGroupID string
	var currentJoinRequestRequesterUserID string
	var currentJoinRequestSource string
	var currentJoinRequestStatus string
	var currentJoinRequestCreatedAt string
	var currentJoinRequestUpdatedAt string

	if err := row.Scan(
		&item.ID,
		&item.Name,
		&item.Description,
		&item.Status,
		&item.CreatedBy,
		&item.CreatedAt,
		&item.UserRelation,
		&item.InvitationID,
		&item.AcceptedMembersCount,
		&item.PendingInvitationsCount,
		&item.IsFullyAccepted,
		&item.AverageBudgetMax,
		&apartmentID,
		&apartmentTitle,
		&apartmentAddress,
		&apartmentArea,
		&totalSpots,
		&occupiedSpots,
		&availableSpots,
		&baseRent,
		&imageURL,
		&currentApplicationID,
		&currentApplicationApartmentID,
		&currentApplicationGroupID,
		&currentApplicationType,
		&currentApplicationStatus,
		&currentApplicationCreatedAt,
		&currentJoinRequestID,
		&currentJoinRequestGroupID,
		&currentJoinRequestRequesterUserID,
		&currentJoinRequestSource,
		&currentJoinRequestStatus,
		&currentJoinRequestCreatedAt,
		&currentJoinRequestUpdatedAt,
	); err != nil {
		return group.Group{}, fmt.Errorf("scan group summary: %w", err)
	}

	if apartmentID != "" {
		item.Apartment = &group.Apartment{
			ID:             apartmentID,
			Title:          apartmentTitle,
			Address:        apartmentAddress,
			Area:           apartmentArea,
			TotalSpots:     totalSpots,
			OccupiedSpots:  occupiedSpots,
			AvailableSpots: availableSpots,
			BaseRent:       baseRent,
			ImageURL:       imageURL,
		}
	}
	if currentApplicationID != "" {
		item.CurrentApartmentRequest = &group.ApartmentRequest{
			ID:          currentApplicationID,
			ApartmentID: currentApplicationApartmentID,
			GroupID:     currentApplicationGroupID,
			Type:        currentApplicationType,
			Status:      currentApplicationStatus,
			CreatedAt:   currentApplicationCreatedAt,
		}
	}
	if currentJoinRequestID != "" {
		item.CurrentJoinRequest = &group.UserJoinRequest{
			ID:              currentJoinRequestID,
			GroupID:         currentJoinRequestGroupID,
			RequesterUserID: currentJoinRequestRequesterUserID,
			Source:          currentJoinRequestSource,
			Status:          currentJoinRequestStatus,
			CreatedAt:       currentJoinRequestCreatedAt,
			UpdatedAt:       currentJoinRequestUpdatedAt,
		}
	}

	return item, nil
}

// HasUserGroupForApartment checks whether the user already has an active group linked to the given apartment.
func (r *Repository) HasUserGroupForApartment(ctx context.Context, userID, apartmentID string) (bool, error) {
	const query = `SELECT EXISTS (
		SELECT 1
		FROM public.groups g
		INNER JOIN public.group_members gm ON gm.group_id = g.id
		WHERE g.apartment_id = $2
			AND gm.user_id = $1
			AND gm.status = 'ACCEPTED'
			AND g.status NOT IN ('CLOSED', 'REJECTED')
	)`
	var exists bool
	if err := r.db.QueryRow(ctx, query, userID, apartmentID).Scan(&exists); err != nil {
		return false, fmt.Errorf("has user group for apartment: %w", err)
	}
	return exists, nil
}

// GetMyGroupForApartment returns the group the user belongs to for the given apartment, or nil.
func (r *Repository) GetMyGroupForApartment(ctx context.Context, userID, apartmentID string) (*group.Group, error) {
	const query = `SELECT g.id::text
	FROM public.groups g
	INNER JOIN public.group_members gm ON gm.group_id = g.id
	WHERE g.apartment_id = $2
		AND gm.user_id = $1
		AND gm.status = 'ACCEPTED'
		AND g.status NOT IN ('CLOSED', 'REJECTED')
	ORDER BY g.created_at DESC
	LIMIT 1`

	var groupID string
	if err := r.db.QueryRow(ctx, query, userID, apartmentID).Scan(&groupID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get my group for apartment: %w", err)
	}
	return r.GetTenantGroupByID(ctx, groupID, userID)
}

func nullIfEmpty(value string) interface{} {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return value
}

func rollbackTx(ctx context.Context, tx pgx.Tx) {
	if tx == nil {
		return
	}
	_ = tx.Rollback(ctx)
}
