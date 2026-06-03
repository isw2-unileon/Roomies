// Package profile defines profile inputs used by the application.
package profile

// TenantProfileInput contains onboarding/profile fields.
type TenantProfileInput struct {
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

// TenantProfile contains tenant profile data used by matching and application use cases.
type TenantProfile struct {
	UserID        string
	BudgetMin     int
	BudgetMax     int
	PreferredArea string
	Pets          bool
	Smoking       bool
	NoiseLevel    string
	Cleanliness   string
	WorkSchedule  string
	Age           int
	University    string
	Sex           string
	Situation     string
	Degree        string
	Profession    string
	Socialization string
	Nightlife     string
}

// TenantPersonalProfile contains editable account data for a tenant user.
type TenantPersonalProfile struct {
	UserID    string
	FullName  string
	Email     string
	AvatarURL string
}
