package service

import (
	"context"
	"errors"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/application"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/matching"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
)

type repository interface {
	HasActiveApplication(ctx context.Context, apartmentID, tenantID string) (bool, error)
	GetTenantApplicationForApartment(ctx context.Context, apartmentID, tenantID string) (string, string, error)
	CreateTenantApplication(ctx context.Context, apartmentID, tenantID string, compatibilityScore int) (string, error)
	CancelTenantApplication(ctx context.Context, applicationID, tenantID string) (bool, error)
	ListInterestedTenants(ctx context.Context, apartmentID string) ([]application.InterestedTenantCandidate, error)
	ListTenantApplications(ctx context.Context, tenantID string) ([]application.TenantApplication, error)
}

type apartmentReader interface {
	GetApartmentByID(ctx context.Context, apartmentID string) (*apartment.Apartment, error)
	GetApartmentRules(ctx context.Context, apartmentID string) (*apartment.Rules, error)
}

type profileReader interface {
	GetTenantProfileByUserID(ctx context.Context, userID string) (*profile.TenantProfile, error)
}

// ErrTenantRequired is returned when a non-tenant requests tenant-only operations.
var ErrTenantRequired = errors.New("tenant role is required")

// ErrApartmentNotFound is returned when an apartment does not exist.
var ErrApartmentNotFound = errors.New("apartment not found")

// ErrApartmentFull is returned when apartment has no free spots.
var ErrApartmentFull = errors.New("apartment is full")

// ErrApplicationAlreadyExists is returned when tenant already has active application for apartment.
var ErrApplicationAlreadyExists = errors.New("active application already exists")

// ErrApplicationNotCancelable is returned when application cannot be cancelled.
var ErrApplicationNotCancelable = errors.New("application is not cancelable")

// Service contains application use cases.
type Service struct {
	repo            repository
	apartmentReader apartmentReader
	profileReader   profileReader
}

// NewService creates the application service.
func NewService(repo repository, apartmentReader apartmentReader, profileReader profileReader) *Service {
	return &Service{repo: repo, apartmentReader: apartmentReader, profileReader: profileReader}
}

// GetTenantApplicationForApartment returns the most recent tenant application for an apartment.
func (s *Service) GetTenantApplicationForApartment(ctx context.Context, apartmentID, tenantID string) (string, string, error) {
	return s.repo.GetTenantApplicationForApartment(ctx, apartmentID, tenantID)
}

// ApplyToApartment creates an individual application for a tenant.
func (s *Service) ApplyToApartment(ctx context.Context, apartmentID, tenantID, role string) (string, error) {
	if strings.TrimSpace(apartmentID) == "" {
		return "", errors.New("apartment id is required")
	}
	if strings.TrimSpace(tenantID) == "" {
		return "", errors.New("tenant id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return "", ErrTenantRequired
	}

	apartmentRow, err := s.apartmentReader.GetApartmentByID(ctx, apartmentID)
	if err != nil {
		return "", err
	}
	if apartmentRow == nil {
		return "", ErrApartmentNotFound
	}
	if apartmentRow.TotalSpots-apartmentRow.OccupiedSpots <= 0 {
		return "", ErrApartmentFull
	}

	hasActive, err := s.repo.HasActiveApplication(ctx, apartmentID, tenantID)
	if err != nil {
		return "", err
	}
	if hasActive {
		return "", ErrApplicationAlreadyExists
	}

	rules, err := s.apartmentReader.GetApartmentRules(ctx, apartmentID)
	if err != nil {
		return "", err
	}
	tenantProfile, err := s.profileReader.GetTenantProfileByUserID(ctx, tenantID)
	if err != nil {
		return "", err
	}
	compatibilityScore, _ := matching.CalculateCompatibility(*apartmentRow, rules, tenantProfile)

	return s.repo.CreateTenantApplication(ctx, apartmentID, tenantID, compatibilityScore)
}

// CancelTenantApplication cancels a pending tenant application.
func (s *Service) CancelTenantApplication(ctx context.Context, applicationID, tenantID, role string) error {
	if strings.TrimSpace(applicationID) == "" {
		return errors.New("application id is required")
	}
	if strings.TrimSpace(tenantID) == "" {
		return errors.New("tenant id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return ErrTenantRequired
	}
	updated, err := s.repo.CancelTenantApplication(ctx, applicationID, tenantID)
	if err != nil {
		return err
	}
	if !updated {
		return ErrApplicationNotCancelable
	}
	return nil
}

// ListInterestedTenants returns currently interested tenants for an apartment.
func (s *Service) ListInterestedTenants(ctx context.Context, apartmentID string) ([]application.InterestedTenant, error) {
	if strings.TrimSpace(apartmentID) == "" {
		return nil, errors.New("apartment id is required")
	}
	apartmentRow, err := s.apartmentReader.GetApartmentByID(ctx, apartmentID)
	if err != nil {
		return nil, err
	}
	if apartmentRow == nil {
		return nil, ErrApartmentNotFound
	}
	rules, err := s.apartmentReader.GetApartmentRules(ctx, apartmentID)
	if err != nil {
		return nil, err
	}
	candidates, err := s.repo.ListInterestedTenants(ctx, apartmentID)
	if err != nil {
		return nil, err
	}
	result := make([]application.InterestedTenant, 0, len(candidates))
	for _, candidate := range candidates {
		tenantProfile := &profile.TenantProfile{
			UserID:        candidate.UserID,
			BudgetMin:     candidate.BudgetMin,
			BudgetMax:     candidate.BudgetMax,
			PreferredArea: candidate.PreferredArea,
			Pets:          candidate.Pets,
			Smoking:       candidate.Smoking,
			NoiseLevel:    candidate.NoiseLevel,
			Cleanliness:   candidate.Cleanliness,
			WorkSchedule:  candidate.WorkSchedule,
			Age:           candidate.Age,
			University:    candidate.Studies,
		}
		score, _ := matching.CalculateCompatibility(*apartmentRow, rules, tenantProfile)
		result = append(result, application.InterestedTenant{
			UserID:        candidate.UserID,
			Name:          candidate.Name,
			Age:           candidate.Age,
			Studies:       candidate.Studies,
			AvatarURL:     candidate.AvatarURL,
			Compatibility: score,
		})
	}
	return result, nil
}

// ListTenantApplications returns tenant applications with status and compatibility.
func (s *Service) ListTenantApplications(ctx context.Context, tenantID, role string) ([]application.TenantApplication, error) {
	if strings.TrimSpace(tenantID) == "" {
		return nil, errors.New("tenant id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return nil, ErrTenantRequired
	}
	applications, err := s.repo.ListTenantApplications(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	tenantProfile, err := s.profileReader.GetTenantProfileByUserID(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	for idx := range applications {
		if applications[idx].CompatibilityScore <= 0 {
			apartmentRow, apartmentErr := s.apartmentReader.GetApartmentByID(ctx, applications[idx].ApartmentID)
			if apartmentErr == nil && apartmentRow != nil {
				rules, rulesErr := s.apartmentReader.GetApartmentRules(ctx, applications[idx].ApartmentID)
				if rulesErr == nil {
					score, _ := matching.CalculateCompatibility(*apartmentRow, rules, tenantProfile)
					applications[idx].CompatibilityScore = score
				}
			}
		}
		applications[idx].Status = application.MapStatus(applications[idx].Status)
		applications[idx].DateLabel = application.BuildDateLabel(applications[idx].Status, applications[idx].CreatedAt)
		applications[idx].RequestType = "Solicitud individual"
		applications[idx].StatusMessage = application.BuildStatusMessage(applications[idx].Status)
	}
	return applications, nil
}
