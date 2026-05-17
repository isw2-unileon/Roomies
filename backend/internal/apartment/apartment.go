package apartment

// CreateApartmentInput contains data needed to publish an apartment.
type CreateApartmentInput struct {
	Title         string   `json:"title"`
	Description   string   `json:"description"`
	Address       string   `json:"address"`
	Area          string   `json:"area"`
	TotalSpots    int      `json:"total_spots"`
	Bathrooms     int      `json:"bathrooms"`
	BaseRent      int      `json:"base_rent"`
	AvailableFrom string   `json:"available_from"`
	ImageURLs     []string `json:"image_urls"`
}

// CreateApartmentResult returns basic publication metadata.
type CreateApartmentResult struct {
	ApartmentID  string `json:"apartment_id"`
	ImagesStored int    `json:"images_stored"`
}
