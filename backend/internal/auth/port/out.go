package port

import "context"

// AuthProvider is the outbound port to external auth provider (Supabase).
type AuthProvider interface {
	Login(ctx context.Context, input LoginInput) (*LoginResult, error)
	Register(ctx context.Context, input RegisterInput, emailRedirectTo string) (*RegisterResult, error)
	ForgotPassword(ctx context.Context, input ForgotPasswordInput, redirectTo string) error
	UpdatePassword(ctx context.Context, accessToken, newPassword string) error
	VerifyEmail(ctx context.Context, tokenHash, token, verifyType, email string) (*VerifyResult, error)
	FetchUserID(ctx context.Context, accessToken string) (string, error)
}

// UserProfileRepository is the outbound port for app profile data.
type UserProfileRepository interface {
	LookupRoleByUserID(ctx context.Context, userID string) (string, error)
	NeedsTenantProfile(ctx context.Context, userID, role string) (bool, error)
	UpsertUserProfile(ctx context.Context, userID, email, fullName, role string) error
}
