package httpadapter

import (
	"testing"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
)

func TestTenantApartmentResponsesDerivesAvailableSpots(t *testing.T) {
	responses := tenantApartmentResponses([]apartment.Apartment{{
		ID:            "apartment-1",
		Title:         "Flat",
		TotalSpots:    3,
		OccupiedSpots: 1,
		ImagePaths:    []string{"apartments/apartment-1/photo.jpg"},
		ImageURLs:     []string{"https://signed.example.test/apartments/apartment-1/photo.jpg"},
	}})

	if len(responses) != 1 {
		t.Fatalf("len(responses) = %d, want 1", len(responses))
	}
	if responses[0].AvailableSpots != 2 {
		t.Fatalf("AvailableSpots = %d, want 2", responses[0].AvailableSpots)
	}
	if responses[0].ImageURL != "https://signed.example.test/apartments/apartment-1/photo.jpg" {
		t.Fatalf("ImageURL = %q, want first signed image URL", responses[0].ImageURL)
	}
	if len(responses[0].ImageURLs) != 1 || responses[0].ImageURLs[0] != "https://signed.example.test/apartments/apartment-1/photo.jpg" {
		t.Fatalf("ImageURLs = %#v, want signed image URLs", responses[0].ImageURLs)
	}
	if len(responses[0].ImagePaths) != 1 || responses[0].ImagePaths[0] != "apartments/apartment-1/photo.jpg" {
		t.Fatalf("ImagePaths = %#v, want raw image paths", responses[0].ImagePaths)
	}
}

func TestOwnerApartmentResponseReturnsSignedURLsAndRawPaths(t *testing.T) {
	response := ownerApartmentResponseFrom(apartment.Apartment{
		ID:         "apartment-1",
		Title:      "Flat",
		ImagePaths: []string{"apartments/apartment-1/photo.jpg"},
		ImageURLs:  []string{"https://signed.example.test/apartments/apartment-1/photo.jpg"},
	})

	if response.ImageURL != "https://signed.example.test/apartments/apartment-1/photo.jpg" {
		t.Fatalf("ImageURL = %q, want first signed image URL", response.ImageURL)
	}
	if len(response.ImageURLs) != 1 || response.ImageURLs[0] != "https://signed.example.test/apartments/apartment-1/photo.jpg" {
		t.Fatalf("ImageURLs = %#v, want signed image URLs", response.ImageURLs)
	}
	if len(response.ImagePaths) != 1 || response.ImagePaths[0] != "apartments/apartment-1/photo.jpg" {
		t.Fatalf("ImagePaths = %#v, want raw image paths", response.ImagePaths)
	}
}
