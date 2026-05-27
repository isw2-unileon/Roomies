package nominatim

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/geocode"
)

func TestBuildAddress_WithRoadAndNumber(t *testing.T) {
	result := buildAddress(nominatimResponse{
		DisplayName: "Calle Ancha, 12, León, España",
		Address: struct {
			Road        string `json:"road"`
			HouseNumber string `json:"house_number"`
			City        string `json:"city"`
			Town        string `json:"town"`
			Village     string `json:"village"`
		}{
			Road:        "Calle Ancha",
			HouseNumber: "12",
			City:        "León",
		},
	})

	if result != "Calle Ancha, 12" {
		t.Fatalf("buildAddress() = %q, want %q", result, "Calle Ancha, 12")
	}
}

func TestBuildAddress_WithRoadOnly(t *testing.T) {
	result := buildAddress(nominatimResponse{
		DisplayName: "Avenida de la Constitución, León, España",
		Address: struct {
			Road        string `json:"road"`
			HouseNumber string `json:"house_number"`
			City        string `json:"city"`
			Town        string `json:"town"`
			Village     string `json:"village"`
		}{
			Road: "Avenida de la Constitución",
			City: "León",
		},
	})

	if result != "Avenida de la Constitución" {
		t.Fatalf("buildAddress() = %q, want %q", result, "Avenida de la Constitución")
	}
}

func TestBuildAddress_WithDisplayName(t *testing.T) {
	result := buildAddress(nominatimResponse{
		DisplayName: "Parque de la Candamia, León, España",
		Address: struct {
			Road        string `json:"road"`
			HouseNumber string `json:"house_number"`
			City        string `json:"city"`
			Town        string `json:"town"`
			Village     string `json:"village"`
		}{},
	})

	if result != "Parque de la Candamia, León, España" {
		t.Fatalf("buildAddress() = %q, want %q", result, "Parque de la Candamia, León, España")
	}
}

func TestBuildAddress_WithEmpty(t *testing.T) {
	result := buildAddress(nominatimResponse{})

	if result != "" {
		t.Fatalf("buildAddress() = %q, want %q", result, "")
	}
}

func TestReverseGeocode_Success(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("User-Agent") == "" {
			t.Error("request missing User-Agent header")
		}
		if r.Header.Get("Accept-Language") != "es" {
			t.Error("request missing Accept-Language: es header")
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{
			"display_name": "Calle Ancha, 12, León, España",
			"address": {
				"road": "Calle Ancha",
				"house_number": "12",
				"city": "León"
			}
		}`))
	}))
	defer server.Close()

	svc := NewService()
	svc.HTTPClient = server.Client()
	svc.BaseURL = server.URL

	result, err := svc.ReverseGeocode(context.Background(), geocode.ReverseGeocodeInput{
		Latitude:  42.598,
		Longitude: -5.567,
	})
	if err != nil {
		t.Fatalf("ReverseGeocode() returned error: %v", err)
	}
	if result.Address != "Calle Ancha, 12" {
		t.Fatalf("ReverseGeocode().Address = %q, want %q", result.Address, "Calle Ancha, 12")
	}
}

func TestReverseGeocode_Non200(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
	}))
	defer server.Close()

	svc := NewService()
	svc.HTTPClient = server.Client()
	svc.BaseURL = server.URL

	_, err := svc.ReverseGeocode(context.Background(), geocode.ReverseGeocodeInput{
		Latitude:  42.598,
		Longitude: -5.567,
	})
	if err == nil {
		t.Fatal("ReverseGeocode() expected error for non-200 response")
	}
}

func TestReverseGeocode_Timeout(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(100 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{}`))
	}))
	defer server.Close()

	svc := NewService()
	svc.HTTPClient = server.Client()
	svc.BaseURL = server.URL

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)
	defer cancel()

	_, err := svc.ReverseGeocode(ctx, geocode.ReverseGeocodeInput{
		Latitude:  42.598,
		Longitude: -5.567,
	})
	if err == nil {
		t.Fatal("ReverseGeocode() expected error for timeout")
	}
}
