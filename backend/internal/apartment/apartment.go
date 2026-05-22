package apartment

// StatusAvailable marks an apartment as open for tenant applications.
const StatusAvailable = "AVAILABLE"

// CreateApartmentInput contains data needed to publish an apartment.
type CreateApartmentInput struct {
	Title         string
	Description   string
	Address       string
	Area          string
	TotalSpots    int
	Bathrooms     int
	BaseRent      int
	AvailableFrom string
	ImageURLs     []string
	Status        string
}

// CreateApartmentResult returns basic publication metadata.
type CreateApartmentResult struct {
	ApartmentID  string
	ImagesStored int
}

// Apartment contains apartment data shown in listing views.
type Apartment struct {
	ID            string
	Title         string
	Address       string
	Area          string
	TotalSpots    int
	OccupiedSpots int
	BaseRent      int
	Status        string
	CreatedAt     string
	ImageURL      string
}
