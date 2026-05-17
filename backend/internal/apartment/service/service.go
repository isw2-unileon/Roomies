package service

import (
	"context"
	"errors"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	apartmentpostgres "github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment/postgres"
)

// Service contains apartment use cases.
type Service struct {
	repo *apartmentpostgres.Repository
}

// NewService creates the apartment service.
func NewService(repo *apartmentpostgres.Repository) *Service {
	return &Service{repo: repo}
}

// CreateApartment validates and stores a new owner apartment listing.
func (s *Service) CreateApartment(ctx context.Context, ownerID string, input apartment.CreateApartmentInput) (*apartment.CreateApartmentResult, error) {
	if strings.TrimSpace(ownerID) == "" {
		return nil, errors.New("owner id is required")
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

	apartmentID, imagesStored, err := s.repo.CreateApartment(
		ctx,
		ownerID,
		input.Title,
		input.Description,
		input.Address,
		input.Area,
		input.AvailableFrom,
		input.TotalSpots,
		input.Bathrooms,
		input.BaseRent,
		input.ImageURLs,
	)
	if err != nil {
		return nil, err
	}

	return &apartment.CreateApartmentResult{
		ApartmentID:  apartmentID,
		ImagesStored: imagesStored,
	}, nil
}
