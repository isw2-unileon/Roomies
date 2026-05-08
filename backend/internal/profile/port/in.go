package port

import "context"

// TenantProfileInput contains onboarding/profile fields.
type TenantProfileInput struct {
	BudgetMin     int    `json:"budget_min"`
	BudgetMax     int    `json:"budget_max"`
	PreferredArea string `json:"preferred_area"`
	MoveInDate    string `json:"move_in_date"`
	Pets          bool   `json:"pets"`
	Smoking       bool   `json:"smoking"`
	NoiseLevel    string `json:"noise_level"`
	Cleanliness   string `json:"cleanliness"`
	WorkSchedule  string `json:"work_schedule"`

	SleepSchedule    string `json:"sleep_schedule,omitempty"`
	SocialLifestyle  string `json:"social_lifestyle,omitempty"`
	StudyHabits      string `json:"study_habits,omitempty"`
	Language         string `json:"language,omitempty"`
	University       string `json:"university,omitempty"`
	Age              int    `json:"age,omitempty"`
	GuestPreferences string `json:"guest_preferences,omitempty"`
	PartyFrequency   string `json:"party_frequency,omitempty"`
}

// Service defines profile use cases consumed by HTTP handlers.
type Service interface {
	LookupRoleByUserID(ctx context.Context, userID string) (string, error)
	NeedsTenantProfile(ctx context.Context, userID, role string) (bool, error)
	SaveTenantProfile(ctx context.Context, userID string, input TenantProfileInput) error
}
