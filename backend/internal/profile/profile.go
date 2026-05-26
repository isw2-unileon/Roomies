// Package profile defines profile inputs used by the application.
package profile

// TenantProfileInput contains onboarding/profile fields.
type TenantProfileInput struct {
	BudgetMin     int
	BudgetMax     int
	PreferredArea string
	MoveInDate    string
	Pets          bool
	Smoking       bool
	NoiseLevel    string
	Cleanliness   string
	WorkSchedule  string

	SleepSchedule    string
	SocialLifestyle  string
	StudyHabits      string
	Language         string
	University       string
	Age              int
	GuestPreferences string
	PartyFrequency   string
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
}
