// Package auth defines authentication inputs and results used by the application.
package auth

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
