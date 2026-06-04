package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/application"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const ownerApplicationConflictMessage = "owner application conflicts with the current apartment assignment"

// Repository stores application data in PostgreSQL.
type Repository struct {
	db *pgxpool.Pool
}

type ownerApplicationUpdateContext struct {
	apartmentID     string
	groupID         string
	applicationType string
	currentStatus   string
}

// NewRepository creates a PostgreSQL application repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// HasActiveApplication checks whether a tenant already has an active application for an apartment.
func (r *Repository) HasActiveApplication(ctx context.Context, apartmentID, tenantID string) (bool, error) {
	const query = `SELECT EXISTS (
		SELECT 1
		FROM public.applications
		WHERE apartment_id = $1
			AND tenant_id = $2
			AND status IN ('PENDING_OWNER', 'PENDING_CONFIRMED_TENANTS')
	)`

	var exists bool
	if err := r.db.QueryRow(ctx, query, apartmentID, tenantID).Scan(&exists); err != nil {
		return false, fmt.Errorf("check active application: %w", err)
	}
	return exists, nil
}

// GetTenantApplicationForApartment returns the most recent tenant application for an apartment.
func (r *Repository) GetTenantApplicationForApartment(ctx context.Context, apartmentID, tenantID string) (string, string, error) {
	const query = `SELECT id, status
	FROM public.applications
	WHERE apartment_id = $1
		AND tenant_id = $2
	ORDER BY created_at DESC
	LIMIT 1`

	var applicationID string
	var status string
	err := r.db.QueryRow(ctx, query, apartmentID, tenantID).Scan(&applicationID, &status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", "", nil
		}
		return "", "", fmt.Errorf("get tenant application for apartment: %w", err)
	}
	return applicationID, status, nil
}

// CreateTenantApplication creates an individual tenant application.
func (r *Repository) CreateTenantApplication(ctx context.Context, apartmentID, tenantID string, compatibilityScore int) (string, error) {
	const query = `INSERT INTO public.applications (apartment_id, tenant_id, type, status)
	VALUES ($1, $2, 'individual', 'PENDING_OWNER')
	RETURNING id`

	var id string
	if err := r.db.QueryRow(ctx, query, apartmentID, tenantID).Scan(&id); err != nil {
		return "", fmt.Errorf("create tenant application: %w", err)
	}
	return id, nil
}

// CancelTenantApplication marks a pending application as cancelled.
func (r *Repository) CancelTenantApplication(ctx context.Context, applicationID, tenantID string) (bool, error) {
	const query = `UPDATE public.applications
	SET status = 'CANCELLED',
		updated_at = NOW()
	WHERE id = $1
		AND tenant_id = $2
		AND status IN ('PENDING_OWNER', 'PENDING_CONFIRMED_TENANTS')`

	result, err := r.db.Exec(ctx, query, applicationID, tenantID)
	if err != nil {
		return false, fmt.Errorf("cancel tenant application: %w", err)
	}
	return result.RowsAffected() > 0, nil
}

