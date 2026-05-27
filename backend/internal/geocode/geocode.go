package geocode

// ReverseGeocodeInput contains the coordinates for reverse geocoding.
type ReverseGeocodeInput struct {
	Latitude  float64
	Longitude float64
}

// ReverseGeocodeResult contains the address and zone resolved from coordinates.
type ReverseGeocodeResult struct {
	Address string `json:"address"`
	Zone    string `json:"zone"`
}
