// Package auth defines authentication inputs and results used by the application.
package auth

// LoginInput contains login credentials.
type LoginInput struct {
	Email    string
	Password string
}

// ForgotPasswordInput contains the email for recovery.
type ForgotPasswordInput struct {
	Email string
}

// RegisterInput contains registration payload.
type RegisterInput struct {
	Email    string
	Password string
	FullName string
	Role     string
}

// LoginResult is returned after a successful login.
type LoginResult struct {
	AccessToken  string
	RefreshToken string
	TokenType    string
	ExpiresIn    int64
	UserID       string
	Role         string
	NeedsTenant  bool
}

// RegisterResult is returned after a successful registration.
type RegisterResult struct {
	AccessToken  string
	RefreshToken string
	TokenType    string
	ExpiresIn    int64
	UserID       string
	Role         string
	NeedsTenant  bool
}

// VerifyResult is returned after account verification.
type VerifyResult struct {
	AccessToken  string
	RefreshToken string
	TokenType    string
	ExpiresIn    int64
}
