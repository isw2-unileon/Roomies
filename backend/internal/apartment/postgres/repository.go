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
			return nil, fmt.Errorf("scan apartments in radius: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate apartments in radius: %w", err)
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
