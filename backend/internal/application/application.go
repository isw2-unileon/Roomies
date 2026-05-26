package application

import "strings"

// InterestedTenant contains public data for tenants interested in an apartment.
type InterestedTenant struct {
	UserID        string
	Name          string
	Age           int
	Studies       string
	AvatarURL     string
	Compatibility int
}

// InterestedTenantCandidate contains interested tenant data plus profile preferences.
type InterestedTenantCandidate struct {
	InterestedTenant
	BudgetMin     int
	BudgetMax     int
	PreferredArea string
	Pets          bool
	Smoking       bool
	NoiseLevel    string
	Cleanliness   string
	WorkSchedule  string
}

// TenantApplication contains tenant-facing application data.
type TenantApplication struct {
	ID                 string
	ApartmentID        string
	PropertyTitle      string
	OwnerName          string
	Address            string
	ImageURL           string
	Places             int
	Size               int
	Bathrooms          int
	Status             string
	CreatedAt          string
	DateLabel          string
	CompatibilityScore int
	RequestType        string
	StatusMessage      string
}

// MapStatus converts database application statuses into tenant-facing statuses.
func MapStatus(status string) string {
	status = strings.ToUpper(strings.TrimSpace(status))
	switch status {
	case "PENDING_OWNER", "PENDING_CONFIRMED_TENANTS":
		return "pending"
	case "FULLY_CONFIRMED":
		return "approved"
	case "REJECTED_BY_OWNER", "REJECTED_BY_CONFIRMED_TENANTS":
		return "rejected"
	case "CANCELLED":
		return "cancelled"
	default:
		return "pending"
	}
}

// BuildDateLabel returns a tenant-facing date label based on application status.
func BuildDateLabel(status string, createdAt string) string {
	switch status {
	case "approved":
		return "Aceptada el " + createdAt
	case "rejected":
		return "Respondida el " + createdAt
	case "cancelled":
		return "Cancelada el " + createdAt
	default:
		return "Solicitada el " + createdAt
	}
}

// BuildStatusMessage returns a tenant-facing message based on application status.
func BuildStatusMessage(status string) string {
	switch status {
	case "approved":
		return "Tu solicitud ha sido aceptada por el propietario."
	case "rejected":
		return "El propietario ha rechazado tu solicitud para este piso."
	case "cancelled":
		return "La solicitud fue cancelada."
	default:
		return "Tu solicitud esta pendiente de revision por el propietario."
	}
}