// ListInterestedTenants returns tenants with active applications for an apartment.
func (r *Repository) ListInterestedTenants(ctx context.Context, apartmentID string) ([]application.InterestedTenantCandidate, error) {
	const query = `SELECT
		u.id,
		u.full_name,
		COALESCE(tp.age, 0),
		COALESCE(tp.university, ''),
		COALESCE(u.avatar_url, ''),
		COALESCE(tp.budget_max, 0),
		COALESCE(tp.preferred_area, ''),
		COALESCE(tp.pets, FALSE),
		COALESCE(tp.smoking, FALSE),
		COALESCE(tp.tenant_situation, ''),
		COALESCE(tp.degree, ''),
		COALESCE(tp.profession, ''),
		COALESCE(tp.socialization_level, ''),
		COALESCE(tp.nightlife_level, '')
	FROM public.applications app
	INNER JOIN public.users u ON u.id = app.tenant_id
	LEFT JOIN public.tenant_profiles tp ON tp.user_id = u.id
	WHERE app.apartment_id = $1
		AND app.tenant_id IS NOT NULL
		AND app.status IN ('PENDING_OWNER', 'PENDING_CONFIRMED_TENANTS')
	ORDER BY app.created_at DESC`

	rows, err := r.db.Query(ctx, query, apartmentID)
	if err != nil {
		return nil, fmt.Errorf("list interested tenants: %w", err)
	}
	defer rows.Close()

	result := make([]application.InterestedTenantCandidate, 0)
	for rows.Next() {
		var item application.InterestedTenantCandidate
		if err := rows.Scan(
			&item.UserID,
			&item.Name,
			&item.Age,
			&item.Studies,
			&item.AvatarURL,
			&item.BudgetMax,
			&item.PreferredArea,
			&item.Pets,
			&item.Smoking,
			&item.Situation,
			&item.Degree,
			&item.Profession,
			&item.Socialization,
			&item.Nightlife,
		); err != nil {
			return nil, fmt.Errorf("scan interested tenants: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate interested tenants: %w", err)
	}

	return result, nil
}

// ListTenantApplications returns applications made by the tenant.
func (r *Repository) ListTenantApplications(ctx context.Context, tenantID string) ([]application.TenantApplication, error) {
	const query = `SELECT
		item.id,
		item.apartment_id,
		item.property_title,
		item.owner_name,
		item.address,
		item.image_url,
		item.places,
		item.size,
		item.bathrooms,
		item.type,
		item.status,
		item.created_at,
		item.compatibility_score,
		item.group_id,
		item.group_name,
		item.submitted_by_user_id,
		item.submitted_by_name
	FROM (
		SELECT
			app.id::text AS id,
			app.apartment_id::text AS apartment_id,
			COALESCE(a.title, '') AS property_title,
			COALESCE(owner.full_name, '') AS owner_name,
			COALESCE(a.address, '') AS address,
			COALESCE((
				SELECT ap.url
				FROM public.apartment_photos ap
				WHERE ap.apartment_id = a.id
				ORDER BY ap.position ASC, ap.created_at ASC
				LIMIT 1
			), '') AS image_url,
			COALESCE(a.total_spots, 0) AS places,
			0 AS size,
			0 AS bathrooms,
			app.type,
			app.status,
			TO_CHAR(app.created_at, 'YYYY-MM-DD') AS created_at,
			0 AS compatibility_score,
			'' AS group_id,
			'' AS group_name,
			COALESCE(app.tenant_id::text, '') AS submitted_by_user_id,
			COALESCE(tenant.full_name, '') AS submitted_by_name,
			app.created_at AS created_at_sort
		FROM public.applications app
		INNER JOIN public.apartments a ON a.id = app.apartment_id
		LEFT JOIN public.users owner ON owner.id = a.owner_id
		LEFT JOIN public.users tenant ON tenant.id = app.tenant_id
		WHERE app.tenant_id = $1

		UNION ALL

		SELECT
			app.id::text AS id,
			app.apartment_id::text AS apartment_id,
			COALESCE(a.title, '') AS property_title,
			COALESCE(owner.full_name, '') AS owner_name,
			COALESCE(a.address, '') AS address,
			COALESCE((
				SELECT ap.url
				FROM public.apartment_photos ap
				WHERE ap.apartment_id = a.id
				ORDER BY ap.position ASC, ap.created_at ASC
				LIMIT 1
			), '') AS image_url,
			COALESCE(a.total_spots, 0) AS places,
			0 AS size,
			0 AS bathrooms,
			app.type,
			app.status,
			TO_CHAR(app.created_at, 'YYYY-MM-DD') AS created_at,
			0 AS compatibility_score,
			COALESCE(g.id::text, '') AS group_id,
			COALESCE(g.name, '') AS group_name,
			COALESCE(creator.id::text, '') AS submitted_by_user_id,
			COALESCE(creator.full_name, '') AS submitted_by_name,
			app.created_at AS created_at_sort
		FROM public.applications app
		INNER JOIN public.apartments a ON a.id = app.apartment_id
		INNER JOIN public.groups g ON g.id = app.group_id
		LEFT JOIN public.users owner ON owner.id = a.owner_id
		LEFT JOIN public.users creator ON creator.id = g.created_by
		WHERE app.group_id IS NOT NULL
			AND (
				g.created_by = $1
				OR EXISTS (
					SELECT 1
					FROM public.group_members gm
					WHERE gm.group_id = g.id
						AND gm.user_id = $1
						AND gm.status = 'ACCEPTED'
				)
			)
	) AS item
	ORDER BY item.created_at_sort DESC`

	rows, err := r.db.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("list tenant applications: %w", err)
	}
	defer rows.Close()

	result := make([]application.TenantApplication, 0)
	groupIDs := make([]string, 0)
	seenGroupIDs := make(map[string]struct{})
	for rows.Next() {
		var item application.TenantApplication
		var groupID string
		var groupName string
		var submittedByUserID string
		var submittedByName string
		if err := rows.Scan(
			&item.ID,
			&item.ApartmentID,
			&item.PropertyTitle,
			&item.OwnerName,
			&item.Address,
			&item.ImageURL,
			&item.Places,
			&item.Size,
			&item.Bathrooms,
			&item.Type,
			&item.Status,
			&item.CreatedAt,
			&item.CompatibilityScore,
			&groupID,
			&groupName,
			&submittedByUserID,
			&submittedByName,
		); err != nil {
			return nil, fmt.Errorf("scan tenant applications: %w", err)
		}
		item.GroupID = groupID
		item.GroupName = groupName
		item.SubmittedByUserID = submittedByUserID
		item.SubmittedByName = submittedByName
		if groupID != "" {
			if _, exists := seenGroupIDs[groupID]; !exists {
				seenGroupIDs[groupID] = struct{}{}
				groupIDs = append(groupIDs, groupID)
			}
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate tenant applications: %w", err)
	}

	if len(groupIDs) == 0 {
		return result, nil
	}

	membersByGroupID, err := r.listGroupMembers(ctx, groupIDs)
	if err != nil {
		return nil, err
	}
	for idx := range result {
		if result[idx].GroupID != "" {
			result[idx].GroupMembers = membersByGroupID[result[idx].GroupID]
		}
	}

	return result, nil
}

// GetGroupApplicationContext returns the metadata required to validate a group application.
func (r *Repository) GetGroupApplicationContext(ctx context.Context, groupID, userID string) (*application.GroupApplicationContext, error) {
	const query = `SELECT
		g.id::text,
		COALESCE(g.name, ''),
		COALESCE(g.apartment_id::text, ''),
		g.created_by::text,
		(g.created_by = $2) AS is_creator,
		EXISTS (
			SELECT 1
			FROM public.group_members gm
			WHERE gm.group_id = g.id
				AND gm.user_id = $2
				AND gm.status = 'ACCEPTED'
		) AS is_member,
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
			SELECT COUNT(*)
			FROM public.group_members gm
			WHERE gm.group_id = g.id
				AND gm.status = 'ACCEPTED'
		), 0)::int AS accepted_members,
		COALESCE((
			SELECT COUNT(*)
			FROM public.group_invitations gi
			WHERE gi.group_id = g.id
				AND gi.status = 'PENDING'
		), 0)::int AS pending_invites
	FROM public.groups g
	WHERE g.id = $1`

	var item application.GroupApplicationContext
	err := r.db.QueryRow(ctx, query, groupID, userID).Scan(
		&item.GroupID,
		&item.GroupName,
		&item.ApartmentID,
		&item.CreatedBy,
		&item.IsCreator,
		&item.IsMember,
		&item.IsFullyAccepted,
		&item.AcceptedMembers,
		&item.PendingInvites,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get group application context: %w", err)
	}

	return &item, nil
}

// GetLatestGroupApplicationForApartment returns the most recent application sent by the group to the apartment.
func (r *Repository) GetLatestGroupApplicationForApartment(ctx context.Context, apartmentID, groupID string) (*application.Record, error) {
	const query = `SELECT
		app.id::text,
		app.apartment_id::text,
		COALESCE(app.tenant_id::text, ''),
		COALESCE(app.group_id::text, ''),
		app.type,
		app.status,
		TO_CHAR(app.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
	FROM public.applications app
	WHERE app.apartment_id = $1
		AND app.group_id = $2
	ORDER BY app.created_at DESC
	LIMIT 1`

	var item application.Record
	err := r.db.QueryRow(ctx, query, apartmentID, groupID).Scan(
		&item.ID,
		&item.ApartmentID,
		&item.TenantID,
		&item.GroupID,
		&item.Type,
		&item.Status,
		&item.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get latest group application: %w", err)
	}

	return &item, nil
}

// CreateGroupApplication creates a group application and marks the group as applied.
func (r *Repository) CreateGroupApplication(ctx context.Context, apartmentID, groupID string) (string, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return "", fmt.Errorf("begin create group application: %w", err)
	}
	defer rollbackTx(ctx, tx)

	const insertQuery = `INSERT INTO public.applications (apartment_id, group_id, type, status)
	VALUES ($1, $2, 'group', 'PENDING_OWNER')
	RETURNING id::text`

	var id string
	if err := tx.QueryRow(ctx, insertQuery, apartmentID, groupID).Scan(&id); err != nil {
		return "", fmt.Errorf("create group application: %w", err)
	}

	if _, err := tx.Exec(ctx, `UPDATE public.groups SET status = 'APPLIED', updated_at = NOW() WHERE id = $1`, groupID); err != nil {
		return "", fmt.Errorf("mark group as applied: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return "", fmt.Errorf("commit create group application: %w", err)
	}

	return id, nil
}

// ListOwnerApplications returns all applications received by apartments owned by the given user.
func (r *Repository) ListOwnerApplications(ctx context.Context, ownerID string) ([]application.OwnerApplication, error) {
	return r.listOwnerApplications(ctx, ownerID, "")
}

// GetOwnerApplicationByID returns one application received by the owner.
func (r *Repository) GetOwnerApplicationByID(ctx context.Context, applicationID, ownerID string) (*application.OwnerApplication, error) {
	items, err := r.listOwnerApplications(ctx, ownerID, applicationID)
	if err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return nil, nil
	}
	return &items[0], nil
}

