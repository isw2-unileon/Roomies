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
}

func (f *fakeApartmentRepository) CreateApartment(ctx context.Context, ownerID string, input apartment.CreateApartmentInput) (string, int, error) {
	f.createdDescription = input.Description
	f.createdStatus = input.Status
	return "apartment-1", len(input.ImageURLs), nil
}

func (f *fakeApartmentRepository) ListOwnerApartments(ctx context.Context, ownerID string) ([]apartment.OwnerApartment, error) {
	return []apartment.OwnerApartment{{ID: "apartment-1", Title: "Flat"}}, nil
}

func TestCreateApartmentAcceptsRepositoryInterfaceAndPreparesPersistenceData(t *testing.T) {
	repo := &fakeApartmentRepository{}
	svc := NewService(repo)

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
	svc := NewService(&fakeApartmentRepository{})

	_, err := svc.CreateApartment(context.Background(), "tenant-1", "tenant", apartment.CreateApartmentInput{})
	if !errors.Is(err, ErrOwnerRequired) {
		t.Fatalf("err = %v, want %v", err, ErrOwnerRequired)
	}
}
