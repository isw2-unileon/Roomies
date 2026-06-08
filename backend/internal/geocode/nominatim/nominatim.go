package nominatim

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/geocode"
)

// Service performs reverse geocoding via the Nominatim API.
type Service struct {
	client    *http.Client
	userAgent string
	baseURL   string

	HTTPClient *http.Client
	BaseURL    string
}

type nominatimResponse struct {
	DisplayName string `json:"display_name"`
	Address     struct {
		Road          string `json:"road"`
		HouseNumber   string `json:"house_number"`
		City          string `json:"city"`
		Town          string `json:"town"`
		Village       string `json:"village"`
		Suburb        string `json:"suburb"`
		CityDistrict  string `json:"city_district"`
		Neighbourhood string `json:"neighbourhood"`
		District      string `json:"district"`
		County        string `json:"county"`
	} `json:"address"`
}

// NewService creates a Nominatim geocode service with a 5s timeout and default User-Agent.
func NewService() *Service {
	return &Service{
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
		userAgent: "RoomiesApp/1.0 (+https://github.com/isw2-unileon/proyect-scaffolding)",
	}
}

// ReverseGeocode resolves latitude/longitude to an address and zone using Nominatim.
func (s *Service) ReverseGeocode(ctx context.Context, input geocode.ReverseGeocodeInput) (*geocode.ReverseGeocodeResult, error) {
	nomBaseURL := s.BaseURL
	if nomBaseURL == "" {
		nomBaseURL = s.baseURL
	}
	if nomBaseURL == "" {
		nomBaseURL = "https://nominatim.openstreetmap.org"
	}
	httpClient := s.HTTPClient
	if httpClient == nil {
		httpClient = s.client
	}
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	url := fmt.Sprintf(
		"%s/reverse?lat=%f&lon=%f&format=json&addressdetails=1",
		nomBaseURL, input.Latitude, input.Longitude,
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("User-Agent", s.userAgent)
	req.Header.Set("Accept-Language", "es")

	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("nominatim request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("nominatim status %d", resp.StatusCode)
	}

	var nomResp nominatimResponse
	if err := json.NewDecoder(resp.Body).Decode(&nomResp); err != nil {
		return nil, fmt.Errorf("decode nominatim response: %w", err)
	}

	address := buildAddress(nomResp)
	zone := buildZone(nomResp)
	return &geocode.ReverseGeocodeResult{Address: address, Zone: zone}, nil
}

func buildZone(nomResp nominatimResponse) string {
	switch {
	case nomResp.Address.Suburb != "":
		return nomResp.Address.Suburb
	case nomResp.Address.CityDistrict != "":
		return nomResp.Address.CityDistrict
	case nomResp.Address.Neighbourhood != "":
		return nomResp.Address.Neighbourhood
	case nomResp.Address.District != "":
		return nomResp.Address.District
	case nomResp.Address.County != "":
		return nomResp.Address.County
	default:
		return ""
	}
}

func buildAddress(nomResp nominatimResponse) string {
	if nomResp.Address.Road != "" {
		if nomResp.Address.HouseNumber != "" {
			return nomResp.Address.Road + ", " + nomResp.Address.HouseNumber
		}
		return nomResp.Address.Road
	}
	if nomResp.DisplayName != "" {
		return nomResp.DisplayName
	}
	return ""
}
