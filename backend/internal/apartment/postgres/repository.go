package postgres

import (
	"context"
	"fmt"
	"strings"

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
func (r *Repository) CreateApartment(ctx context.Context, ownerID, title, description, address, area, availableFrom string, totalSpots, bathrooms, baseRent int, imageURLs []string) (string, int, error) {
	tx, err := r.db.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return "", 0, fmt.Errorf("begin create apartment tx: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	descriptionParts := make([]string, 0, 3)
	if strings.TrimSpace(description) != "" {
		descriptionParts = append(descriptionParts, strings.TrimSpace(description))
	}
	descriptionParts = append(descriptionParts, fmt.Sprintf("Banos: %d", bathrooms))
	if strings.TrimSpace(availableFrom) != "" {
		descriptionParts = append(descriptionParts, fmt.Sprintf("Disponible desde: %s", strings.TrimSpace(availableFrom)))
	}
	finalDescription := strings.Join(descriptionParts, "\n\n")

	const insertApartmentSQL = `INSERT INTO public.apartments
		(owner_id, title, description, address, area, total_spots, occupied_spots, available_spots, base_rent, current_rent, status)
	VALUES
		($1, $2, $3, $4, $5, $6, 0, $6, $7, $7, 'AVAILABLE')
	RETURNING id`

	var apartmentID string
	if err := tx.QueryRow(
		ctx,
		insertApartmentSQL,
		ownerID,
		strings.TrimSpace(title),
		nullIfEmpty(finalDescription),
		strings.TrimSpace(address),
		nullIfEmpty(area),
		totalSpots,
		baseRent,
	).Scan(&apartmentID); err != nil {
		return "", 0, fmt.Errorf("insert apartment: %w", err)
	}

	stored := 0
	if len(imageURLs) > 0 {
		const insertPhotoSQL = `INSERT INTO public.apartment_photos (apartment_id, url, position) VALUES ($1, $2, $3)`
		for idx, imageURL := range imageURLs {
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
