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
	updatedDescription string
	updatedTotalSpots  int

	applicationForApartmentID     string
	applicationForApartmentStatus string

	ownerApartments  []apartment.Apartment
	ownerApartment   *apartment.Apartment
	tenantApartments []apartment.Apartment
	apartmentByID    *apartment.Apartment
	tenantProfile    *profile.TenantProfileInput
}

func (f *fakeApartmentRepository) CreateApartment(ctx context.Context, ownerID string, input apartment.CreateApartmentInput) (string, int, error) {
	f.createdDescription = input.Description
	f.createdStatus = input.Status
	return "apartment-1", len(input.ImagePaths), nil
}

func (f *fakeApartmentRepository) ListOwnerApartments(ctx context.Context, ownerID string) ([]apartment.Apartment, error) {
	if f.ownerApartments != nil {
		return f.ownerApartments, nil
	}
	return []apartment.Apartment{{ID: "apartment-1", Title: "Flat"}}, nil
}

func (f *fakeApartmentRepository) GetOwnerApartmentByID(ctx context.Context, ownerID, apartmentID string) (*apartment.Apartment, error) {
	return f.ownerApartment, nil
}

func (f *fakeApartmentRepository) UpdateOwnerApartment(ctx context.Context, ownerID, apartmentID string, input apartment.CreateApartmentInput) (*apartment.Apartment, error) {
	f.updatedDescription = input.Description
	f.updatedTotalSpots = input.TotalSpots
	return &apartment.Apartment{ID: apartmentID, Title: input.Title, Description: input.Description, TotalSpots: input.TotalSpots}, nil
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
	notAllowed := false
	return &apartment.Apartment{
		ID: apartmentID, BaseRent: 400, Area: "centro", TotalSpots: 3, OccupiedSpots: 1,
		SmokingAllowed: &notAllowed, PetsAllowed: &notAllowed,
	}, nil
}

func (f *fakeApartmentRepository) GetTenantProfileByUserID(ctx context.Context, userID string) (*profile.TenantProfileInput, error) {
	if f.tenantProfile != nil {
		return f.tenantProfile, nil
	}
	return &profile.TenantProfileInput{
		UserID:        userID,
		BudgetMax:     450,
		PreferredArea: "centro",
		Pets:          false,
		Smoking:       false,
		Situation:     "student",
		Socialization: "medium",
		Nightlife:     "low",
	}, nil
}

func (f *fakeApartmentRepository) GetTenantApplicationForApartment(ctx context.Context, apartmentID, tenantID string) (string, string, error) {
	return f.applicationForApartmentID, f.applicationForApartmentStatus, nil
}

type fakeImageStorage struct {
	bucket    string
	path      string
	expiresIn int
}

func (f *fakeImageStorage) CreateSignedURL(ctx context.Context, bucket string, path string, expiresIn int) (string, error) {
	f.bucket = bucket
	f.path = path
	f.expiresIn = expiresIn
	return "https://signed.example.test/" + path, nil
}

func (f *fakeImageStorage) UploadObject(ctx context.Context, bucket, objectPath, contentType string, fileData []byte) error {
	return nil
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

		ImagePaths:    []string{"https://example.test/flat.jpg"},
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
	if repo.createdDescription != "Nice place" {
		t.Fatalf("createdDescription = %q, want %q", repo.createdDescription, "Nice place")
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
			ID:         "apartment-1",
			Title:      "Flat",
			ImagePaths: []string{"apartments/apartment-1/photo.jpg"},
		}},
	}
	signer := &fakeImageStorage{}
	svc := NewService(repo, signer, repo, repo)

	apartments, err := svc.ListOwnerApartments(context.Background(), "owner-1", "owner")
	if err != nil {
		t.Fatalf("ListOwnerApartments returned error: %v", err)
	}

	if len(apartments[0].ImagePaths) == 0 || apartments[0].ImagePaths[0] != "apartments/apartment-1/photo.jpg" {
		t.Fatalf("ImagePaths = %#v, want raw path list", apartments[0].ImagePaths)
	}
	if len(apartments[0].ImageURLs) == 0 || apartments[0].ImageURLs[0] != "https://signed.example.test/apartments/apartment-1/photo.jpg" {
		t.Fatalf("ImageURLs = %#v, want signed URL list", apartments[0].ImageURLs)
	}
}

