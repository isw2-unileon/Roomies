package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"

	profileport "github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile/port"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository implements profile persistence over PostgreSQL.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new postgres profile repository.
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

// UpsertTenantProfile updates or inserts tenant profile.
func (r *Repository) UpsertTenantProfile(ctx context.Context, userID string, input profileport.TenantProfileInput) error {
	result, err := r.db.Exec(
		ctx,
		`UPDATE public.tenant_profiles SET
			budget_min = $2,
			budget_max = $3,
			preferred_area = $4,
			move_in_date = $5,
			pets = $6,
			smoking = $7,
			noise_level = $8,
			cleanliness = $9,
			work_schedule = $10,
			sleep_schedule = $11,
			social_lifestyle = $12,
			study_habits = $13,
			language = $14,
			university = $15,
			age = $16,
			guest_preferences = $17,
			party_frequency = $18,
			updated_at = NOW()
		WHERE user_id = $1`,
		userID,
		input.BudgetMin,
		input.BudgetMax,
		strings.TrimSpace(input.PreferredArea),
		input.MoveInDate,
		input.Pets,
		input.Smoking,
		input.NoiseLevel,
		input.Cleanliness,
		input.WorkSchedule,
		input.SleepSchedule,
		input.SocialLifestyle,
		input.StudyHabits,
		input.Language,
		input.University,
		input.Age,
		input.GuestPreferences,
		input.PartyFrequency,
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
			(user_id, budget_min, budget_max, preferred_area, move_in_date, pets, smoking, noise_level, cleanliness, work_schedule, sleep_schedule, social_lifestyle, study_habits, language, university, age, guest_preferences, party_frequency, updated_at)
		VALUES
			($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())`,
		userID,
		input.BudgetMin,
		input.BudgetMax,
		strings.TrimSpace(input.PreferredArea),
		input.MoveInDate,
		input.Pets,
		input.Smoking,
		input.NoiseLevel,
		input.Cleanliness,
		input.WorkSchedule,
		input.SleepSchedule,
		input.SocialLifestyle,
		input.StudyHabits,
		input.Language,
		input.University,
		input.Age,
		input.GuestPreferences,
		input.PartyFrequency,
	)
	return err
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
