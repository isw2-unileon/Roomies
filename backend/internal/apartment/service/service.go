package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"mime"
	"path/filepath"
	"strings"
	"unicode"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/application"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/matching"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
)

type repository interface {
	CreateApartment(ctx context.Context, ownerID string, input apartment.CreateApartmentInput) (string, int, error)
	ListOwnerApartments(ctx context.Context, ownerID string) ([]apartment.Apartment, error)
	GetOwnerApartmentByID(ctx context.Context, ownerID, apartmentID string) (*apartment.Apartment, error)
	UpdateOwnerApartment(ctx context.Context, ownerID, apartmentID string, input apartment.CreateApartmentInput) (*apartment.Apartment, error)
	ListAvailableApartments(ctx context.Context, filters apartment.ListApartmentsFilters) ([]apartment.Apartment, error)
	GetApartmentByID(ctx context.Context, apartmentID string) (*apartment.Apartment, error)
}

type profileReader interface {
	GetTenantProfileByUserID(ctx context.Context, userID string) (*profile.TenantProfileInput, error)
}

type applicationReader interface {
	GetTenantApplicationForApartment(ctx context.Context, apartmentID, tenantID string) (string, string, error)
}

type imageStorage interface {
	CreateSignedURL(ctx context.Context, bucket string, path string, expiresIn int) (string, error)
	UploadObject(ctx context.Context, bucket, objectPath, contentType string, fileData []byte) error
}

// UploadFile represents a photo file to upload.
type UploadFile struct {
	Filename    string
	ContentType string
	Data        []byte
}

// UploadResult represents an uploaded photo.
type UploadResult struct {
	Path      string `json:"path"`
	SignedURL string `json:"signed_url"`
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
	imageStorage      imageStorage
}

