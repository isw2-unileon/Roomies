package service

import (
	"context"
	"errors"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/supabase"
	profilepostgres "github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile/postgres"
)

// Service contains authentication use cases.
type Service struct {
	supabaseClient *supabase.Client
	profileRepo    *profilepostgres.Repository
}

// NewService creates the authentication service.
func NewService(supabaseClient *supabase.Client, profileRepo *profilepostgres.Repository) *Service {
	return &Service{
		supabaseClient: supabaseClient,
		profileRepo:    profileRepo,
	}
}

// Login authenticates a user and resolves role/onboarding status.
func (s *Service) Login(ctx context.Context, input auth.LoginInput) (*auth.LoginResult, error) {
	if strings.TrimSpace(input.Email) == "" {
		return nil, errors.New("email is required")
	}
	if strings.TrimSpace(input.Password) == "" {
		return nil, errors.New("password is required")
	}
	result, err := s.supabaseClient.Login(ctx, input)
	if err != nil {
		return nil, err
	}
	userID, err := s.supabaseClient.FetchUserID(ctx, result.AccessToken)
	if err != nil {
		return nil, err
	}
	role, err := s.profileRepo.LookupRoleByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	needsTenant, err := s.profileRepo.NeedsTenantProfile(ctx, userID, role)
	if err != nil {
		return nil, err
	}
	return &auth.LoginResult{
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		TokenType:    result.TokenType,
		ExpiresIn:    result.ExpiresIn,
		UserID:       userID,
		Role:         role,
		NeedsTenant:  needsTenant,
	}, nil
}

// Register creates the auth account and app user profile.
func (s *Service) Register(ctx context.Context, input auth.RegisterInput, emailRedirectTo string) (*auth.RegisterResult, error) {
	if strings.TrimSpace(input.Email) == "" {
		return nil, errors.New("email is required")
	}
	if strings.TrimSpace(input.Password) == "" {
		return nil, errors.New("password is required")
	}
	role := strings.ToLower(strings.TrimSpace(input.Role))
	if role != "tenant" && role != "owner" {
		return nil, errors.New("role must be tenant or owner")
	}
	result, err := s.supabaseClient.Register(ctx, input, emailRedirectTo)
	if err != nil {
		return nil, err
	}
	fullName := strings.TrimSpace(input.FullName)
	if fullName == "" {
		fullName = defaultFullNameFromEmail(input.Email)
	}
	if err := s.profileRepo.UpsertUserProfile(ctx, result.UserID, input.Email, fullName, role); err != nil {
		return nil, err
	}
	if role == "owner" {
		if err := s.profileRepo.UpsertOwnerProfile(ctx, result.UserID, fullName); err != nil {
			return nil, err
		}
	}
	return &auth.RegisterResult{
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		TokenType:    result.TokenType,
		ExpiresIn:    result.ExpiresIn,
		UserID:       result.UserID,
		Role:         role,
		NeedsTenant:  role == "tenant",
	}, nil
}

// ForgotPassword starts the password recovery flow.
func (s *Service) ForgotPassword(ctx context.Context, input auth.ForgotPasswordInput, redirectTo string) error {
	return s.supabaseClient.ForgotPassword(ctx, input, redirectTo)
}

// UpdatePassword updates a password using an authenticated/recovery session.
func (s *Service) UpdatePassword(ctx context.Context, accessToken, newPassword string) error {
	return s.supabaseClient.UpdatePassword(ctx, accessToken, newPassword)
}

// VerifyEmail verifies a signup or recovery token.
func (s *Service) VerifyEmail(ctx context.Context, tokenHash, token, verifyType, email string) (*auth.VerifyResult, error) {
	return s.supabaseClient.VerifyEmail(ctx, tokenHash, token, verifyType, email)
}

// ResolveUserIDFromAccessToken resolves the authenticated user id from a bearer token.
func (s *Service) ResolveUserIDFromAccessToken(ctx context.Context, accessToken string) (string, error) {
	if strings.TrimSpace(accessToken) == "" {
		return "", errors.New("access token is required")
	}
	return s.supabaseClient.FetchUserID(ctx, accessToken)
}

func defaultFullNameFromEmail(email string) string {
	email = strings.TrimSpace(email)
	if email == "" {
		return "New user"
	}
	parts := strings.Split(email, "@")
	name := strings.TrimSpace(parts[0])
	if name == "" {
		return "New user"
	}
	return name
}
