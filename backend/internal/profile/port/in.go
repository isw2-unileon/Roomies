package port

import "context"

// TenantProfileInput contains onboarding/profile fields.
type TenantProfileInput struct {
	BudgetMin     int    `json:"budget_min"`
	BudgetMax     int    `json:"budget_max"`
	PreferredArea string `json:"preferred_area"`
	MoveInDate    string `json:"move_in_date"`
	Schedule      string `json:"schedule"`
	Pets          bool   `json:"pets"`
	Smoker        bool   `json:"smoker"`
	NoiseLevel    string `json:"noise_level"`
	Cleanliness   string `json:"cleanliness"`
}

// Service defines profile use cases consumed by HTTP handlers.
type Service interface {
	LookupRoleByUserID(ctx context.Context, userID string) (string, error)
	NeedsTenantProfile(ctx context.Context, userID, role string) (bool, error)
	SaveTenantProfile(ctx context.Context, userID string, input TenantProfileInput) error
}
