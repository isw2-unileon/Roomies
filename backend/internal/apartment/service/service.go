package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/application"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/matching"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
)

type repository interface {
	CreateApartment(ctx context.Context, ownerID string, input apartment.CreateApartmentInput) (string, int, error)
	ListOwnerApartments(ctx context.Context, ownerID string) ([]apartment.Apartment, error)
	ListAvailableApartments(ctx context.Context, filters apartment.ListApartmentsFilters) ([]apartment.Apartment, error)
	GetApartmentByID(ctx context.Context, apartmentID string) (*apartment.Apartment, error)
	GetApartmentRules(ctx context.Context, apartmentID string) (*apartment.Rules, error)
}

type profileReader interface {
	GetTenantProfileByUserID(ctx context.Context, userID string) (*profile.TenantProfile, error)
}

type applicationReader interface {
	GetTenantApplicationForApartment(ctx context.Context, apartmentID, tenantID string) (string, string, error)
}

type imageURLSigner interface {
	CreateSignedURL(ctx context.Context, bucket string, path string, expiresIn int) (string, error)
}

const (
	apartmentPhotosBucket    = "Apartment_photos"
	signedImageURLTTLSeconds = 3600
)

// ErrOwnerRequired is returned when a non-owner tries to publish an apartment.
var ErrOwnerRequired = errors.New("owner role is required")

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

// Service contains apartment use cases.
type Service struct {
	repo              repository
	profileReader     profileReader
	applicationReader applicationReader
	imageSigner       imageURLSigner
}

