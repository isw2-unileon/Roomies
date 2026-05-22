package service

import (
	"context"
	"errors"
	"testing"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
)

type fakeApartmentRepository struct {
	createdDescription string
	createdStatus      string
	ownerApartments    []apartment.Apartment
	tenantApartments   []apartment.Apartment
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

func (f *fakeApartmentRepository) ListAvailableApartments(ctx context.Context) ([]apartment.Apartment, error) {
	if f.tenantApartments != nil {
		return f.tenantApartments, nil
	}
	return []apartment.Apartment{{ID: "apartment-1", Title: "Flat", TotalSpots: 3, OccupiedSpots: 1}}, nil
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
	svc := NewService(repo, nil)

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
	svc := NewService(&fakeApartmentRepository{}, nil)

	_, err := svc.CreateApartment(context.Background(), "tenant-1", "tenant", apartment.CreateApartmentInput{})
	if !errors.Is(err, ErrOwnerRequired) {
		t.Fatalf("err = %v, want %v", err, ErrOwnerRequired)
	}
}

func TestListAvailableApartmentsReturnsTenantVisibleListings(t *testing.T) {
	svc := NewService(&fakeApartmentRepository{}, nil)

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
	svc := NewService(repo, signer)

	apartments, err := svc.ListOwnerApartments(context.Background(), "owner-1", "owner")
	if err != nil {
		t.Fatalf("ListOwnerApartments returned error: %v", err)
	}

	if apartments[0].ImageURL != "https://signed.example.test/apartments/apartment-1/photo.jpg" {
		t.Fatalf("ImageURL = %q, want signed URL", apartments[0].ImageURL)
	}
	if signer.bucket != "apartment-photos" {
		t.Fatalf("bucket = %q, want apartment-photos", signer.bucket)
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
	svc := NewService(repo, signer)

	apartments, err := svc.ListAvailableApartments(context.Background())
	if err != nil {
		t.Fatalf("ListAvailableApartments returned error: %v", err)
	}

	if apartments[0].ImageURL != "https://signed.example.test/mock_1.avif" {
		t.Fatalf("ImageURL = %q, want signed URL", apartments[0].ImageURL)
	}
}