func (r *Repository) listOwnerApplications(ctx context.Context, ownerID, applicationID string) ([]application.OwnerApplication, error) {
	const query = `SELECT
		app.id::text,
		app.apartment_id::text,
		COALESCE(a.title, ''),
		COALESCE(a.address, ''),
		app.type,
		app.status,
		TO_CHAR(app.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		COALESCE(tu.id::text, ''),
		COALESCE(tu.full_name, ''),
		COALESCE(tu.email, ''),
		COALESCE(tu.avatar_url, ''),
		COALESCE(g.id::text, ''),
		COALESCE(g.name, ''),
		COALESCE(creator.id::text, ''),
		COALESCE(creator.full_name, ''),
		COALESCE(creator.email, ''),
		COALESCE(creator.avatar_url, '')
	FROM public.applications app
	INNER JOIN public.apartments a ON a.id = app.apartment_id
	LEFT JOIN public.users tu ON tu.id = app.tenant_id
	LEFT JOIN public.groups g ON g.id = app.group_id
	LEFT JOIN public.users creator ON creator.id = g.created_by
	WHERE a.owner_id = $1
		AND ($2 = '' OR app.id::text = $2)
	ORDER BY app.created_at DESC`

	rows, err := r.db.Query(ctx, query, ownerID, applicationID)
	if err != nil {
		return nil, fmt.Errorf("list owner applications: %w", err)
	}
	defer rows.Close()

	result := make([]application.OwnerApplication, 0)
	groupIDs := make([]string, 0)
	seenGroupIDs := make(map[string]struct{})
	for rows.Next() {
		var item application.OwnerApplication
		var tenantID string
		var tenantName string
		var tenantEmail string
		var tenantAvatar string
		var groupID string
		var groupName string
		var creatorID string
		var creatorName string
		var creatorEmail string
		var creatorAvatar string
		if err := rows.Scan(
			&item.ID,
			&item.ApartmentID,
			&item.PropertyTitle,
			&item.Address,
			&item.Type,
			&item.Status,
			&item.CreatedAt,
			&tenantID,
			&tenantName,
			&tenantEmail,
			&tenantAvatar,
			&groupID,
			&groupName,
			&creatorID,
			&creatorName,
			&creatorEmail,
			&creatorAvatar,
		); err != nil {
			return nil, fmt.Errorf("scan owner application: %w", err)
		}
		if tenantID != "" {
			item.Tenant = &application.Applicant{UserID: tenantID, Name: tenantName, Email: tenantEmail, AvatarURL: tenantAvatar}
		}
		if groupID != "" {
			item.Group = &application.GroupDetails{
				GroupID: groupID,
				Name:    groupName,
				Creator: application.Applicant{UserID: creatorID, Name: creatorName, Email: creatorEmail, AvatarURL: creatorAvatar},
			}
			if _, exists := seenGroupIDs[groupID]; !exists {
				seenGroupIDs[groupID] = struct{}{}
				groupIDs = append(groupIDs, groupID)
			}
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate owner applications: %w", err)
	}

	if len(groupIDs) == 0 {
		return result, nil
	}

	membersByGroupID, err := r.listGroupMembers(ctx, groupIDs)
	if err != nil {
		return nil, err
	}
	for idx := range result {
		if result[idx].Group != nil {
			result[idx].Group.Members = membersByGroupID[result[idx].Group.GroupID]
		}
	}

	return result, nil
}

func (r *Repository) listGroupMembers(ctx context.Context, groupIDs []string) (map[string][]application.GroupMember, error) {
	const query = `SELECT
		gm.group_id::text,
		u.id::text,
		COALESCE(u.full_name, ''),
		COALESCE(u.email, ''),
		COALESCE(u.avatar_url, '')
	FROM public.group_members gm
	INNER JOIN public.users u ON u.id = gm.user_id
	WHERE gm.group_id::text = ANY($1)
		AND gm.status = 'ACCEPTED'
	ORDER BY u.full_name ASC`

	rows, err := r.db.Query(ctx, query, groupIDs)
	if err != nil {
		return nil, fmt.Errorf("list application group members: %w", err)
	}
	defer rows.Close()

	result := make(map[string][]application.GroupMember, len(groupIDs))
	for rows.Next() {
		var groupID string
		var member application.GroupMember
		if err := rows.Scan(&groupID, &member.UserID, &member.Name, &member.Email, &member.AvatarURL); err != nil {
			return nil, fmt.Errorf("scan application group member: %w", err)
		}
		result[groupID] = append(result[groupID], member)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate application group members: %w", err)
	}

	return result, nil
}

// ApproveOwnerApplication approves a pending application and updates the group status when needed.
func (r *Repository) ApproveOwnerApplication(ctx context.Context, applicationID, ownerID string) (bool, error) {
	return r.updateOwnerApplicationStatus(ctx, applicationID, ownerID, "FULLY_CONFIRMED", "ACCEPTED", true)
}

// RejectOwnerApplication rejects a pending application and updates the group status when needed.
func (r *Repository) RejectOwnerApplication(ctx context.Context, applicationID, ownerID string) (bool, error) {
	return r.updateOwnerApplicationStatus(ctx, applicationID, ownerID, "REJECTED_BY_OWNER", "REJECTED", false)
}

func (r *Repository) updateOwnerApplicationStatus(ctx context.Context, applicationID, ownerID, nextStatus, nextGroupStatus string, approve bool) (bool, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return false, fmt.Errorf("begin update owner application: %w", err)
	}
	defer rollbackTx(ctx, tx)

	updateContext, err := r.loadOwnerApplicationUpdateContextTx(ctx, tx, applicationID, ownerID)
	if err != nil {
		return false, err
	}
	if updateContext.currentStatus != "PENDING_OWNER" {
		return false, nil
	}
	if err := r.ensureOwnerApplicationApprovalAllowedTx(ctx, tx, applicationID, updateContext, approve); err != nil {
		return false, err
	}

	updatedGroupID, err := r.applyOwnerApplicationStatusTx(ctx, tx, applicationID, ownerID, nextStatus, approve)
	if err != nil {
		return false, err
	}
	if err := r.updateGroupStatusAfterOwnerDecisionTx(ctx, tx, updateContext.apartmentID, updatedGroupID, nextGroupStatus, applicationID, approve); err != nil {
		return false, err
	}

	if err := tx.Commit(ctx); err != nil {
		return false, fmt.Errorf("commit update owner application: %w", err)
	}

	return true, nil
}

