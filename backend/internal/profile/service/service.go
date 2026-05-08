package service

import (
	"context"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile/postgres"
)

// Service contains profile use cases.
type Service struct {
	repo *postgres.Repository
}

// NewService creates the profile service.
func NewService(repo *postgres.Repository) *Service {
	return &Service{repo: repo}
}

// LookupRoleByUserID resolves the app role for a user.
func (s *Service) LookupRoleByUserID(ctx context.Context, userID string) (string, error) {
	return s.repo.LookupRoleByUserID(ctx, userID)
}

// NeedsTenantProfile checks if tenant onboarding is pending.
func (s *Service) NeedsTenantProfile(ctx context.Context, userID, role string) (bool, error) {
	return s.repo.NeedsTenantProfile(ctx, userID, role)
}

// SaveTenantProfile upserts tenant onboarding/profile data.
func (s *Service) SaveTenantProfile(ctx context.Context, userID string, input profile.TenantProfileInput) error {
	return s.repo.UpsertTenantProfile(ctx, userID, input)
}
