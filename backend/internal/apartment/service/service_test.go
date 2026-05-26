package service

import (
	"context"
	"errors"
	"testing"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
)

type fakeApartmentRepository struct {
	createdDescription string
	createdStatus      string

	applicationForApartmentID     string
	applicationForApartmentStatus string

	ownerApartments  []apartment.Apartment
	tenantApartments []apartment.Apartment
	apartmentByID    *apartment.Apartment
	apartmentRules   *apartment.Rules
	tenantProfile    *profile.TenantProfile
}

func (f *fakeApartmentRepository) CreateApartment(ctx context.Context, ownerID string, input apartment.CreateApartmentInput) (string, int, error) {
	f.createdDescription = input.Description
	f.createdStatus = input.Status
	return "apartment-1", len(input.ImageURLs), nil
}

func (f *fakeApartmentRepository) ListOwnerApartments(ctx context.Context, ownerID string) ([]apartment.Apartment, error) {
	if f.ownerApartments != nil {
		return f.ownerApartments, nil
	}
	return []apartment.Apartment{{ID: "apartment-1", Title: "Flat"}}, nil
}

func (f *fakeApartmentRepository) ListAvailableApartments(ctx context.Context, filters apartment.ListApartmentsFilters) ([]apartment.Apartment, error) {
	if f.tenantApartments != nil {
		return f.tenantApartments, nil
	}
	return []apartment.Apartment{{ID: "apartment-1", Title: "Flat", TotalSpots: 3, OccupiedSpots: 1}}, nil
}

func (f *fakeApartmentRepository) GetApartmentByID(ctx context.Context, apartmentID string) (*apartment.Apartment, error) {
	if f.apartmentByID != nil {
		return f.apartmentByID, nil
	}
	return &apartment.Apartment{ID: apartmentID, BaseRent: 400, Area: "centro", TotalSpots: 3, OccupiedSpots: 1}, nil
}

func (f *fakeApartmentRepository) GetApartmentRules(ctx context.Context, apartmentID string) (*apartment.Rules, error) {
	if f.apartmentRules != nil {
		return f.apartmentRules, nil
	}
	allowed := false
	return &apartment.Rules{
		SmokingAllowed:         &allowed,
		PetsAllowed:            &allowed,
		MaxNoiseLevel:          "moderate",
		CleanlinessExpectation: "normal",
		PreferredSchedule:      "flexible",
	}, nil
}

func (f *fakeApartmentRepository) GetTenantProfileByUserID(ctx context.Context, userID string) (*profile.TenantProfile, error) {
	if f.tenantProfile != nil {
		return f.tenantProfile, nil
	}
	return &profile.TenantProfile{
		UserID:        userID,
		BudgetMin:     300,
		BudgetMax:     450,
		PreferredArea: "centro",
		Pets:          false,
		Smoking:       false,
		NoiseLevel:    "moderate",
		Cleanliness:   "normal",
		WorkSchedule:  "flexible",
	}, nil
}

func (f *fakeApartmentRepository) GetTenantApplicationForApartment(ctx context.Context, apartmentID, tenantID string) (string, string, error) {
	return f.applicationForApartmentID, f.applicationForApartmentStatus, nil
}

type fakeImageSigner struct {
	bucket    string
	path      string
	expiresIn int
}

func (f *fakeImageSigner) CreateSignedURL(ctx context.Context, bucket string, path string, expiresIn int) (string, error) {
	f.bucket = bucket
	f.path = path
	f.expiresIn = expiresIn
	return "https://signed.example.test/" + path, nil
}

func TestCreateApartmentAcceptsRepositoryInterfaceAndPreparesPersistenceData(t *testing.T) {
	repo := &fakeApartmentRepository{}
	svc := NewService(repo, nil, repo, repo)

	result, err := svc.CreateApartment(context.Background(), "owner-1", "owner", apartment.CreateApartmentInput{
		Title:         " Flat ",
		Description:   " Nice place ",
		Address:       " Main Street ",
		Area:          " Center ",
		TotalSpots:    2,
		Bathrooms:     1,
		BaseRent:      400,
		AvailableFrom: "2026-06-01",
		ImageURLs:     []string{"https://example.test/flat.jpg"},
	})
	if err != nil {
		t.Fatalf("CreateApartment returned error: %v", err)
	}
	if result.ApartmentID != "apartment-1" {
		t.Fatalf("ApartmentID = %q, want apartment-1", result.ApartmentID)
	}
	if repo.createdStatus != apartment.StatusAvailable {
		t.Fatalf("createdStatus = %q, want %q", repo.createdStatus, apartment.StatusAvailable)
	}
	wantDescription := "Nice place\n\nBanos: 1\n\nDisponible desde: 2026-06-01"
	if repo.createdDescription != wantDescription {
		t.Fatalf("createdDescription = %q, want %q", repo.createdDescription, wantDescription)
	}
}