func (r *Repository) loadOwnerApplicationUpdateContextTx(ctx context.Context, tx pgx.Tx, applicationID, ownerID string) (*ownerApplicationUpdateContext, error) {
	lookupQuery := `SELECT app.apartment_id::text, COALESCE(app.group_id::text, ''), app.type, app.status
	FROM public.applications app
	INNER JOIN public.apartments a ON a.id = app.apartment_id
	WHERE app.id = $1
		AND a.owner_id = $2`

	var item ownerApplicationUpdateContext
	if err := tx.QueryRow(ctx, lookupQuery, applicationID, ownerID).Scan(&item.apartmentID, &item.groupID, &item.applicationType, &item.currentStatus); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, pgx.ErrNoRows
		}
		return nil, fmt.Errorf("load owner application before status update: %w", err)
	}

	return &item, nil
}

func (r *Repository) ensureOwnerApplicationApprovalAllowedTx(ctx context.Context, tx pgx.Tx, applicationID string, updateContext *ownerApplicationUpdateContext, approve bool) error {
	if !approve || updateContext.applicationType != "group" {
		return nil
	}
	conflictExists, err := r.hasAcceptedGroupApplicationForApartmentTx(ctx, tx, updateContext.apartmentID, applicationID)
	if err != nil {
		return err
	}
	if conflictExists {
		return errors.New(ownerApplicationConflictMessage)
	}
	return nil
}

