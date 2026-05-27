package httpadapter

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	geocodenominatim "github.com/isw2-unileon/proyect-scaffolding/backend/internal/geocode/nominatim"
)

func TestReverseGeocodeHandler_MissingParams(t *testing.T) {
	svc := geocodenominatim.NewService()
	gin.SetMode(gin.TestMode)
	api := gin.New()
	RegisterRoutes(&api.RouterGroup, svc)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/geocode/reverse", nil)
	api.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestReverseGeocodeHandler_InvalidLat(t *testing.T) {
	svc := geocodenominatim.NewService()
	gin.SetMode(gin.TestMode)
	api := gin.New()
	RegisterRoutes(&api.RouterGroup, svc)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/geocode/reverse?lat=999&lng=-5.567", nil)
	api.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestReverseGeocodeHandler_InvalidLng(t *testing.T) {
	svc := geocodenominatim.NewService()
	gin.SetMode(gin.TestMode)
	api := gin.New()
	RegisterRoutes(&api.RouterGroup, svc)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/geocode/reverse?lat=42.598&lng=abc", nil)
	api.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusBadRequest)
	}
}

func TestReverseGeocodeHandler_Success(t *testing.T) {
	nomServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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
	defer nomServer.Close()

	svc := geocodenominatim.NewService()
	svc.HTTPClient = nomServer.Client()
	svc.BaseURL = nomServer.URL

	gin.SetMode(gin.TestMode)
	api := gin.New()
	RegisterRoutes(&api.RouterGroup, svc)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/geocode/reverse?lat=42.598&lng=-5.567", nil)
	api.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d. body: %s", w.Code, http.StatusOK, w.Body.String())
	}

	var resp struct {
		Address string `json:"address"`
	}
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Address != "Calle Ancha, 12" {
		t.Fatalf("address = %q, want %q", resp.Address, "Calle Ancha, 12")
	}
}

func TestReverseGeocodeHandler_ServiceError(t *testing.T) {
	nomServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer nomServer.Close()

	svc := geocodenominatim.NewService()
	svc.HTTPClient = nomServer.Client()
	svc.BaseURL = nomServer.URL

	gin.SetMode(gin.TestMode)
	api := gin.New()
	RegisterRoutes(&api.RouterGroup, svc)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/geocode/reverse?lat=42.598&lng=-5.567", nil)
	api.ServeHTTP(w, req)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusInternalServerError)
	}
}
