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