func (r *Repository) applyOwnerApplicationStatusTx(ctx context.Context, tx pgx.Tx, applicationID, ownerID, nextStatus string, approve bool) (string, error) {
	query := `UPDATE public.applications app
	SET status = $3,
		updated_at = NOW(),
		owner_confirmed_at = CASE WHEN $4 THEN NOW() ELSE app.owner_confirmed_at END,
		fully_confirmed_at = CASE WHEN $4 THEN NOW() ELSE app.fully_confirmed_at END
	FROM public.apartments a
	WHERE app.id = $1
		AND app.apartment_id = a.id
		AND a.owner_id = $2
		AND app.status = 'PENDING_OWNER'
	RETURNING COALESCE(app.group_id::text, '')`

	var updatedGroupID string
	if err := tx.QueryRow(ctx, query, applicationID, ownerID, nextStatus, approve).Scan(&updatedGroupID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", r.resolveOwnerApplicationStatusUpdateNoRows(ctx, applicationID, ownerID)
		}
		return "", fmt.Errorf("update owner application status: %w", err)
	}

	return updatedGroupID, nil
}

func (r *Repository) updateGroupStatusAfterOwnerDecisionTx(ctx context.Context, tx pgx.Tx, apartmentID, groupID, nextGroupStatus, applicationID string, approve bool) error {
	if groupID == "" {
		return nil
	}
	if _, err := tx.Exec(ctx, `UPDATE public.groups SET status = $2, updated_at = NOW() WHERE id = $1`, groupID, nextGroupStatus); err != nil {
		return fmt.Errorf("update group status after owner decision: %w", err)
	}
	if !approve {
		return nil
	}
	return r.rejectOtherPendingGroupApplicationsTx(ctx, tx, apartmentID, applicationID)
}

