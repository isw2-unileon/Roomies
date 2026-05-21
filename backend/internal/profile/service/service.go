package service

import (
	"context"
	"errors"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
)

type repository interface {
	LookupRoleByUserID(ctx context.Context, userID string) (string, error)
	NeedsTenantProfile(ctx context.Context, userID, role string) (bool, error)
	UpsertTenantProfile(ctx context.Context, userID string, input profile.TenantProfileInput) error
}

// ErrTenantRequired is returned when a non-tenant tries to save a tenant profile.
var ErrTenantRequired = errors.New("tenant role is required")

// Service contains profile use cases.
type Service struct {
	repo repository
}

// NewService creates the profile service.
func NewService(repo repository) *Service {
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
func (s *Service) SaveTenantProfile(ctx context.Context, userID, role string, input profile.TenantProfileInput) error {
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return ErrTenantRequired
	}
	return s.repo.UpsertTenantProfile(ctx, userID, input)
}
