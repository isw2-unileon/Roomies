package httpadapter

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	apartmentservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment/service"
)

type fakeMapRepo struct{}

func (f *fakeMapRepo) CreateApartment(ctx context.Context, ownerID string, input apartment.CreateApartmentInput) (string, int, error) {
	return "", 0, nil
}
func (f *fakeMapRepo) ListOwnerApartments(ctx context.Context, ownerID string) ([]apartment.Apartment, error) {
	return nil, nil
}
func (f *fakeMapRepo) ListAvailableApartments(ctx context.Context, filters apartment.ListApartmentsFilters) ([]apartment.Apartment, error) {
	return nil, nil
}
func (f *fakeMapRepo) ListApartmentsInRadius(ctx context.Context, lat, lng, radiusKm float64) ([]apartment.Apartment, error) {
	return []apartment.Apartment{
		{ID: "apt-1", Title: "Piso cerca", Latitude: lat + 0.001, Longitude: lng + 0.001, TotalSpots: 3, OccupiedSpots: 1},
		{ID: "apt-2", Title: "Piso lejos", Latitude: lat + 0.01, Longitude: lng + 0.01, TotalSpots: 2, OccupiedSpots: 0},
	}, nil
}
func (f *fakeMapRepo) GetApartmentByID(ctx context.Context, apartmentID string) (*apartment.Apartment, error) {
	return nil, nil
}
func (f *fakeMapRepo) GetOwnerApartmentByID(ctx context.Context, ownerID, apartmentID string) (*apartment.Apartment, error) {
	return nil, nil
}
func (f *fakeMapRepo) UpdateOwnerApartment(ctx context.Context, ownerID, apartmentID string, input apartment.CreateApartmentInput) (*apartment.Apartment, error) {
	return nil, nil
}
func (f *fakeMapRepo) CloseApartment(ctx context.Context, ownerID, apartmentID string) (bool, error) {
	return true, nil
}
func (f *fakeMapRepo) ReopenApartment(ctx context.Context, ownerID, apartmentID string) (bool, error) {
	return true, nil
}
func (f *fakeMapRepo) ListApartmentTenants(ctx context.Context, ownerID, apartmentID string) ([]apartment.Tenant, error) {
	return nil, nil
}

func (f *fakeMapRepo) ListApartmentResidents(ctx context.Context, apartmentID string) ([]apartment.Tenant, error) {
	return nil, nil
}

func TestListApartmentsByMapReturnsApartments(t *testing.T) {
	gin.SetMode(gin.TestMode)

	svc := apartmentservice.NewService(&fakeMapRepo{}, nil, nil, nil)
	h := &handler{apartmentService: svc}

	r := gin.New()
	r.GET("/api/apartments/map", h.listApartmentsByMap)

	req := httptest.NewRequest(http.MethodGet, "/api/apartments/map?lat=42.6&lng=-5.57&radius=2", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}

	var body struct {
		Apartments []tenantApartmentResponse `json:"apartments"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}
	if len(body.Apartments) != 2 {
		t.Fatalf("len(apartments) = %d, want 2", len(body.Apartments))
	}
	if body.Apartments[0].ID != "apt-1" {
		t.Fatalf("apartments[0].ID = %q, want apt-1", body.Apartments[0].ID)
	}
}

func TestListApartmentsByMapMissingParams(t *testing.T) {
	gin.SetMode(gin.TestMode)

	svc := apartmentservice.NewService(&fakeMapRepo{}, nil, nil, nil)
	h := &handler{apartmentService: svc}

	r := gin.New()
	r.GET("/api/apartments/map", h.listApartmentsByMap)

	req := httptest.NewRequest(http.MethodGet, "/api/apartments/map", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", w.Code)
	}
}

func TestListApartmentsByMapInvalidLat(t *testing.T) {
	gin.SetMode(gin.TestMode)

	svc := apartmentservice.NewService(&fakeMapRepo{}, nil, nil, nil)
	h := &handler{apartmentService: svc}

	r := gin.New()
	r.GET("/api/apartments/map", h.listApartmentsByMap)

	req := httptest.NewRequest(http.MethodGet, "/api/apartments/map?lat=999&lng=-5.57&radius=2", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", w.Code)
	}
}

func TestListApartmentsByMapInvalidRadius(t *testing.T) {
	gin.SetMode(gin.TestMode)

	svc := apartmentservice.NewService(&fakeMapRepo{}, nil, nil, nil)
	h := &handler{apartmentService: svc}

	r := gin.New()
	r.GET("/api/apartments/map", h.listApartmentsByMap)

	req := httptest.NewRequest(http.MethodGet, "/api/apartments/map?lat=42.6&lng=-5.57&radius=-1", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400", w.Code)
	}
}

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
