package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
)

type repository interface {
	CreateApartment(ctx context.Context, ownerID string, input apartment.CreateApartmentInput) (string, int, error)
	ListOwnerApartments(ctx context.Context, ownerID string) ([]apartment.OwnerApartment, error)
}

// ErrOwnerRequired is returned when a non-owner tries to publish an apartment.
var ErrOwnerRequired = errors.New("owner role is required")

// Service contains apartment use cases.
type Service struct {
	repo repository
}

// NewService creates the apartment service.
func NewService(repo repository) *Service {
	return &Service{repo: repo}
}

// CreateApartment validates and stores a new owner apartment listing.
func (s *Service) CreateApartment(ctx context.Context, ownerID, role string, input apartment.CreateApartmentInput) (*apartment.CreateApartmentResult, error) {
	if strings.TrimSpace(ownerID) == "" {
		return nil, errors.New("owner id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "owner" {
		return nil, ErrOwnerRequired
	}
	if strings.TrimSpace(input.Title) == "" {
		return nil, errors.New("title is required")
	}
	if strings.TrimSpace(input.Address) == "" {
		return nil, errors.New("address is required")
	}
	if input.TotalSpots <= 0 {
		return nil, errors.New("total_spots must be greater than zero")
	}
	if input.Bathrooms <= 0 {
		return nil, errors.New("bathrooms must be greater than zero")
	}
	if input.BaseRent <= 0 {
		return nil, errors.New("base_rent must be greater than zero")
	}

	input.Title = strings.TrimSpace(input.Title)
	input.Description = buildDescription(input.Description, input.Bathrooms, input.AvailableFrom)
	input.Address = strings.TrimSpace(input.Address)
	input.Area = strings.TrimSpace(input.Area)
	input.AvailableFrom = strings.TrimSpace(input.AvailableFrom)
	input.Status = apartment.StatusAvailable

	apartmentID, imagesStored, err := s.repo.CreateApartment(ctx, ownerID, input)
	if err != nil {
		return nil, err
	}

	return &apartment.CreateApartmentResult{
		ApartmentID:  apartmentID,
		ImagesStored: imagesStored,
	}, nil
}

func buildDescription(description string, bathrooms int, availableFrom string) string {
	descriptionParts := make([]string, 0, 3)
	if strings.TrimSpace(description) != "" {
		descriptionParts = append(descriptionParts, strings.TrimSpace(description))
	}
	descriptionParts = append(descriptionParts, fmt.Sprintf("Banos: %d", bathrooms))
	if strings.TrimSpace(availableFrom) != "" {
		descriptionParts = append(descriptionParts, fmt.Sprintf("Disponible desde: %s", strings.TrimSpace(availableFrom)))
	}
	return strings.Join(descriptionParts, "\n\n")
}

// ListOwnerApartments returns published apartments for an owner.
func (s *Service) ListOwnerApartments(ctx context.Context, ownerID, role string) ([]apartment.OwnerApartment, error) {
	if strings.TrimSpace(ownerID) == "" {
		return nil, errors.New("owner id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "owner" {
		return nil, ErrOwnerRequired
	}
	return s.repo.ListOwnerApartments(ctx, ownerID)
}