// NewService creates the apartment service.
func NewService(repo repository, imageStorage imageStorage, profileReader profileReader, applicationReader applicationReader) *Service {
	return &Service{repo: repo, imageStorage: imageStorage, profileReader: profileReader, applicationReader: applicationReader}
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
	input.Description = strings.TrimSpace(input.Description)
	input.Address = strings.TrimSpace(input.Address)
	input.Area = strings.TrimSpace(input.Area)
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

// GetOwnerApartment returns one apartment owned by the current owner.
func (s *Service) GetOwnerApartment(ctx context.Context, ownerID, role, apartmentID string) (*apartment.Apartment, error) {
	if strings.TrimSpace(ownerID) == "" {
		return nil, errors.New("owner id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "owner" {
		return nil, ErrOwnerRequired
	}
	apartmentID = strings.TrimSpace(apartmentID)
	if apartmentID == "" {
		return nil, errors.New("apartment id is required")
	}

	item, err := s.repo.GetOwnerApartmentByID(ctx, ownerID, apartmentID)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, ErrApartmentNotFound
	}
	signed, err := s.signApartmentImages(ctx, []apartment.Apartment{*item})
	if err != nil {
		return nil, err
	}
	return &signed[0], nil
}

// UpdateOwnerApartment validates and updates an existing owner apartment listing.
func (s *Service) UpdateOwnerApartment(ctx context.Context, ownerID, role, apartmentID string, input apartment.CreateApartmentInput) (*apartment.Apartment, error) {
	if strings.TrimSpace(ownerID) == "" {
		return nil, errors.New("owner id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "owner" {
		return nil, ErrOwnerRequired
	}
	apartmentID = strings.TrimSpace(apartmentID)
	if apartmentID == "" {
		return nil, errors.New("apartment id is required")
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
	if input.BaseRent <= 0 {
		return nil, errors.New("base_rent must be greater than zero")
	}

	owned, err := s.repo.GetOwnerApartmentByID(ctx, ownerID, apartmentID)
	if err != nil {
		return nil, err
	}
	if owned == nil {
		return nil, ErrApartmentNotFound
	}
	if input.TotalSpots < owned.OccupiedSpots {
		return nil, errors.New("total_spots cannot be lower than occupied_spots")
	}

	input.Title = strings.TrimSpace(input.Title)
	input.Description = strings.TrimSpace(input.Description)
	input.Address = strings.TrimSpace(input.Address)
	input.Area = strings.TrimSpace(input.Area)
	input.Status = owned.Status

	updated, err := s.repo.UpdateOwnerApartment(ctx, ownerID, apartmentID, input)
	if err != nil {
		return nil, err
	}
	if updated == nil {
		return nil, ErrApartmentNotFound
	}
	signed, err := s.signApartmentImages(ctx, []apartment.Apartment{*updated})
	if err != nil {
		return nil, err
	}
	return &signed[0], nil
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

	tenantProfile, err := s.profileReader.GetTenantProfileByUserID(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	compatibilityScore, compatibilityReason := matching.CalculateCompatibility(*apartmentRow, tenantProfile)
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
		CompatibilityScore:       compatibilityScore,
		CompatibilityReason:      compatibilityReason,
		CurrentApplicationID:     applicationID,
		CurrentApplicationStatus: mappedStatus,
		CanApply:                 canApply,
		CanCancel:                canCancel,
	}, nil
}

func (s *Service) signApartmentImages(ctx context.Context, apartments []apartment.Apartment) ([]apartment.Apartment, error) {
	for idx := range apartments {
		if apartments[idx].ImagePaths == nil {
			apartments[idx].ImagePaths = []string{}
		}

		imageURLs := make([]string, 0, len(apartments[idx].ImagePaths))
		for _, imagePath := range apartments[idx].ImagePaths {
			trimmed := strings.TrimSpace(imagePath)
			if trimmed == "" {
				continue
			}
			if s.imageStorage == nil && !isAbsoluteHTTPURL(trimmed) {
				continue
			}

			signedURL, err := s.signedImageURL(ctx, trimmed)
			if err != nil || signedURL == "" {
				continue
			}
			imageURLs = append(imageURLs, signedURL)
		}
		apartments[idx].ImageURLs = imageURLs
	}
	return apartments, nil
}

func (s *Service) signedImageURL(ctx context.Context, imagePath string) (string, error) {
	imagePath = strings.TrimSpace(imagePath)
	if imagePath == "" {
		return "", nil
	}
	if isAbsoluteHTTPURL(imagePath) {
		return imagePath, nil
	}
	if s.imageStorage == nil {
		return "", nil
	}
	signedURL, err := s.imageStorage.CreateSignedURL(ctx, apartmentPhotosBucket, imagePath, signedImageURLTTLSeconds)
	if err != nil {
		return "", fmt.Errorf("sign apartment image: %w", err)
	}
	return signedURL, nil
}

func isAbsoluteHTTPURL(value string) bool {
	return strings.HasPrefix(value, "http://") || strings.HasPrefix(value, "https://")
}

const (
	maxPhotosPerApartment = 8
	maxPhotoSizeBytes     = 5 * 1024 * 1024
)

// UploadApartmentPhotos uploads photo files to Supabase Storage.
func (s *Service) UploadApartmentPhotos(ctx context.Context, ownerID, role, apartmentID, apartmentName string, files []UploadFile) ([]UploadResult, error) {
	if strings.TrimSpace(ownerID) == "" {
		return nil, errors.New("owner id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "owner" {
		return nil, ErrOwnerRequired
	}
	if s.imageStorage == nil {
		return nil, errors.New("image upload is not configured")
	}
	if len(files) == 0 {
		return nil, errors.New("at least one photo is required")
	}
	if len(files) > maxPhotosPerApartment {
		return nil, fmt.Errorf("too many photos, maximum %d allowed", maxPhotosPerApartment)
	}

	apartmentID = strings.TrimSpace(apartmentID)
	if apartmentID == "" {
		b := make([]byte, 16)
		_, _ = rand.Read(b)
		apartmentID = fmt.Sprintf("%x", b)
	}
	folderName := storageFolderName(apartmentName, apartmentID)

	results := make([]UploadResult, 0, len(files))
	for i, file := range files {
		if len(file.Data) > maxPhotoSizeBytes {
			return nil, fmt.Errorf("file %q exceeds maximum size of 5MB", file.Filename)
		}
		ext := filepath.Ext(strings.TrimSpace(file.Filename))
		if ext == "" {
			ext = ".jpg"
		}
		objectPath := fmt.Sprintf("%s/%d%s", folderName, i, ext)
		contentType := file.ContentType
		if contentType == "" {
			contentType = mime.TypeByExtension(ext)
			if contentType == "" {
				contentType = "application/octet-stream"
			}
		}

		if err := s.imageStorage.UploadObject(ctx, apartmentPhotosBucket, objectPath, contentType, file.Data); err != nil {
			return nil, fmt.Errorf("upload photo %q: %w", file.Filename, err)
		}

		signedURL, err := s.signedImageURL(ctx, objectPath)
		if err != nil {
			return nil, fmt.Errorf("sign uploaded photo %q: %w", file.Filename, err)
		}

		results = append(results, UploadResult{Path: objectPath, SignedURL: signedURL})
	}
	return results, nil
}

func storageFolderName(apartmentName, apartmentID string) string {
	name := strings.Trim(strings.Map(func(r rune) rune {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			return r
		}
		if unicode.IsSpace(r) || r == '-' || r == '_' {
			return '-'
		}
		return -1
	}, strings.TrimSpace(apartmentName)), "-")
	if name == "" {
		name = "apartment"
	}
	if len(name) > 50 {
		name = strings.TrimRight(name[:50], "-")
	}
	return name + "-" + apartmentID
}
