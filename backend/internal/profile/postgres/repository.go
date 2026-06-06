package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository stores profile data in PostgreSQL.
type Repository struct {
	db *pgxpool.Pool
}

func nullIfEmpty(s string) interface{} {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return strings.TrimSpace(s)
}

// NewRepository creates a PostgreSQL profile repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// LookupRoleByUserID loads role from users table.
func (r *Repository) LookupRoleByUserID(ctx context.Context, userID string) (string, error) {
	if strings.TrimSpace(userID) == "" {
		return "", errors.New("user id is required")
	}
	var role string
	err := r.db.QueryRow(ctx, `SELECT role FROM public.users WHERE id = $1`, userID).Scan(&role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", errors.New("user profile not found")
		}
		return "", fmt.Errorf("load user role: %w", err)
	}
	return strings.ToLower(strings.TrimSpace(role)), nil
}

// NeedsTenantProfile checks whether tenant profile row exists.
func (r *Repository) NeedsTenantProfile(ctx context.Context, userID, role string) (bool, error) {
	if role != "tenant" {
		return false, nil
	}
	var exists bool
	err := r.db.QueryRow(
		ctx,
		`SELECT EXISTS (SELECT 1 FROM public.tenant_profiles WHERE user_id = $1)`,
		userID,
	).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check tenant profile: %w", err)
	}
	return !exists, nil
}

// GetTenantProfileByUserID returns tenant profile data for matching.
func (r *Repository) GetTenantProfileByUserID(ctx context.Context, userID string) (*profile.TenantProfileInput, error) {
	const query = `SELECT
		user_id,
		COALESCE(budget_max, 0),
		COALESCE(preferred_area, ''),
		COALESCE(pets, FALSE),
		COALESCE(smoking, FALSE),
		COALESCE(age, 0),
		COALESCE(sex, ''),
		COALESCE(tenant_situation, ''),
		COALESCE(degree, ''),
		COALESCE(profession, ''),
		COALESCE(socialization_level, ''),
		COALESCE(nightlife_level, '')
	FROM public.tenant_profiles
	WHERE user_id = $1`

	var p profile.TenantProfileInput
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&p.UserID,
		&p.BudgetMax,
		&p.PreferredArea,
		&p.Pets,
		&p.Smoking,
		&p.Age,
		&p.Sex,
		&p.Situation,
		&p.Degree,
		&p.Profession,
		&p.Socialization,
		&p.Nightlife,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get tenant profile by user id: %w", err)
	}
	return &p, nil
}

// ListTenantProfiles returns registered tenant profiles except the current tenant.
func (r *Repository) ListTenantProfiles(ctx context.Context, currentUserID string) ([]profile.TenantProfileSummary, error) {
	const query = `SELECT
		u.id::text,
		COALESCE(u.full_name, ''),
		COALESCE(u.email, ''),
		COALESCE(u.avatar_url, ''),
		COALESCE(tp.budget_max, 0),
		COALESCE(tp.preferred_area, ''),
		COALESCE(tp.pets, FALSE),
		COALESCE(tp.smoking, FALSE),
		COALESCE(tp.age, 0),
		COALESCE(tp.sex, ''),
		COALESCE(tp.tenant_situation, ''),
		COALESCE(tp.degree, ''),
		COALESCE(tp.profession, ''),
		COALESCE(tp.socialization_level, ''),
		COALESCE(tp.nightlife_level, '')
	FROM public.users u
	INNER JOIN public.tenant_profiles tp ON tp.user_id = u.id
	WHERE u.role = 'tenant'
		AND u.id <> $1
	ORDER BY u.full_name ASC, u.created_at DESC`

	rows, err := r.db.Query(ctx, query, currentUserID)
	if err != nil {
		return nil, fmt.Errorf("list tenant profiles: %w", err)
	}
	defer rows.Close()

	result := make([]profile.TenantProfileSummary, 0)
	for rows.Next() {
		var item profile.TenantProfileSummary
		if err := rows.Scan(
			&item.UserID,
			&item.Name,
			&item.Email,
			&item.AvatarURL,
			&item.BudgetMax,
			&item.PreferredArea,
			&item.Pets,
			&item.Smoking,
			&item.Age,
			&item.Sex,
			&item.Situation,
			&item.Degree,
			&item.Profession,
			&item.Socialization,
			&item.Nightlife,
		); err != nil {
			return nil, fmt.Errorf("scan tenant profile summary: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate tenant profiles: %w", err)
	}
	return result, nil
}

// GetTenantPersonalProfile returns editable account data from users table.
func (r *Repository) GetTenantPersonalProfile(ctx context.Context, userID string) (*profile.TenantPersonalProfile, error) {
	const query = `SELECT id, COALESCE(full_name, ''), COALESCE(email, ''), COALESCE(avatar_url, '')
	FROM public.users
	WHERE id = $1`

	var personalProfile profile.TenantPersonalProfile
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&personalProfile.UserID,
		&personalProfile.FullName,
		&personalProfile.Email,
		&personalProfile.AvatarURL,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get tenant personal profile: %w", err)
	}
	return &personalProfile, nil
}