func (r *Repository) resolveOwnerApplicationStatusUpdateNoRows(ctx context.Context, applicationID, ownerID string) error {
	exists, err := r.ownerApplicationExists(ctx, applicationID, ownerID)
	if err != nil {
		return err
	}
	if !exists {
		return pgx.ErrNoRows
	}
	return nil
}

func rollbackTx(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func (r *Repository) hasAcceptedGroupApplicationForApartmentTx(ctx context.Context, tx pgx.Tx, apartmentID, currentApplicationID string) (bool, error) {
	const query = `SELECT EXISTS (
		SELECT 1
		FROM public.applications
		WHERE apartment_id = $1
			AND type = 'group'
			AND status = 'FULLY_CONFIRMED'
			AND id::text <> $2
	)`

	var exists bool
	if err := tx.QueryRow(ctx, query, apartmentID, currentApplicationID).Scan(&exists); err != nil {
		return false, fmt.Errorf("check accepted group application conflict: %w", err)
	}
	return exists, nil
}

func (r *Repository) rejectOtherPendingGroupApplicationsTx(ctx context.Context, tx pgx.Tx, apartmentID, acceptedApplicationID string) error {
	const applicationQuery = `UPDATE public.applications
	SET status = 'REJECTED_BY_OWNER',
		updated_at = NOW()
	WHERE apartment_id = $1
		AND type = 'group'
		AND status = 'PENDING_OWNER'
		AND id::text <> $2
	RETURNING COALESCE(group_id::text, '')`

	rows, err := tx.Query(ctx, applicationQuery, apartmentID, acceptedApplicationID)
	if err != nil {
		return fmt.Errorf("reject competing group applications: %w", err)
	}
	defer rows.Close()

	rejectedGroupIDs := make([]string, 0)
	for rows.Next() {
		var groupID string
		if err := rows.Scan(&groupID); err != nil {
			return fmt.Errorf("scan rejected competing group application: %w", err)
		}
		if groupID != "" {
			rejectedGroupIDs = append(rejectedGroupIDs, groupID)
		}
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate rejected competing group applications: %w", err)
	}

	for _, groupID := range rejectedGroupIDs {
		if _, err := tx.Exec(ctx, `UPDATE public.groups SET status = 'REJECTED', updated_at = NOW() WHERE id = $1`, groupID); err != nil {
			return fmt.Errorf("update competing group status after approval: %w", err)
		}
	}

	return nil
}

func (r *Repository) ownerApplicationExists(ctx context.Context, applicationID, ownerID string) (bool, error) {
	const query = `SELECT EXISTS (
		SELECT 1
		FROM public.applications app
		INNER JOIN public.apartments a ON a.id = app.apartment_id
		WHERE app.id = $1
			AND a.owner_id = $2
	)`

	var exists bool
	if err := r.db.QueryRow(ctx, query, applicationID, ownerID).Scan(&exists); err != nil {
		return false, fmt.Errorf("check owner application existence: %w", err)
	}
	return exists, nil
}
