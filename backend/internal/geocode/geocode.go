package geocode

type ReverseGeocodeInput struct {
	Latitude  float64
	Longitude float64
}

type ReverseGeocodeResult struct {
	Address string `json:"address"`
}
