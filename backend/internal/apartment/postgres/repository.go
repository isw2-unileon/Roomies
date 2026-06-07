package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository stores apartment data in PostgreSQL.
type Repository struct {
	db database
}

type database interface {
	Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
	BeginTx(ctx context.Context, txOptions pgx.TxOptions) (pgx.Tx, error)
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
		(owner_id, title, description, address, area, total_spots, occupied_spots, available_spots, base_rent, status, latitude, longitude, bathrooms, surface_m2, floor, smoking_allowed, pets_allowed, students_allowed, notes)
	VALUES
		($1, $2, $3, $4, $5, $6, 0, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
		input.Latitude,
		input.Longitude,
		input.Bathrooms,
		input.SurfaceM2,
		input.Floor,
		input.SmokingAllowed,
		input.PetsAllowed,
		input.StudentsAllowed,
		nullIfEmpty(input.Notes),
	).Scan(&apartmentID); err != nil {
		return "", 0, fmt.Errorf("insert apartment: %w", err)
	}

	stored := 0
	if len(input.ImagePaths) > 0 {
		const insertPhotoSQL = `INSERT INTO public.apartment_photos (apartment_id, url, position) VALUES ($1, $2, $3)`
		for idx, imagePath := range input.ImagePaths {
			trimmedPath := strings.TrimSpace(imagePath)
			if trimmedPath == "" {
				continue
			}
			if _, err := tx.Exec(ctx, insertPhotoSQL, apartmentID, trimmedPath, idx); err != nil {
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
        ARRAY(
            SELECT ap.url
            FROM public.apartment_photos ap
            WHERE ap.apartment_id = a.id
            ORDER BY ap.position ASC, ap.created_at ASC
        ) AS image_paths,
        COALESCE(a.latitude, 0),
        COALESCE(a.longitude, 0),
        COALESCE(a.bathrooms, 0),
        COALESCE(a.surface_m2, 0),
        COALESCE(a.floor, 0),
        a.smoking_allowed,
        a.pets_allowed,
        a.students_allowed,
        COALESCE(a.notes, '')
    FROM public.apartments a
    WHERE a.owner_id = $1
    ORDER BY a.created_at DESC`

	rows, err := r.db.Query(ctx, query, ownerID)
	if err != nil {
		return nil, fmt.Errorf("list owner apartments: %w", err)
	}
	defer rows.Close()

	return scanApartmentRows(rows)
}

// ListAvailableApartments returns tenant-visible apartments with free spots.
func (r *Repository) ListAvailableApartments(ctx context.Context, filters apartment.ListApartmentsFilters) ([]apartment.Apartment, error) {
	query := buildListAvailableApartmentsQuery(filters)
	rows, err := r.db.Query(ctx, query.query, query.args...)
	if err != nil {
		return nil, fmt.Errorf("list available apartments: %w", err)
	}
	defer rows.Close()

	return scanApartmentRows(rows)
}

func scanApartmentRows(rows pgx.Rows) ([]apartment.Apartment, error) {
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
			&item.ImagePaths,
			&item.Latitude,
			&item.Longitude,
			&item.Bathrooms,
			&item.SurfaceM2,
			&item.Floor,
			&item.SmokingAllowed,
			&item.PetsAllowed,
			&item.StudentsAllowed,
			&item.Notes,
		); err != nil {
			return nil, fmt.Errorf("scan apartments: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate apartments: %w", err)
	}
	return result, nil
}

// ListApartmentsInRadius returns apartments within a radius (km) from a point using the Haversine formula.
func (r *Repository) ListApartmentsInRadius(ctx context.Context, lat, lng, radiusKm float64) ([]apartment.Apartment, error) {
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
		ARRAY(
			SELECT ap.url
			FROM public.apartment_photos ap
			WHERE ap.apartment_id = a.id
			ORDER BY ap.position ASC, ap.created_at ASC
		) AS image_paths,
		COALESCE(a.latitude, 0),
		COALESCE(a.longitude, 0),
		COALESCE(a.bathrooms, 0),
		COALESCE(a.surface_m2, 0),
		COALESCE(a.floor, 0),
		a.smoking_allowed,
		a.pets_allowed,
		a.students_allowed,
		COALESCE(a.notes, '')
	FROM public.apartments a
	WHERE a.latitude IS NOT NULL AND a.longitude IS NOT NULL
	AND a.status <> 'CLOSED'
	AND (
		6371 * acos(
			cos(radians($1)) * cos(radians(a.latitude)) *
			cos(radians(a.longitude) - radians($2)) +
			sin(radians($1)) * sin(radians(a.latitude))
		)
	) <= $3
	ORDER BY (
		6371 * acos(
			cos(radians($1)) * cos(radians(a.latitude)) *
			cos(radians(a.longitude) - radians($2)) +
			sin(radians($1)) * sin(radians(a.latitude))
		)
	) ASC`

	rows, err := r.db.Query(ctx, query, lat, lng, radiusKm)
	if err != nil {
		return nil, fmt.Errorf("list apartments in radius: %w", err)
	}
	defer rows.Close()

	return scanApartmentRows(rows)
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
        ARRAY(
            SELECT ap.url
            FROM public.apartment_photos ap
            WHERE ap.apartment_id = a.id
            ORDER BY ap.position ASC, ap.created_at ASC
        ) AS image_paths,
        COALESCE(a.latitude, 0),
        COALESCE(a.longitude, 0),
        COALESCE(a.bathrooms, 0),
        COALESCE(a.surface_m2, 0),
        COALESCE(a.floor, 0),
        a.smoking_allowed,
        a.pets_allowed,
        a.students_allowed,
        COALESCE(a.notes, '')
    FROM public.apartments a
    WHERE a.status <> 'CLOSED'`

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

	if filters.Area != "" {
		args = append(args, "%"+filters.Area+"%")
		whereClauses = append(whereClauses, fmt.Sprintf("COALESCE(a.area, '') ILIKE $%d", len(args)))
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
		whereClauses = append(whereClauses, "a.status IN ('AVAILABLE', 'PARTIALLY_OCCUPIED', 'FULL', 'OCCUPIED')")
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

// GetTenantClosedApartment returns the closed apartment where the tenant is confirmed, if any.
func (r *Repository) GetTenantClosedApartment(ctx context.Context, tenantID string) (*apartment.Apartment, error) {
	const query = `SELECT
        a.id,
        a.title,
        COALESCE(a.description, ''),
        a.owner_id,
        a.address,
        COALESCE(a.area, ''),
        a.total_spots,
        a.occupied_spots,
        a.base_rent,
        a.status,
        TO_CHAR(a.created_at, 'YYYY-MM-DD') AS created_at,
        ARRAY(
            SELECT ap.url
            FROM public.apartment_photos ap
            WHERE ap.apartment_id = a.id
            ORDER BY ap.position ASC, ap.created_at ASC
        ) AS image_paths,
        COALESCE(a.latitude, 0),
        COALESCE(a.longitude, 0),
        COALESCE(a.bathrooms, 0),
        COALESCE(a.surface_m2, 0),
        COALESCE(a.floor, 0),
        a.smoking_allowed,
        a.pets_allowed,
        a.students_allowed,
        COALESCE(a.notes, '')
    FROM public.applications app
    INNER JOIN public.apartments a ON a.id = app.apartment_id
    WHERE app.tenant_id = $1
        AND app.status = 'FULLY_CONFIRMED'
        AND a.status = 'CLOSED'
    ORDER BY app.owner_confirmed_at ASC NULLS LAST, app.updated_at ASC
    LIMIT 1`

	var item apartment.Apartment
	err := r.db.QueryRow(ctx, query, tenantID).Scan(
		&item.ID,
		&item.Title,
		&item.Description,
		&item.OwnerID,
		&item.Address,
		&item.Area,
		&item.TotalSpots,
		&item.OccupiedSpots,
		&item.BaseRent,
		&item.Status,
		&item.CreatedAt,
		&item.ImagePaths,
		&item.Latitude,
		&item.Longitude,
		&item.Bathrooms,
		&item.SurfaceM2,
		&item.Floor,
		&item.SmokingAllowed,
		&item.PetsAllowed,
		&item.StudentsAllowed,
		&item.Notes,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get tenant closed apartment: %w", err)
	}
	item.IsCurrentTenantHome = true
	return &item, nil
}

// GetOwnerApartmentByID returns one apartment when it belongs to the owner.
func (r *Repository) GetOwnerApartmentByID(ctx context.Context, ownerID, apartmentID string) (*apartment.Apartment, error) {
	const query = `SELECT
        a.id,
        a.title,
        COALESCE(a.description, ''),
        a.owner_id,
        a.address,
        COALESCE(a.area, ''),
        a.total_spots,
        a.occupied_spots,
        a.base_rent,
        a.status,
        TO_CHAR(a.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
        ARRAY(
            SELECT ap.url
            FROM public.apartment_photos ap
            WHERE ap.apartment_id = a.id
            ORDER BY ap.position ASC, ap.created_at ASC
        ) AS image_paths,
        COALESCE(a.latitude, 0),
        COALESCE(a.longitude, 0),
        COALESCE(a.bathrooms, 0),
        COALESCE(a.surface_m2, 0),
        COALESCE(a.floor, 0),
        a.smoking_allowed,
        a.pets_allowed,
        a.students_allowed,
        COALESCE(a.notes, '')
    FROM public.apartments a
    WHERE a.id = $1 AND a.owner_id = $2`

	var item apartment.Apartment
	err := r.db.QueryRow(ctx, query, apartmentID, ownerID).Scan(
		&item.ID,
		&item.Title,
		&item.Description,
		&item.OwnerID,
		&item.Address,
		&item.Area,
		&item.TotalSpots,
		&item.OccupiedSpots,
		&item.BaseRent,
		&item.Status,
		&item.CreatedAt,
		&item.ImagePaths,
		&item.Latitude,
		&item.Longitude,
		&item.Bathrooms,
		&item.SurfaceM2,
		&item.Floor,
		&item.SmokingAllowed,
		&item.PetsAllowed,
		&item.StudentsAllowed,
		&item.Notes,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get owner apartment by id: %w", err)
	}
	return &item, nil
}

// UpdateOwnerApartment updates one apartment when it belongs to the owner.
func (r *Repository) UpdateOwnerApartment(ctx context.Context, ownerID, apartmentID string, input apartment.CreateApartmentInput) (*apartment.Apartment, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("begin update apartment tx: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	const updateApartmentSQL = `UPDATE public.apartments
	SET title = $3,
		description = $4,
		address = $5,
		area = $6,
		total_spots = $7,
		available_spots = $7 - occupied_spots,
		base_rent = $8,
		latitude = $9,
		longitude = $10,
		bathrooms = $11,
		surface_m2 = $12,
		floor = $13,
		smoking_allowed = $14,
		pets_allowed = $15,
		students_allowed = $16,
		notes = $17
	WHERE id = $1 AND owner_id = $2
	RETURNING id`

	var updatedID string
	if err := tx.QueryRow(
		ctx,
		updateApartmentSQL,
		apartmentID,
		ownerID,
		input.Title,
		nullIfEmpty(input.Description),
		input.Address,
		nullIfEmpty(input.Area),
		input.TotalSpots,
		input.BaseRent,
		input.Latitude,
		input.Longitude,
		input.Bathrooms,
		input.SurfaceM2,
		input.Floor,
		input.SmokingAllowed,
		input.PetsAllowed,
		input.StudentsAllowed,
		nullIfEmpty(input.Notes),
	).Scan(&updatedID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("update apartment: %w", err)
	}

	if _, err := tx.Exec(ctx, `DELETE FROM public.apartment_photos WHERE apartment_id = $1`, apartmentID); err != nil {
		return nil, fmt.Errorf("delete apartment photos: %w", err)
	}
	const insertPhotoSQL = `INSERT INTO public.apartment_photos (apartment_id, url, position) VALUES ($1, $2, $3)`
	for idx, imagePath := range input.ImagePaths {
		trimmedPath := strings.TrimSpace(imagePath)
		if trimmedPath == "" {
			continue
		}
		if _, err := tx.Exec(ctx, insertPhotoSQL, apartmentID, trimmedPath, idx); err != nil {
			return nil, fmt.Errorf("insert apartment photo: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit update apartment tx: %w", err)
	}

	return r.GetOwnerApartmentByID(ctx, ownerID, apartmentID)
}

// GetApartmentByID returns one apartment by id.
func (r *Repository) GetApartmentByID(ctx context.Context, apartmentID string) (*apartment.Apartment, error) {
	const query = `SELECT
        a.id,
        a.title,
        COALESCE(a.description, ''),
        a.owner_id,
        a.address,
        COALESCE(a.area, ''),
        a.total_spots,
        a.occupied_spots,
        a.base_rent,
        a.status,
        TO_CHAR(a.created_at, 'YYYY-MM-DD') AS created_at,
        ARRAY(
            SELECT ap.url
            FROM public.apartment_photos ap
            WHERE ap.apartment_id = a.id
            ORDER BY ap.position ASC, ap.created_at ASC
        ) AS image_paths,
        COALESCE(a.latitude, 0),
        COALESCE(a.longitude, 0),
        COALESCE(a.bathrooms, 0),
        COALESCE(a.surface_m2, 0),
        COALESCE(a.floor, 0),
        a.smoking_allowed,
        a.pets_allowed,
        a.students_allowed,
        COALESCE(a.notes, '')
    FROM public.apartments a
    WHERE a.id = $1`

	var item apartment.Apartment
	err := r.db.QueryRow(ctx, query, apartmentID).Scan(
		&item.ID,
		&item.Title,
		&item.Description,
		&item.OwnerID,
		&item.Address,
		&item.Area,
		&item.TotalSpots,
		&item.OccupiedSpots,
		&item.BaseRent,
		&item.Status,
		&item.CreatedAt,
		&item.ImagePaths,
		&item.Latitude,
		&item.Longitude,
		&item.Bathrooms,
		&item.SurfaceM2,
		&item.Floor,
		&item.SmokingAllowed,
		&item.PetsAllowed,
		&item.StudentsAllowed,
		&item.Notes,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("get apartment by id: %w", err)
	}
	return &item, nil
}

// CloseApartment sets the apartment status to CLOSED, cancels all pending
// applications for this apartment, and locks its confirmed tenants: their
// pending applications to other apartments are cancelled and their confirmed
// spots in other apartments are released. If a tenant already belongs to
// another closed apartment, that tenant is skipped (first-closed wins).
func (r *Repository) CloseApartment(ctx context.Context, ownerID, apartmentID string) (bool, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return false, fmt.Errorf("begin close apartment tx: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	const updateApartmentSQL = `UPDATE public.apartments
		SET status = 'CLOSED', updated_at = NOW()
		WHERE id = $1 AND owner_id = $2 AND status <> 'CLOSED'
		RETURNING id`

	var updatedID string
	if err := tx.QueryRow(ctx, updateApartmentSQL, apartmentID, ownerID).Scan(&updatedID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, fmt.Errorf("close apartment: %w", err)
	}

	const cancelApplicationsSQL = `UPDATE public.applications
		SET status = 'CANCELLED', updated_at = NOW()
		WHERE apartment_id = $1 AND status IN ('PENDING_OWNER', 'PENDING_CONFIRMED_TENANTS')`

	if _, err := tx.Exec(ctx, cancelApplicationsSQL, apartmentID); err != nil {
		return false, fmt.Errorf("cancel pending applications on close: %w", err)
	}

	if err := r.lockTenantsOnCloseTx(ctx, tx, apartmentID); err != nil {
		return false, err
	}

	if err := tx.Commit(ctx); err != nil {
		return false, fmt.Errorf("commit close apartment tx: %w", err)
	}

	return true, nil
}

// lockTenantsOnCloseTx handles the tenant side-effects when closing an apartment.
func (r *Repository) lockTenantsOnCloseTx(ctx context.Context, tx pgx.Tx, apartmentID string) error {
	const confirmedTenantsSQL = `SELECT app.tenant_id::text
		FROM public.applications app
		WHERE app.apartment_id = $1
			AND app.status = 'FULLY_CONFIRMED'
			AND app.tenant_id IS NOT NULL`

	rows, err := tx.Query(ctx, confirmedTenantsSQL, apartmentID)
	if err != nil {
		return fmt.Errorf("list confirmed tenants on close: %w", err)
	}
	defer rows.Close()

	tenantIDs := make([]string, 0)
	for rows.Next() {
		var tid string
		if err := rows.Scan(&tid); err != nil {
			return fmt.Errorf("scan confirmed tenant on close: %w", err)
		}
		tenantIDs = append(tenantIDs, tid)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate confirmed tenants on close: %w", err)
	}

	for _, tenantID := range tenantIDs {
		alreadyLocked, err := r.tenantInOtherClosedApartmentTx(ctx, tx, tenantID, apartmentID)
		if err != nil {
			return err
		}
		if alreadyLocked {
			if err := r.removeTenantFromClosingApartmentTx(ctx, tx, tenantID, apartmentID); err != nil {
				return err
			}
			continue
		}

		if err := r.cancelTenantPendingApplicationsElsewhereTx(ctx, tx, tenantID, apartmentID); err != nil {
			return err
		}
		if err := r.removeTenantFromOtherApartmentsTx(ctx, tx, tenantID, apartmentID); err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) tenantInOtherClosedApartmentTx(ctx context.Context, tx pgx.Tx, tenantID, excludeApartmentID string) (bool, error) {
	const query = `SELECT EXISTS (
		SELECT 1
		FROM public.applications app
		INNER JOIN public.apartments a ON a.id = app.apartment_id
		WHERE app.tenant_id = $1
			AND app.apartment_id <> $2
			AND app.status = 'FULLY_CONFIRMED'
			AND a.status = 'CLOSED'
	)`

	var exists bool
	if err := tx.QueryRow(ctx, query, tenantID, excludeApartmentID).Scan(&exists); err != nil {
		return false, fmt.Errorf("check tenant in other closed apartment: %w", err)
	}
	return exists, nil
}

func (r *Repository) cancelTenantPendingApplicationsElsewhereTx(ctx context.Context, tx pgx.Tx, tenantID, apartmentID string) error {
	const query = `UPDATE public.applications
		SET status = 'CANCELLED', updated_at = NOW()
		WHERE tenant_id = $1
			AND apartment_id <> $2
			AND status IN ('PENDING_OWNER', 'PENDING_CONFIRMED_TENANTS')`

	if _, err := tx.Exec(ctx, query, tenantID, apartmentID); err != nil {
		return fmt.Errorf("cancel tenant pending applications elsewhere on close: %w", err)
	}
	return nil
}

func (r *Repository) removeTenantFromClosingApartmentTx(ctx context.Context, tx pgx.Tx, tenantID, apartmentID string) error {
	const query = `UPDATE public.applications
		SET status = 'CANCELLED', updated_at = NOW()
		WHERE tenant_id = $1
			AND apartment_id = $2
			AND status = 'FULLY_CONFIRMED'
		RETURNING apartment_id::text`

	var affectedApartmentID string
	if err := tx.QueryRow(ctx, query, tenantID, apartmentID).Scan(&affectedApartmentID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return fmt.Errorf("remove tenant from closing apartment on close: %w", err)
	}
	return r.decrementApartmentOccupancyTx(ctx, tx, affectedApartmentID)
}

func (r *Repository) removeTenantFromOtherApartmentsTx(ctx context.Context, tx pgx.Tx, tenantID, apartmentID string) error {
	const query = `UPDATE public.applications
		SET status = 'CANCELLED', updated_at = NOW()
		WHERE tenant_id = $1
			AND apartment_id <> $2
			AND status = 'FULLY_CONFIRMED'
		RETURNING apartment_id::text`

	rows, err := tx.Query(ctx, query, tenantID, apartmentID)
	if err != nil {
		return fmt.Errorf("remove tenant from other apartments on close: %w", err)
	}
	defer rows.Close()

	var affectedApartments []string
	for rows.Next() {
		var aid string
		if err := rows.Scan(&aid); err != nil {
			return fmt.Errorf("scan removed tenant apartment on close: %w", err)
		}
		affectedApartments = append(affectedApartments, aid)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate removed tenant apartments on close: %w", err)
	}

	for _, aid := range affectedApartments {
		if err := r.decrementApartmentOccupancyTx(ctx, tx, aid); err != nil {
			return err
		}
	}
	return nil
}

// ListApartmentTenants returns confirmed tenants living in an apartment.
func (r *Repository) ListApartmentTenants(ctx context.Context, ownerID, apartmentID string) ([]apartment.Tenant, error) {
	const query = `SELECT
		u.id::text,
		COALESCE(u.full_name, ''),
		COALESCE(u.email, ''),
		COALESCE(u.avatar_url, ''),
		COALESCE(TO_CHAR(app.owner_confirmed_at, 'YYYY-MM-DD'), TO_CHAR(app.updated_at, 'YYYY-MM-DD'))
	FROM public.applications app
	INNER JOIN public.apartments a ON a.id = app.apartment_id
	INNER JOIN public.users u ON u.id = app.tenant_id
	WHERE app.apartment_id = $1
		AND a.owner_id = $2
		AND app.status = 'FULLY_CONFIRMED'
		AND app.tenant_id IS NOT NULL
	ORDER BY app.owner_confirmed_at ASC`

	rows, err := r.db.Query(ctx, query, apartmentID, ownerID)
	if err != nil {
		return nil, fmt.Errorf("list apartment tenants: %w", err)
	}
	defer rows.Close()

	result := make([]apartment.Tenant, 0)
	for rows.Next() {
		var item apartment.Tenant
		if err := rows.Scan(&item.UserID, &item.Name, &item.Email, &item.AvatarURL, &item.JoinedAt); err != nil {
			return nil, fmt.Errorf("scan apartment tenant: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate apartment tenants: %w", err)
	}
	return result, nil
}

// ListApartmentResidents returns confirmed tenants living in an apartment (public view, no owner filter).
func (r *Repository) ListApartmentResidents(ctx context.Context, apartmentID string) ([]apartment.Tenant, error) {
	const query = `SELECT
		u.id::text,
		COALESCE(u.full_name, ''),
		COALESCE(u.email, ''),
		COALESCE(u.avatar_url, ''),
		COALESCE(TO_CHAR(app.owner_confirmed_at, 'YYYY-MM-DD'), TO_CHAR(app.updated_at, 'YYYY-MM-DD'))
	FROM public.applications app
	INNER JOIN public.apartments a ON a.id = app.apartment_id
	INNER JOIN public.users u ON u.id = app.tenant_id
	WHERE app.apartment_id = $1
		AND app.status = 'FULLY_CONFIRMED'
		AND app.tenant_id IS NOT NULL
	ORDER BY app.owner_confirmed_at ASC`

	rows, err := r.db.Query(ctx, query, apartmentID)
	if err != nil {
		return nil, fmt.Errorf("list apartment residents: %w", err)
	}
	defer rows.Close()

	result := make([]apartment.Tenant, 0)
	for rows.Next() {
		var item apartment.Tenant
		if err := rows.Scan(&item.UserID, &item.Name, &item.Email, &item.AvatarURL, &item.JoinedAt); err != nil {
			return nil, fmt.Errorf("scan apartment resident: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate apartment residents: %w", err)
	}
	return result, nil
}

// ReopenApartment sets a closed apartment status back to AVAILABLE.
func (r *Repository) ReopenApartment(ctx context.Context, ownerID, apartmentID string) (bool, error) {
	const query = `UPDATE public.apartments
		SET status = 'AVAILABLE', updated_at = NOW()
		WHERE id = $1 AND owner_id = $2 AND status = 'CLOSED'
		RETURNING id`

	var updatedID string
	if err := r.db.QueryRow(ctx, query, apartmentID, ownerID).Scan(&updatedID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, fmt.Errorf("reopen apartment: %w", err)
	}
	return true, nil
}

func (r *Repository) decrementApartmentOccupancyTx(ctx context.Context, tx pgx.Tx, apartmentID string) error {
	const query = `UPDATE public.apartments
		SET occupied_spots = GREATEST(occupied_spots - 1, 0),
			available_spots = LEAST(available_spots + 1, total_spots),
			status = CASE
				WHEN status IN ('CLOSED', 'HIDDEN') THEN status
				WHEN GREATEST(occupied_spots - 1, 0) = 0 THEN 'AVAILABLE'
				WHEN LEAST(available_spots + 1, total_spots) > 0 THEN 'PARTIALLY_OCCUPIED'
				ELSE 'FULL'
			END,
			updated_at = NOW()
		WHERE id = $1`

	if _, err := tx.Exec(ctx, query, apartmentID); err != nil {
		return fmt.Errorf("decrement apartment occupancy: %w", err)
	}
	return nil
}