// NewService creates the apartment service.
func NewService(repo repository, imageSigner imageURLSigner, profileReader profileReader, applicationReader applicationReader) *Service {
	return &Service{repo: repo, imageSigner: imageSigner, profileReader: profileReader, applicationReader: applicationReader}
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
func (s *Service) ListOwnerApartments(ctx context.Context, ownerID, role string) ([]apartment.Apartment, error) {
	if strings.TrimSpace(ownerID) == "" {
		return nil, errors.New("owner id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "owner" {
		return nil, ErrOwnerRequired
	}
	apartments, err := s.repo.ListOwnerApartments(ctx, ownerID)
	if err != nil {
		return nil, err
	}
	return s.signApartmentImages(ctx, apartments)
}

// ListAvailableApartments returns tenant-visible apartment listings.
func (s *Service) ListAvailableApartments(ctx context.Context) ([]apartment.Apartment, error) {
	return s.ListAvailableApartmentsFiltered(ctx, apartment.ListApartmentsFilters{})
}

// ListAvailableApartmentsFiltered returns tenant-visible apartment listings with filters.
func (s *Service) ListAvailableApartmentsFiltered(ctx context.Context, filters apartment.ListApartmentsFilters) ([]apartment.Apartment, error) {
	normalized := normalizeListApartmentsFilters(filters)
	apartments, err := s.repo.ListAvailableApartments(ctx, normalized)
	if err != nil {
		return nil, err
	}
	return s.signApartmentImages(ctx, apartments)
}

func normalizeListApartmentsFilters(filters apartment.ListApartmentsFilters) apartment.ListApartmentsFilters {
	filters.Query = strings.TrimSpace(filters.Query)
	filters.Area = strings.TrimSpace(filters.Area)
	filters.Availability = strings.ToLower(strings.TrimSpace(filters.Availability))
	filters.SortBy = strings.ToLower(strings.TrimSpace(filters.SortBy))

	if filters.PriceMin < 0 {
		filters.PriceMin = 0
	}
	if filters.PriceMax <= 0 {
		filters.PriceMax = 100000
	}
	if filters.PriceMin > filters.PriceMax {
		filters.PriceMin, filters.PriceMax = filters.PriceMax, filters.PriceMin
	}

	if filters.TotalRoomsMin < 0 {
		filters.TotalRoomsMin = 0
	}
	if filters.TotalRoomsMax <= 0 {
		filters.TotalRoomsMax = 100000
	}
	if filters.TotalRoomsMin > filters.TotalRoomsMax {
		filters.TotalRoomsMin, filters.TotalRoomsMax = filters.TotalRoomsMax, filters.TotalRoomsMin
	}

	if filters.AvailableRoomsMin < 0 {
		filters.AvailableRoomsMin = 0
	}
	if filters.AvailableRoomsMax <= 0 {
		filters.AvailableRoomsMax = 100000
	}
	if filters.AvailableRoomsMin > filters.AvailableRoomsMax {
		filters.AvailableRoomsMin, filters.AvailableRoomsMax = filters.AvailableRoomsMax, filters.AvailableRoomsMin
	}

	if filters.Availability != "available" && filters.Availability != "soon" && filters.Availability != "all" {
		filters.Availability = "all"
	}

	switch filters.SortBy {
	case "price_low", "price_high", "rooms", "newest", "relevance":
	default:
		filters.SortBy = "relevance"
	}

	return filters
}

// GetApartmentDetailForTenant returns apartment detail and compatibility data for a tenant.
func (s *Service) GetApartmentDetailForTenant(ctx context.Context, apartmentID, tenantID, role string) (*apartment.Detail, error) {
	if strings.TrimSpace(apartmentID) == "" {
		return nil, errors.New("apartment id is required")
	}
	if strings.TrimSpace(tenantID) == "" {
		return nil, errors.New("tenant id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return nil, ErrTenantRequired
	}

	apartmentRow, err := s.repo.GetApartmentByID(ctx, apartmentID)
	if err != nil {
		return nil, err
	}
	if apartmentRow == nil {
		return nil, ErrApartmentNotFound
	}

	rules, err := s.repo.GetApartmentRules(ctx, apartmentID)
	if err != nil {
		return nil, err
	}

	tenantProfile, err := s.profileReader.GetTenantProfileByUserID(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	compatibilityScore, compatibilityReason := matching.CalculateCompatibility(*apartmentRow, rules, tenantProfile)
	apartmentsWithImage, err := s.signApartmentImages(ctx, []apartment.Apartment{*apartmentRow})
	if err != nil {
		return nil, err
	}

	applicationID, applicationStatus, err := s.applicationReader.GetTenantApplicationForApartment(ctx, apartmentID, tenantID)
	if err != nil {
		return nil, err
	}
	mappedStatus := application.MapStatus(applicationStatus)
	canApply := strings.TrimSpace(applicationID) == "" || mappedStatus == "cancelled" || mappedStatus == "rejected"
	canCancel := mappedStatus == "pending"

	return &apartment.Detail{
		Apartment:                apartmentsWithImage[0],
		Rules:                    derefRules(rules),
		CompatibilityScore:       compatibilityScore,
		CompatibilityReason:      compatibilityReason,
		CurrentApplicationID:     applicationID,
		CurrentApplicationStatus: mappedStatus,
		CanApply:                 canApply,
		CanCancel:                canCancel,
	}, nil
}

func (s *Service) signApartmentImages(ctx context.Context, apartments []apartment.Apartment) ([]apartment.Apartment, error) {
	if s.imageSigner == nil {
		return apartments, nil
	}
	for idx := range apartments {
		signedURL, err := s.signedImageURL(ctx, apartments[idx].ImageURL)
		if err != nil {
			apartments[idx].ImageURL = ""
			continue
		}
		apartments[idx].ImageURL = signedURL
	}
	return apartments, nil
}

func (s *Service) signedImageURL(ctx context.Context, imagePath string) (string, error) {
	imagePath = strings.TrimSpace(imagePath)
	if imagePath == "" {
		return "", nil
	}
	signedURL, err := s.imageSigner.CreateSignedURL(ctx, apartmentPhotosBucket, imagePath, signedImageURLTTLSeconds)
	if err != nil {
		return "", fmt.Errorf("sign apartment image: %w", err)
	}
	return signedURL, nil
}

func derefRules(rules *apartment.Rules) apartment.Rules {
	if rules == nil {
		return apartment.Rules{}
	}
	return *rules
}
