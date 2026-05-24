package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository stores apartment data in PostgreSQL.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a PostgreSQL apartment repository.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func nullIfEmpty(s string) interface{} {
	trimmed := strings.TrimSpace(s)
	if trimmed == "" {
		return nil
	}
	return trimmed
}

// CreateApartment inserts apartment and optional photos in one transaction.
func (r *Repository) CreateApartment(ctx context.Context, ownerID string, input apartment.CreateApartmentInput) (string, int, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return "", 0, fmt.Errorf("begin create apartment tx: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	const insertApartmentSQL = `INSERT INTO public.apartments
		(owner_id, title, description, address, area, total_spots, occupied_spots, available_spots, base_rent, current_rent, status)
	VALUES
		($1, $2, $3, $4, $5, $6, 0, $6, $7, $7, $8)
	RETURNING id`

	var apartmentID string
	if err := tx.QueryRow(
		ctx,
		insertApartmentSQL,
		ownerID,
		input.Title,
		nullIfEmpty(input.Description),
		input.Address,
		nullIfEmpty(input.Area),
		input.TotalSpots,
		input.BaseRent,
		input.Status,
	).Scan(&apartmentID); err != nil {
		return "", 0, fmt.Errorf("insert apartment: %w", err)
	}

	stored := 0
	if len(input.ImageURLs) > 0 {
		const insertPhotoSQL = `INSERT INTO public.apartment_photos (apartment_id, url, position) VALUES ($1, $2, $3)`
		for idx, imageURL := range input.ImageURLs {
			trimmedURL := strings.TrimSpace(imageURL)
			if trimmedURL == "" {
				continue
			}
			if _, err := tx.Exec(ctx, insertPhotoSQL, apartmentID, trimmedURL, idx); err != nil {
				return "", 0, fmt.Errorf("insert apartment photo: %w", err)
			}
			stored++
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return "", 0, fmt.Errorf("commit create apartment tx: %w", err)
	}

	return apartmentID, stored, nil
}

// ListOwnerApartments returns apartments published by an owner.
func (r *Repository) ListOwnerApartments(ctx context.Context, ownerID string) ([]apartment.Apartment, error) {
	const query = `SELECT
		a.id,
		a.title,
		a.address,
		COALESCE(a.area, ''),
		a.total_spots,
		a.occupied_spots,
		a.base_rent,
		a.status,
		TO_CHAR(a.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		COALESCE((
			SELECT ap.url
			FROM public.apartment_photos ap
			WHERE ap.apartment_id = a.id
			ORDER BY ap.position ASC, ap.created_at ASC
			LIMIT 1
		), '') AS image_url
	FROM public.apartments a
	WHERE a.owner_id = $1
	ORDER BY a.created_at DESC`

	rows, err := r.db.Query(ctx, query, ownerID)
	if err != nil {
		return nil, fmt.Errorf("list owner apartments: %w", err)
	}
	defer rows.Close()

	result := make([]apartment.Apartment, 0)
	for rows.Next() {
		var item apartment.Apartment
		if err := rows.Scan(
			&item.ID,
			&item.Title,
			&item.Address,
			&item.Area,
			&item.TotalSpots,
			&item.OccupiedSpots,
			&item.BaseRent,
			&item.Status,
			&item.CreatedAt,
			&item.ImageURL,
		); err != nil {
			return nil, fmt.Errorf("scan owner apartments: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate owner apartments: %w", err)
	}

	return result, nil
}

// ListAvailableApartments returns tenant-visible apartments with free spots.
func (r *Repository) ListAvailableApartments(ctx context.Context, filters apartment.ListApartmentsFilters) ([]apartment.Apartment, error) {
	query := buildListAvailableApartmentsQuery(filters)
	rows, err := r.db.Query(ctx, query.query, query.args...)
	if err != nil {
		return nil, fmt.Errorf("list available apartments: %w", err)
	}
	defer rows.Close()

	result := make([]apartment.Apartment, 0)
	for rows.Next() {
		var item apartment.Apartment
		if err := rows.Scan(
			&item.ID,
			&item.Title,
			&item.Address,
			&item.Area,
			&item.TotalSpots,
			&item.OccupiedSpots,
			&item.BaseRent,
			&item.Status,
			&item.CreatedAt,
			&item.ImageURL,
		); err != nil {
			return nil, fmt.Errorf("scan available apartments: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate available apartments: %w", err)
	}

	return result, nil
}

type availableApartmentsQuery struct {
	query string
	args  []interface{}
}

func buildListAvailableApartmentsQuery(filters apartment.ListApartmentsFilters) availableApartmentsQuery {
	baseQuery := `SELECT
		a.id,
		a.title,
		a.address,
		COALESCE(a.area, ''),
		a.total_spots,
		a.occupied_spots,
		a.base_rent,
		a.status,
		TO_CHAR(a.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
		COALESCE((
			SELECT ap.url
			FROM public.apartment_photos ap
			WHERE ap.apartment_id = a.id
			ORDER BY ap.position ASC, ap.created_at ASC
			LIMIT 1
		), '') AS image_url
	FROM public.apartments a
	WHERE 1=1`

	whereClauses := make([]string, 0, 8)
	args := make([]interface{}, 0, 12)
	whereClauses, args = appendTextAndAreaFilters(whereClauses, args, filters)
	whereClauses, args = appendRangeFilters(whereClauses, args, filters)
	whereClauses = appendAvailabilityFilters(whereClauses, filters.Availability)

	query := baseQuery
	if len(whereClauses) > 0 {
		query += " AND " + strings.Join(whereClauses, " AND ")
	}

	query += buildAvailableApartmentsOrderBy(filters.SortBy)
	return availableApartmentsQuery{query: query, args: args}
}

func appendTextAndAreaFilters(whereClauses []string, args []interface{}, filters apartment.ListApartmentsFilters) ([]string, []interface{}) {

	if filters.Query != "" {
		args = append(args, "%"+filters.Query+"%")
		arg := fmt.Sprintf("$%d", len(args))
		whereClauses = append(whereClauses, "(a.title ILIKE "+arg+" OR a.address ILIKE "+arg+" OR COALESCE(a.area, '') ILIKE "+arg+")")
	}

	if filters.Area != "" && strings.ToLower(filters.Area) != "all" {
		args = append(args, strings.ToLower(filters.Area))
		whereClauses = append(whereClauses, fmt.Sprintf("LOWER(COALESCE(a.area, '')) = $%d", len(args)))
	}
	return whereClauses, args
}

func appendRangeFilters(whereClauses []string, args []interface{}, filters apartment.ListApartmentsFilters) ([]string, []interface{}) {

	args = append(args, filters.PriceMin)
	whereClauses = append(whereClauses, fmt.Sprintf("a.base_rent >= $%d", len(args)))
	args = append(args, filters.PriceMax)
	whereClauses = append(whereClauses, fmt.Sprintf("a.base_rent <= $%d", len(args)))

	args = append(args, filters.TotalRoomsMin)
	whereClauses = append(whereClauses, fmt.Sprintf("a.total_spots >= $%d", len(args)))
	args = append(args, filters.TotalRoomsMax)
	whereClauses = append(whereClauses, fmt.Sprintf("a.total_spots <= $%d", len(args)))

	args = append(args, filters.AvailableRoomsMin)
	whereClauses = append(whereClauses, fmt.Sprintf("(a.total_spots - a.occupied_spots) >= $%d", len(args)))
	args = append(args, filters.AvailableRoomsMax)
	whereClauses = append(whereClauses, fmt.Sprintf("(a.total_spots - a.occupied_spots) <= $%d", len(args)))

	return whereClauses, args
}

func appendAvailabilityFilters(whereClauses []string, availability string) []string {

	switch availability {
	case "available":
		whereClauses = append(whereClauses, "(a.total_spots - a.occupied_spots) > 0")
		whereClauses = append(whereClauses, "a.status IN ('AVAILABLE', 'PARTIALLY_OCCUPIED')")
	case "soon":
		whereClauses = append(whereClauses, "((a.total_spots - a.occupied_spots) <= 0 OR a.status IN ('FULL', 'OCCUPIED'))")
	case "all":
	}
	return whereClauses
}

func buildAvailableApartmentsOrderBy(sortBy string) string {
	switch sortBy {
	case "price_low":
		return " ORDER BY a.base_rent ASC, a.created_at DESC"
	case "price_high":
		return " ORDER BY a.base_rent DESC, a.created_at DESC"
	case "rooms":
		return " ORDER BY a.total_spots DESC, a.created_at DESC"
	case "newest", "relevance":
		return " ORDER BY a.created_at DESC"
	default:
		return " ORDER BY a.created_at DESC"
	}
}

// GetApartmentByID returns one apartment by id.
func (r *Repository) GetApartmentByID(ctx context.Context, apartmentID string) (*apartment.Apartment, error) {
	const query = `SELECT
		a.id,
		a.title,
		COALESCE(a.description, ''),
		a.owner_id,
		COALESCE(u.full_name, ''),
		a.address,
		COALESCE(a.area, ''),
		a.total_spots,
		a.occupied_spots,
		a.base_rent,
		a.status,
		TO_CHAR(a.created_at, 'YYYY-MM-DD') AS created_at,
		COALESCE((
			SELECT ap.url
			FROM public.apartment_photos ap
			WHERE ap.apartment_id = a.id
			ORDER BY ap.position ASC, ap.created_at ASC
			LIMIT 1
		), '') AS image_url
	FROM public.apartments a
	LEFT JOIN public.users u ON u.id = a.owner_id
	WHERE a.id = $1`

	var item apartment.Apartment
	err := r.db.QueryRow(ctx, query, apartmentID).Scan(
		&item.ID,
		&item.Title,
		&item.Description,
		&item.OwnerID,
		&item.OwnerName,
		&item.Address,
		&item.Area,
		&item.TotalSpots,
		&item.OccupiedSpots,
		&item.BaseRent,
		&item.Status,
		&item.CreatedAt,
		&item.ImageURL,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get apartment by id: %w", err)
	}
	return &item, nil
}

// GetApartmentRules returns apartment rules, when available.
func (r *Repository) GetApartmentRules(ctx context.Context, apartmentID string) (*apartment.Rules, error) {
	const query = `SELECT
		smoking_allowed,
		pets_allowed,
		COALESCE(max_noise_level, ''),
		COALESCE(cleanliness_expectation, ''),
		COALESCE(preferred_schedule, '')
	FROM public.apartment_rules
	WHERE apartment_id = $1`

	var rules apartment.Rules
	err := r.db.QueryRow(ctx, query, apartmentID).Scan(
		&rules.SmokingAllowed,
		&rules.PetsAllowed,
		&rules.MaxNoiseLevel,
		&rules.CleanlinessExpectation,
		&rules.PreferredSchedule,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get apartment rules: %w", err)
	}
	return &rules, nil
}

// GetTenantProfileByUserID returns tenant profile data for compatibility.
func (r *Repository) GetTenantProfileByUserID(ctx context.Context, userID string) (*apartment.TenantProfile, error) {
	const query = `SELECT
		user_id,
		COALESCE(budget_min, 0),
		COALESCE(budget_max, 0),
		COALESCE(preferred_area, ''),
		COALESCE(pets, FALSE),
		COALESCE(smoking, FALSE),
		COALESCE(noise_level, ''),
		COALESCE(cleanliness, ''),
		COALESCE(work_schedule, ''),
		COALESCE(age, 0),
		COALESCE(university, '')
	FROM public.tenant_profiles
	WHERE user_id = $1`

	var profile apartment.TenantProfile
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&profile.UserID,
		&profile.BudgetMin,
		&profile.BudgetMax,
		&profile.PreferredArea,
		&profile.Pets,
		&profile.Smoking,
		&profile.NoiseLevel,
		&profile.Cleanliness,
		&profile.WorkSchedule,
		&profile.Age,
		&profile.University,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get tenant profile by user id: %w", err)
	}
	return &profile, nil
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
func (r *Repository) ListInterestedTenants(ctx context.Context, apartmentID string) ([]apartment.InterestedTenantCandidate, error) {
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

	result := make([]apartment.InterestedTenantCandidate, 0)
	for rows.Next() {
		var item apartment.InterestedTenantCandidate
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
func (r *Repository) ListTenantApplications(ctx context.Context, tenantID string) ([]apartment.TenantApplication, error) {
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

	result := make([]apartment.TenantApplication, 0)
	for rows.Next() {
		var item apartment.TenantApplication
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
