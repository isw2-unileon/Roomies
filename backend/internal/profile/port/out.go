package port

import "context"

// Repository defines persistence operations for profile/user data.
type Repository interface {
	LookupRoleByUserID(ctx context.Context, userID string) (string, error)
	NeedsTenantProfile(ctx context.Context, userID, role string) (bool, error)
	UpsertTenantProfile(ctx context.Context, userID string, input TenantProfileInput) error
	UpsertUserProfile(ctx context.Context, userID, email, fullName, role string) error
}
