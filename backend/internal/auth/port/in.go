package port

import "context"

// LoginInput contains login credentials.
type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// ForgotPasswordInput contains the email for recovery.
type ForgotPasswordInput struct {
	Email string `json:"email"`
}

// RegisterInput contains registration payload.
type RegisterInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}

// LoginResult is returned after a successful login.
type LoginResult struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
	UserID       string `json:"user_id"`
	Role         string `json:"role"`
	NeedsTenant  bool   `json:"needs_tenant_profile"`
}

// RegisterResult is returned after a successful registration.
type RegisterResult struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
	UserID       string `json:"user_id"`
	Role         string `json:"role"`
	NeedsTenant  bool   `json:"needs_tenant_profile"`
}

// VerifyResult is returned after account verification.
type VerifyResult struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

// Service defines auth use cases consumed by HTTP handlers.
type Service interface {
	Login(ctx context.Context, input LoginInput) (*LoginResult, error)
	Register(ctx context.Context, input RegisterInput, emailRedirectTo string) (*RegisterResult, error)
	ForgotPassword(ctx context.Context, input ForgotPasswordInput, redirectTo string) error
	UpdatePassword(ctx context.Context, accessToken, newPassword string) error
	VerifyEmail(ctx context.Context, tokenHash, token, verifyType, email string) (*VerifyResult, error)
	ResolveUserIDFromAccessToken(ctx context.Context, accessToken string) (string, error)
}