// UpsertTenantProfile updates or inserts tenant profile.
func (r *Repository) UpsertTenantProfile(ctx context.Context, userID string, input profile.TenantProfileInput) error {
	result, err := r.db.Exec(
		ctx,
		`UPDATE public.tenant_profiles SET
			budget_max = $2,
			preferred_area = $3,
			pets = $4,
			smoking = $5,
			age = $6,
			sex = $7,
			tenant_situation = $8,
			degree = $9,
			profession = $10,
			socialization_level = $11,
			nightlife_level = $12,
			updated_at = NOW()
		WHERE user_id = $1`,
		userID,
		input.BudgetMax,
		strings.TrimSpace(input.PreferredArea),
		input.Pets,
		input.Smoking,
		input.Age,
		nullIfEmpty(input.Sex),
		nullIfEmpty(input.Situation),
		nullIfEmpty(input.Degree),
		nullIfEmpty(input.Profession),
		nullIfEmpty(input.Socialization),
		nullIfEmpty(input.Nightlife),
	)
	if err != nil {
		return err
	}
	if result.RowsAffected() > 0 {
		return nil
	}
	_, err = r.db.Exec(
		ctx,
		`INSERT INTO public.tenant_profiles
			(user_id, budget_max, preferred_area, pets, smoking, age, sex, tenant_situation, degree, profession, socialization_level, nightlife_level, updated_at)
		VALUES
			($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
		userID,
		input.BudgetMax,
		strings.TrimSpace(input.PreferredArea),
		input.Pets,
		input.Smoking,
		input.Age,
		nullIfEmpty(input.Sex),
		nullIfEmpty(input.Situation),
		nullIfEmpty(input.Degree),
		nullIfEmpty(input.Profession),
		nullIfEmpty(input.Socialization),
		nullIfEmpty(input.Nightlife),
	)
	return err
}

// UpdateTenantPersonalProfile updates editable fields from users table.
func (r *Repository) UpdateTenantPersonalProfile(ctx context.Context, userID string, input profile.TenantPersonalProfileInput) error {
	result, err := r.db.Exec(
		ctx,
		`UPDATE public.users SET
			full_name = $2,
			updated_at = NOW()
		WHERE id = $1`,
		userID,
		strings.TrimSpace(input.FullName),
	)
	if err != nil {
		return fmt.Errorf("update tenant personal profile: %w", err)
	}
	if result.RowsAffected() == 0 {
		return errors.New("user profile not found")
	}
	return nil
}

// UpdateTenantAvatarURL persists the current avatar URL for a user.
func (r *Repository) UpdateTenantAvatarURL(ctx context.Context, userID, avatarURL string) error {
	result, err := r.db.Exec(
		ctx,
		`UPDATE public.users SET
			avatar_url = $2,
			updated_at = NOW()
		WHERE id = $1`,
		userID,
		nullIfEmpty(avatarURL),
	)
	if err != nil {
		return fmt.Errorf("update tenant avatar url: %w", err)
	}
	if result.RowsAffected() == 0 {
		return errors.New("user profile not found")
	}
	return nil
}

// UpsertUserProfile inserts/updates app user profile.
func (r *Repository) UpsertUserProfile(ctx context.Context, userID, email, fullName, role string) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO public.users (id, email, full_name, role) VALUES ($1, $2, $3, $4)
		ON CONFLICT (id) DO UPDATE SET
			email = EXCLUDED.email,
			full_name = EXCLUDED.full_name,
			role = EXCLUDED.role`,
		userID,
		email,
		fullName,
		role,
	)
	if err != nil {
		return fmt.Errorf("store user profile: %w", err)
	}
	return nil
}

// GetOwnerProfile returns the full profile for an owner user.
func (r *Repository) GetOwnerProfile(ctx context.Context, userID string) (*profile.OwnerProfile, error) {
	const query = `SELECT
		u.id,
		COALESCE(u.full_name, ''),
		COALESCE(u.email, ''),
		COALESCE(u.avatar_url, ''),
		COALESCE(op.display_name, ''),
		COALESCE(op.phone, '')
	FROM public.users u
	LEFT JOIN public.owner_profiles op ON op.user_id = u.id
	WHERE u.id = $1`

	var p profile.OwnerProfile
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&p.UserID,
		&p.FullName,
		&p.Email,
		&p.AvatarURL,
		&p.DisplayName,
		&p.Phone,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get owner profile: %w", err)
	}
	return &p, nil
}

// UpdateOwnerProfile updates editable owner profile fields.
func (r *Repository) UpdateOwnerProfile(ctx context.Context, userID string, input profile.OwnerProfileInput) error {
	if _, err := r.db.Exec(ctx,
		`UPDATE public.users SET full_name = $2, updated_at = NOW() WHERE id = $1`,
		userID, strings.TrimSpace(input.FullName),
	); err != nil {
		return fmt.Errorf("update owner full name: %w", err)
	}
	_, err := r.db.Exec(ctx,
		`INSERT INTO public.owner_profiles (user_id, display_name, phone)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id) DO UPDATE SET
			display_name = EXCLUDED.display_name,
			phone = EXCLUDED.phone,
			updated_at = NOW()`,
		userID,
		nullIfEmpty(input.DisplayName),
		nullIfEmpty(input.Phone),
	)
	if err != nil {
		return fmt.Errorf("update owner profile: %w", err)
	}
	return nil
}

// UpsertOwnerProfile inserts/updates owner profile data created during registration.
func (r *Repository) UpsertOwnerProfile(ctx context.Context, userID, displayName string) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO public.owner_profiles (user_id, display_name) VALUES ($1, $2)
		ON CONFLICT (user_id) DO UPDATE SET
			display_name = EXCLUDED.display_name,
			updated_at = NOW()`,
		userID,
		nullIfEmpty(displayName),
	)
	if err != nil {
		return fmt.Errorf("store owner profile: %w", err)
	}
	return nil
}
