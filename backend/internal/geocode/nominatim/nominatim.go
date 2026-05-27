package nominatim

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/geocode"
)

type Service struct {
	client    *http.Client
	userAgent string
}

type nominatimResponse struct {
	DisplayName string `json:"display_name"`
	Address     struct {
		Road        string `json:"road"`
		HouseNumber string `json:"house_number"`
		City        string `json:"city"`
		Town        string `json:"town"`
		Village     string `json:"village"`
	} `json:"address"`
}

func NewService() *Service {
	return &Service{
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
		userAgent: "RoomiesApp/1.0",
	}
}

func (s *Service) ReverseGeocode(ctx context.Context, input geocode.ReverseGeocodeInput) (*geocode.ReverseGeocodeResult, error) {
	url := fmt.Sprintf(
		"https://nominatim.openstreetmap.org/reverse?lat=%f&lon=%f&format=json&addressdetails=1",
		input.Latitude, input.Longitude,
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("User-Agent", s.userAgent)
	req.Header.Set("Accept-Language", "es")

	resp, err := s.client.Do(req)
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
	return &geocode.ReverseGeocodeResult{Address: address}, nil
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