func TestCreateApartmentRejectsNonOwnerRole(t *testing.T) {
	repo := &fakeApartmentRepository{}
	svc := NewService(repo, nil, repo, repo)

	_, err := svc.CreateApartment(context.Background(), "tenant-1", "tenant", apartment.CreateApartmentInput{})
	if !errors.Is(err, ErrOwnerRequired) {
		t.Fatalf("err = %v, want %v", err, ErrOwnerRequired)
	}
}

func TestListAvailableApartmentsReturnsTenantVisibleListings(t *testing.T) {
	repo := &fakeApartmentRepository{}
	svc := NewService(repo, nil, repo, repo)

	apartments, err := svc.ListAvailableApartments(context.Background())
	if err != nil {
		t.Fatalf("ListAvailableApartments returned error: %v", err)
	}
	if len(apartments) != 1 {
		t.Fatalf("len(apartments) = %d, want 1", len(apartments))
	}
	if apartments[0].OccupiedSpots != 1 {
		t.Fatalf("OccupiedSpots = %d, want 1", apartments[0].OccupiedSpots)
	}
}

func TestListOwnerApartmentsSignsImagePaths(t *testing.T) {
	repo := &fakeApartmentRepository{
		ownerApartments: []apartment.Apartment{{
			ID:       "apartment-1",
			Title:    "Flat",
			ImageURL: "apartments/apartment-1/photo.jpg",
		}},
	}
	signer := &fakeImageSigner{}
	svc := NewService(repo, signer, repo, repo)

	apartments, err := svc.ListOwnerApartments(context.Background(), "owner-1", "owner")
	if err != nil {
		t.Fatalf("ListOwnerApartments returned error: %v", err)
	}

	if apartments[0].ImageURL != "https://signed.example.test/apartments/apartment-1/photo.jpg" {
		t.Fatalf("ImageURL = %q, want signed URL", apartments[0].ImageURL)
	}
	if signer.bucket != "Apartment_photos" {
		t.Fatalf("bucket = %q, want Apartment_photos", signer.bucket)
	}
	if signer.path != "apartments/apartment-1/photo.jpg" {
		t.Fatalf("path = %q, want apartments/apartment-1/photo.jpg", signer.path)
	}
	if signer.expiresIn != 3600 {
		t.Fatalf("expiresIn = %d, want 3600", signer.expiresIn)
	}
}

func TestListAvailableApartmentsSignsTenantImagePaths(t *testing.T) {
	repo := &fakeApartmentRepository{
		tenantApartments: []apartment.Apartment{{
			ID:            "apartment-1",
			Title:         "Flat",
			TotalSpots:    3,
			OccupiedSpots: 1,
			ImageURL:      "mock_1.avif",
		}},
	}
	signer := &fakeImageSigner{}
	svc := NewService(repo, signer, repo, repo)

	apartments, err := svc.ListAvailableApartments(context.Background())
	if err != nil {
		t.Fatalf("ListAvailableApartments returned error: %v", err)
	}

	if apartments[0].ImageURL != "https://signed.example.test/mock_1.avif" {
		t.Fatalf("ImageURL = %q, want signed URL", apartments[0].ImageURL)
	}
}

func TestGetApartmentDetailForTenantReturnsCompatibility(t *testing.T) {
	repo := &fakeApartmentRepository{applicationForApartmentID: "application-1", applicationForApartmentStatus: "PENDING_OWNER"}
	svc := NewService(repo, nil, repo, repo)

	detail, err := svc.GetApartmentDetailForTenant(context.Background(), "apartment-1", "tenant-1", "tenant")
	if err != nil {
		t.Fatalf("GetApartmentDetailForTenant returned error: %v", err)
	}
	if detail.CompatibilityScore <= 0 {
		t.Fatalf("CompatibilityScore = %d, want > 0", detail.CompatibilityScore)
	}
	if !detail.CanCancel {
		t.Fatalf("CanCancel = %t, want true", detail.CanCancel)
	}
	if detail.CanApply {
		t.Fatalf("CanApply = %t, want false", detail.CanApply)
	}
}
