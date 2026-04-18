package app

import (
	"context"
	"errors"
	"strings"

	authport "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/port"
)

// Service implements auth use cases.
type Service struct {
	authProvider authport.AuthProvider
	profileRepo  authport.UserProfileRepository
}

// NewService creates the auth application service.
func NewService(authProvider authport.AuthProvider, profileRepo authport.UserProfileRepository) *Service {
	return &Service{
		authProvider: authProvider,
		profileRepo:  profileRepo,
	}
}

// Login authenticates user and resolves role/onboarding status.
func (s *Service) Login(ctx context.Context, input authport.LoginInput) (*authport.LoginResult, error) {
	if strings.TrimSpace(input.Email) == "" {
		return nil, errors.New("email is required")
	}
	if strings.TrimSpace(input.Password) == "" {
		return nil, errors.New("password is required")
	}
	result, err := s.authProvider.Login(ctx, input)
	if err != nil {
		return nil, err
	}
	userID, err := s.authProvider.FetchUserID(ctx, result.AccessToken)
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
	return &authport.LoginResult{
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		TokenType:    result.TokenType,
		ExpiresIn:    result.ExpiresIn,
		UserID:       userID,
		Role:         role,
		NeedsTenant:  needsTenant,
	}, nil
}

// Register creates auth account and upserts app user profile.
func (s *Service) Register(ctx context.Context, input authport.RegisterInput, emailRedirectTo string) (*authport.RegisterResult, error) {
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
	result, err := s.authProvider.Register(ctx, input, emailRedirectTo)
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
	return &authport.RegisterResult{
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		TokenType:    result.TokenType,
		ExpiresIn:    result.ExpiresIn,
		UserID:       result.UserID,
		Role:         role,
		NeedsTenant:  role == "tenant",
	}, nil
}

// ForgotPassword starts password recovery flow.
func (s *Service) ForgotPassword(ctx context.Context, input authport.ForgotPasswordInput, redirectTo string) error {
	return s.authProvider.ForgotPassword(ctx, input, redirectTo)
}

// UpdatePassword updates user password with recovery token.
func (s *Service) UpdatePassword(ctx context.Context, accessToken, newPassword string) error {
	return s.authProvider.UpdatePassword(ctx, accessToken, newPassword)
}

// VerifyEmail verifies signup/recovery token.
func (s *Service) VerifyEmail(ctx context.Context, tokenHash, token, verifyType, email string) (*authport.VerifyResult, error) {
	return s.authProvider.VerifyEmail(ctx, tokenHash, token, verifyType, email)
}

// ResolveUserIDFromAccessToken resolves user id from bearer token.
func (s *Service) ResolveUserIDFromAccessToken(ctx context.Context, accessToken string) (string, error) {
	if strings.TrimSpace(accessToken) == "" {
		return "", errors.New("access token is required")
	}
	return s.authProvider.FetchUserID(ctx, accessToken)
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
