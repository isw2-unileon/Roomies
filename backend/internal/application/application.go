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

// InterestedTenantCandidate contains interested tenant data plus profile preferences for matching.
type InterestedTenantCandidate struct {
	InterestedTenant
	BudgetMax     int
	PreferredArea string
	Pets          bool
	Smoking       bool
	Situation     string
	Degree        string
	Profession    string
	Socialization string
	Nightlife     string
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
	Type               string
	Status             string
	CreatedAt          string
	DateLabel          string
	CompatibilityScore int
	RequestType        string
	StatusMessage      string
	GroupID            string
	GroupName          string
	SubmittedByUserID  string
	SubmittedByName    string
	GroupMembers       []GroupMember
	CanCancel          bool
}

// Record contains core application metadata used across tenant and owner flows.
type Record struct {
	ID          string
	ApartmentID string
	TenantID    string
	GroupID     string
	Type        string
	Status      string
	CreatedAt   string
}

// GroupApplicationContext contains group metadata required to validate a group application.
type GroupApplicationContext struct {
	GroupID         string
	GroupName       string
	ApartmentID     string
	CreatedBy       string
	IsCreator       bool
	IsMember        bool
	IsFullyAccepted bool
	AcceptedMembers int
	PendingInvites  int
}

// Applicant contains user-facing applicant data.
type Applicant struct {
	UserID    string
	Name      string
	Email     string
	AvatarURL string
}

// GroupMember contains the public group member data shown to owners.
type GroupMember struct {
	UserID             string
	Name               string
	Email              string
	AvatarURL          string
	CompatibilityScore int
}

// GroupDetails contains owner-facing data for a group application.
type GroupDetails struct {
	GroupID string
	Name    string
	Creator Applicant
	Members []GroupMember
}

// OwnerApplication contains application data shown in the owner requests panel.
type OwnerApplication struct {
	ID                 string
	ApartmentID        string
	PropertyTitle      string
	Address            string
	Type               string
	Status             string
	CreatedAt          string
	Tenant             *Applicant
	Group              *GroupDetails
	CompatibilityScore int
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
