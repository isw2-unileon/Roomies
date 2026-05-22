package service

import (
	"context"
	"testing"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth"
)

type fakeIdentityProvider struct{}

func (f fakeIdentityProvider) Login(ctx context.Context, input auth.LoginInput) (*auth.LoginResult, error) {
	return &auth.LoginResult{AccessToken: "access", RefreshToken: "refresh", TokenType: "bearer", ExpiresIn: 3600}, nil
}

func (f fakeIdentityProvider) Register(ctx context.Context, input auth.RegisterInput, emailRedirectTo string) (*auth.RegisterResult, error) {
	return &auth.RegisterResult{AccessToken: "access", RefreshToken: "refresh", TokenType: "bearer", ExpiresIn: 3600, UserID: "user-1"}, nil
}

func (f fakeIdentityProvider) ForgotPassword(ctx context.Context, input auth.ForgotPasswordInput, redirectTo string) error {
	return nil
}

func (f fakeIdentityProvider) UpdatePassword(ctx context.Context, accessToken, newPassword string) error {
	return nil
}

func (f fakeIdentityProvider) VerifyEmail(ctx context.Context, tokenHash, token, verifyType, email string) (*auth.VerifyResult, error) {
	return &auth.VerifyResult{AccessToken: "access"}, nil
}

func (f fakeIdentityProvider) FetchUserID(ctx context.Context, accessToken string) (string, error) {
	return "user-1", nil
}

type fakeAuthProfileRepository struct{}

func (f fakeAuthProfileRepository) LookupRoleByUserID(ctx context.Context, userID string) (string, error) {
	return "tenant", nil
}

func (f fakeAuthProfileRepository) NeedsTenantProfile(ctx context.Context, userID, role string) (bool, error) {
	return true, nil
}

func (f fakeAuthProfileRepository) UpsertUserProfile(ctx context.Context, userID, email, fullName, role string) error {
	return nil
}

func (f fakeAuthProfileRepository) UpsertOwnerProfile(ctx context.Context, userID, displayName string) error {
	return nil
}

func TestServiceAcceptsAuthProviderAndProfileRepositoryInterfaces(t *testing.T) {
	svc := NewService(fakeIdentityProvider{}, fakeAuthProfileRepository{})

	result, err := svc.Login(context.Background(), auth.LoginInput{Email: "user@example.test", Password: "secret"})
	if err != nil {
		t.Fatalf("Login returned error: %v", err)
	}
	if result.UserID != "user-1" {
		t.Fatalf("UserID = %q, want user-1", result.UserID)
	}
	if result.Role != "tenant" {
		t.Fatalf("Role = %q, want tenant", result.Role)
	}
	if !result.NeedsTenant {
		t.Fatal("NeedsTenant = false, want true")
	}
}
