// Package profile defines profile inputs used by the application.
package profile

// TenantProfileInput contains onboarding/profile fields used for matching and display.
type TenantProfileInput struct {
	UserID        string
	BudgetMax     int
	PreferredArea string
	Pets          bool
	Smoking       bool
	Age           int
	Sex           string
	Situation     string
	Degree        string
	Profession    string
	Socialization string
	Nightlife     string
}

// TenantPersonalProfileInput contains editable account fields shown in profile.
type TenantPersonalProfileInput struct {
	FullName  string
	AvatarURL string
}

// TenantPersonalProfile contains editable account data for a tenant user.
type TenantPersonalProfile struct {
	UserID    string
	FullName  string
	Email     string
	AvatarURL string
}

// TenantProfileSummary contains public tenant profile data for roommate discovery.
type TenantProfileSummary struct {
	UserID        string
	Name          string
	Email         string
	AvatarURL     string
	BudgetMax     int
	PreferredArea string
	Pets          bool
	Smoking       bool
	Age           int
	Sex           string
	Situation     string
	Degree        string
	Profession    string
	Socialization string
	Nightlife     string
	Compatibility int
}

// OwnerProfileInput contains the editable fields for an owner profile.
type OwnerProfileInput struct {
	FullName    string
	DisplayName string
	Phone       string
}

// OwnerProfile contains all viewable/editable data for an owner user.
type OwnerProfile struct {
	UserID      string
	FullName    string
	Email       string
	AvatarURL   string
	DisplayName string
	Phone       string
}
