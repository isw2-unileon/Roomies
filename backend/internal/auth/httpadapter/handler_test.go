package httpadapter

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth"
	authservice "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/service"
)

type fakeResetIdentityProvider struct {
	updatedAccessToken string
	updatedPassword    string
}

func (f *fakeResetIdentityProvider) Login(context.Context, auth.LoginInput) (*auth.LoginResult, error) {
	return nil, nil
}

func (f *fakeResetIdentityProvider) Register(context.Context, auth.RegisterInput, string) (*auth.RegisterResult, error) {
	return nil, nil
}

func (f *fakeResetIdentityProvider) ForgotPassword(context.Context, auth.ForgotPasswordInput, string) error {
	return nil
}

func (f *fakeResetIdentityProvider) UpdatePassword(_ context.Context, accessToken, newPassword string) error {
	f.updatedAccessToken = accessToken
	f.updatedPassword = newPassword
	return nil
}

func (f *fakeResetIdentityProvider) VerifyEmail(context.Context, string, string, string, string) (*auth.VerifyResult, error) {
	return nil, nil
}

func (f *fakeResetIdentityProvider) FetchUserID(context.Context, string) (string, error) {
	return "user-1", nil
}

type fakeResetProfileRepository struct{}

func (f fakeResetProfileRepository) LookupRoleByUserID(context.Context, string) (string, error) {
	return "tenant", nil
}

func (f fakeResetProfileRepository) NeedsTenantProfile(context.Context, string, string) (bool, error) {
	return false, nil
}

func (f fakeResetProfileRepository) UpsertUserProfile(context.Context, string, string, string, string) error {
	return nil
}

func (f fakeResetProfileRepository) UpsertOwnerProfile(context.Context, string, string) error {
	return nil
}

func TestResetPasswordUsesBearerRecoveryToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	identity := &fakeResetIdentityProvider{}
	svc := authservice.NewService(identity, fakeResetProfileRepository{})
	r := gin.New()
	RegisterPublicRoutes(r.Group("/api"), svc, "http://localhost:5173", false)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/reset-password", strings.NewReader(`{"password":"new-secret"}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer recovery-token")
	resp := httptest.NewRecorder()

	r.ServeHTTP(resp, req)

	if resp.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", resp.Code, http.StatusOK)
	}
	if identity.updatedAccessToken != "recovery-token" {
		t.Fatalf("updatedAccessToken = %q, want recovery-token", identity.updatedAccessToken)
	}
	if identity.updatedPassword != "new-secret" {
		t.Fatalf("updatedPassword = %q, want new-secret", identity.updatedPassword)
	}
}

func TestResetPasswordRejectsMissingBearerToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	identity := &fakeResetIdentityProvider{}
	svc := authservice.NewService(identity, fakeResetProfileRepository{})
	r := gin.New()
	RegisterPublicRoutes(r.Group("/api"), svc, "http://localhost:5173", false)

	req := httptest.NewRequest(http.MethodPost, "/api/auth/reset-password", strings.NewReader(`{"password":"new-secret"}`))
	req.Header.Set("Content-Type", "application/json")
	resp := httptest.NewRecorder()

	r.ServeHTTP(resp, req)

	if resp.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", resp.Code, http.StatusUnauthorized)
	}
	if identity.updatedAccessToken != "" {
		t.Fatalf("updatedAccessToken = %q, want empty", identity.updatedAccessToken)
	}
}
