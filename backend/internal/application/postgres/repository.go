package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/application"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository stores application data in PostgreSQL.
type Repository struct {
	db *pgxpool.Pool
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
		COALESCE(tp.budget_min, 0),
		COALESCE(tp.budget_max, 0),
		COALESCE(tp.preferred_area, ''),
		COALESCE(tp.pets, FALSE),
		COALESCE(tp.smoking, FALSE),
		COALESCE(tp.noise_level, ''),
		COALESCE(tp.cleanliness, ''),
		COALESCE(tp.work_schedule, '')
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
			&item.BudgetMin,
			&item.BudgetMax,
			&item.PreferredArea,
			&item.Pets,
			&item.Smoking,
			&item.NoiseLevel,
			&item.Cleanliness,
			&item.WorkSchedule,
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
		app.id,
		app.apartment_id,
		a.title,
		COALESCE(owner.full_name, ''),
		a.address,
		COALESCE((
			SELECT ap.url
			FROM public.apartment_photos ap
			WHERE ap.apartment_id = a.id
			ORDER BY ap.position ASC, ap.created_at ASC
			LIMIT 1
		), '') AS image_url,
		a.total_spots,
		0 AS size,
		0 AS bathrooms,
		app.status,
		TO_CHAR(app.created_at, 'YYYY-MM-DD') AS created_at,
		0 AS compatibility_score
	FROM public.applications app
	INNER JOIN public.apartments a ON a.id = app.apartment_id
	LEFT JOIN public.users owner ON owner.id = a.owner_id
	WHERE app.tenant_id = $1
	ORDER BY app.created_at DESC`

	rows, err := r.db.Query(ctx, query, tenantID)
	if err != nil {
		return nil, fmt.Errorf("list tenant applications: %w", err)
	}
	defer rows.Close()

	result := make([]application.TenantApplication, 0)
	for rows.Next() {
		var item application.TenantApplication
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
			&item.Status,
			&item.CreatedAt,
			&item.CompatibilityScore,
		); err != nil {
			return nil, fmt.Errorf("scan tenant applications: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate tenant applications: %w", err)
	}

	return result, nil
}
