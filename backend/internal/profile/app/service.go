package app

import (
	"context"

	profileport "github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile/port"
)

// Service implements profile use cases.
type Service struct {
	repo profileport.Repository
}

// NewService creates the profile application service.
func NewService(repo profileport.Repository) *Service {
	return &Service{repo: repo}
}

// LookupRoleByUserID resolves role from app profile store.
func (s *Service) LookupRoleByUserID(ctx context.Context, userID string) (string, error) {
	return s.repo.LookupRoleByUserID(ctx, userID)
}

// NeedsTenantProfile checks if tenant onboarding is pending.
func (s *Service) NeedsTenantProfile(ctx context.Context, userID, role string) (bool, error) {
	return s.repo.NeedsTenantProfile(ctx, userID, role)
}

// SaveTenantProfile upserts tenant profile.
func (s *Service) SaveTenantProfile(ctx context.Context, userID string, input profileport.TenantProfileInput) error {
	return s.repo.UpsertTenantProfile(ctx, userID, input)
}
