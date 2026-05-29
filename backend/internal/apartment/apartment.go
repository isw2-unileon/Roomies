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
	ImagePaths    []string
	Status        string
	Latitude      float64
	Longitude     float64
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
	Description   string
	OwnerID       string
	Address       string
	Area          string
	TotalSpots    int
	OccupiedSpots int
	BaseRent      int
	Status        string
	CreatedAt     string
	ImagePaths    []string
	ImageURLs     []string
	Latitude      float64
	Longitude     float64
}

// ListApartmentsFilters defines server-side filters for tenant explore listings.
type ListApartmentsFilters struct {
	Query             string
	Area              string
	PriceMin          int
	PriceMax          int
	TotalRoomsMin     int
	TotalRoomsMax     int
	AvailableRoomsMin int
	AvailableRoomsMax int
	Availability      string
	SortBy            string
}

// Rules contains apartment coexistence preferences.
type Rules struct {
	SmokingAllowed         *bool
	PetsAllowed            *bool
	MaxNoiseLevel          string
	CleanlinessExpectation string
	PreferredSchedule      string
}

// Detail contains tenant-facing apartment detail information.
type Detail struct {
	Apartment                Apartment
	Rules                    Rules
	CompatibilityScore       int
	CompatibilityReason      []string
	CurrentApplicationID     string
	CurrentApplicationStatus string
	CanApply                 bool
	CanCancel                bool
}