func TestGetOwnerApartmentReturnsOwnedApartmentWithSignedImages(t *testing.T) {
	repo := &fakeApartmentRepository{
		ownerApartment: &apartment.Apartment{
			ID:         "apartment-1",
			Title:      "Flat",
			ImagePaths: []string{"apartments/apartment-1/front.jpg", "apartments/apartment-1/room.jpg"},
		},
	}
	signer := &fakeImageStorage{}
	svc := NewService(repo, signer, repo, repo)

	result, err := svc.GetOwnerApartment(context.Background(), "owner-1", "owner", "apartment-1")
	if err != nil {
		t.Fatalf("GetOwnerApartment returned error: %v", err)
	}

	if result == nil || result.ID != "apartment-1" {
		t.Fatalf("result ID = %#v, want apartment-1", result)
	}
	if len(result.ImagePaths) != 2 || result.ImagePaths[0] != "apartments/apartment-1/front.jpg" || result.ImagePaths[1] != "apartments/apartment-1/room.jpg" {
		t.Fatalf("ImagePaths = %#v, want raw image list", result.ImagePaths)
	}
	if len(result.ImageURLs) != 2 || result.ImageURLs[0] != "https://signed.example.test/apartments/apartment-1/front.jpg" || result.ImageURLs[1] != "https://signed.example.test/apartments/apartment-1/room.jpg" {
		t.Fatalf("ImageURLs = %#v, want signed image list", result.ImageURLs)
	}
}

func TestGetOwnerApartmentReturnsNotFoundWhenRepositoryHasNoOwnedApartment(t *testing.T) {
	repo := &fakeApartmentRepository{}
	svc := NewService(repo, nil, repo, repo)

	_, err := svc.GetOwnerApartment(context.Background(), "owner-1", "owner", "missing")
	if !errors.Is(err, ErrApartmentNotFound) {
		t.Fatalf("err = %v, want %v", err, ErrApartmentNotFound)
	}
}

func TestUpdateOwnerApartmentValidatesOwnershipRoleAndOccupiedSpots(t *testing.T) {
	repo := &fakeApartmentRepository{
		ownerApartment: &apartment.Apartment{ID: "apartment-1", OccupiedSpots: 2},
	}
	svc := NewService(repo, nil, repo, repo)

	_, err := svc.UpdateOwnerApartment(context.Background(), "owner-1", "owner", "apartment-1", apartment.CreateApartmentInput{
		Title:      "Updated flat",
		Address:    "Main Street",
		TotalSpots: 1,
		BaseRent:   500,
	})
	if err == nil || err.Error() != "total_spots cannot be lower than occupied_spots" {
		t.Fatalf("err = %v, want occupied spots validation", err)
	}

	_, err = svc.UpdateOwnerApartment(context.Background(), "owner-1", "tenant", "apartment-1", apartment.CreateApartmentInput{})
	if !errors.Is(err, ErrOwnerRequired) {
		t.Fatalf("err = %v, want %v", err, ErrOwnerRequired)
	}
}

func TestUpdateOwnerApartmentStoresTrimmedInputWithoutPublishOnlyDescriptionParts(t *testing.T) {
	repo := &fakeApartmentRepository{
		ownerApartment: &apartment.Apartment{ID: "apartment-1", OccupiedSpots: 1},
	}
	svc := NewService(repo, nil, repo, repo)

	result, err := svc.UpdateOwnerApartment(context.Background(), "owner-1", "owner", "apartment-1", apartment.CreateApartmentInput{
		Title:         " Updated flat ",
		Description:   " Better light ",
		Address:       " Main Street ",
		Area:          " Center ",
		TotalSpots:    3,
		Bathrooms:     9,
		BaseRent:      500,

	})
	if err != nil {
		t.Fatalf("UpdateOwnerApartment returned error: %v", err)
	}
	if result.Title != "Updated flat" {
		t.Fatalf("Title = %q, want trimmed title", result.Title)
	}
	if repo.updatedDescription != "Better light" {
		t.Fatalf("updatedDescription = %q, want raw edited description only", repo.updatedDescription)
	}
	if repo.updatedTotalSpots != 3 {
		t.Fatalf("updatedTotalSpots = %d, want 3", repo.updatedTotalSpots)
	}
}

func TestListAvailableApartmentsSignsTenantImagePaths(t *testing.T) {
	repo := &fakeApartmentRepository{
		tenantApartments: []apartment.Apartment{{
			ID:            "apartment-1",
			Title:         "Flat",
			TotalSpots:    3,
			OccupiedSpots: 1,
			ImagePaths:    []string{"mock_1.avif"},
		}},
	}
	signer := &fakeImageStorage{}
	svc := NewService(repo, signer, repo, repo)

	apartments, err := svc.ListAvailableApartments(context.Background())
	if err != nil {
		t.Fatalf("ListAvailableApartments returned error: %v", err)
	}

	if len(apartments[0].ImagePaths) == 0 || apartments[0].ImagePaths[0] != "mock_1.avif" {
		t.Fatalf("ImagePaths = %#v, want raw path", apartments[0].ImagePaths)
	}
	if len(apartments[0].ImageURLs) == 0 || apartments[0].ImageURLs[0] != "https://signed.example.test/mock_1.avif" {
		t.Fatalf("ImageURLs = %#v, want signed URL", apartments[0].ImageURLs)
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
