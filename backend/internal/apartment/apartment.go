package apartment

// StatusAvailable marks an apartment as open for tenant applications.
const StatusAvailable = "AVAILABLE"

// StatusClosed marks an apartment as closed by the owner.
const StatusClosed = "CLOSED"

// CreateApartmentInput contains data needed to publish an apartment.
type CreateApartmentInput struct {
	Title           string
	Description     string
	Address         string
	Area            string
	TotalSpots      int
	Bathrooms       int
	BaseRent        int

	ImagePaths      []string
	Status          string
	Latitude        float64
	Longitude       float64
	SurfaceM2       int
	Floor           int
	SmokingAllowed  *bool
	PetsAllowed     *bool
	StudentsAllowed *bool
	Notes           string
}

// CreateApartmentResult returns basic publication metadata.
type CreateApartmentResult struct {
	ApartmentID  string
	ImagesStored int
}

// Apartment contains apartment data shown in listing views.
type Apartment struct {
	ID              string
	Title           string
	Description     string
	OwnerID         string
	Address         string
	Area            string
	TotalSpots      int
	OccupiedSpots   int
	BaseRent        int
	Status          string
	CreatedAt       string
	ImagePaths      []string
	ImageURLs       []string
	Latitude        float64
	Longitude       float64
	Bathrooms       int
	SurfaceM2       int
	Floor           int
	SmokingAllowed  *bool
	PetsAllowed     *bool
	StudentsAllowed *bool
	Notes           string
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

// Tenant represents a confirmed tenant living in an apartment.
type Tenant struct {
	UserID    string
	Name      string
	Email     string
	AvatarURL string
	JoinedAt  string
}

// Detail contains tenant-facing apartment detail information.
type Detail struct {
	Apartment                Apartment
	CompatibilityScore       int
	CompatibilityReason      []string
	CurrentApplicationID     string
	CurrentApplicationStatus string
	CanApply                 bool
	CanCancel                bool
}
