package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/database"
	"github.com/jackc/pgx/v5"
)

type Service struct {
	baseURL string
	apiKey  string
	client  *http.Client
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type ForgotPasswordInput struct {
	Email string `json:"email"`
}

type RegisterInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}

type LoginResult struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
	UserID       string `json:"user_id"`
	Role         string `json:"role"`
	NeedsTenant  bool   `json:"needs_tenant_profile"`
}

type RegisterResult struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
	UserID       string `json:"user_id"`
	Role         string `json:"role"`
	NeedsTenant  bool   `json:"needs_tenant_profile"`
}

type VerifyResult struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

type tokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
	Error        string `json:"error"`
	Description  string `json:"error_description"`
	Message      string `json:"message"`
	Msg          string `json:"msg"`
}

type signUpResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
	ID           string `json:"id"`
	Error        string `json:"error"`
	Description  string `json:"error_description"`
	Message      string `json:"message"`
	Msg          string `json:"msg"`
	Session      struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		TokenType    string `json:"token_type"`
		ExpiresIn    int64  `json:"expires_in"`
	} `json:"session"`
	User struct {
		ID string `json:"id"`
	} `json:"user"`
}

type authUserResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
}

func NewService(baseURL, apiKey string) (*Service, error) {
	if strings.TrimSpace(baseURL) == "" {
		return nil, errors.New("supabase URL is required")
	}

	if strings.TrimSpace(apiKey) == "" {
		return nil, errors.New("supabase publishable key is required")
	}

	return &Service{
		baseURL: strings.TrimRight(baseURL, "/"),
		apiKey:  apiKey,
		client: &http.Client{
			Timeout: 12 * time.Second,
		},
	}, nil
}

func (s *Service) Login(ctx context.Context, input LoginInput) (*LoginResult, error) {
	if strings.TrimSpace(input.Email) == "" {
		return nil, errors.New("email is required")
	}

	if strings.TrimSpace(input.Password) == "" {
		return nil, errors.New("password is required")
	}

	body, err := json.Marshal(input)
	if err != nil {
		return nil, fmt.Errorf("marshal login payload: %w", err)
	}

	requestURL := s.baseURL + "/auth/v1/token?grant_type=password"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, requestURL, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.apiKey)
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request token endpoint: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read token response: %w", err)
	}

	var parsed tokenResponse
	if err := json.Unmarshal(responseBody, &parsed); err != nil {
		return nil, fmt.Errorf("decode token response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		errMessage := parsed.Description
		if errMessage == "" {
			errMessage = parsed.Msg
		}
		if errMessage == "" {
			errMessage = parsed.Message
		}
		if errMessage == "" {
			errMessage = parsed.Error
		}
		if errMessage == "" {
			errMessage = "invalid credentials"
		}

		return nil, errors.New(errMessage)
	}

	authUser, err := s.fetchUser(ctx, parsed.AccessToken)
	if err != nil {
		return nil, err
	}

	role, err := lookupRoleByUserID(ctx, authUser.ID)
	if err != nil {
		return nil, err
	}

	needsTenant, err := needsTenantProfile(ctx, authUser.ID, role)
	if err != nil {
		return nil, err
	}

	return &LoginResult{
		AccessToken:  parsed.AccessToken,
		RefreshToken: parsed.RefreshToken,
		TokenType:    parsed.TokenType,
		ExpiresIn:    parsed.ExpiresIn,
		UserID:       authUser.ID,
		Role:         role,
		NeedsTenant:  needsTenant,
	}, nil
}

func (s *Service) Register(ctx context.Context, input RegisterInput, emailRedirectTo string) (*RegisterResult, error) {
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

	payload := struct {
		Email           string                 `json:"email"`
		Password        string                 `json:"password"`
		EmailRedirectTo string                 `json:"email_redirect_to,omitempty"`
		Data            map[string]interface{} `json:"data"`
	}{
		Email:           input.Email,
		Password:        input.Password,
		EmailRedirectTo: strings.TrimSpace(emailRedirectTo),
		Data: map[string]interface{}{
			"role": role,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal register payload: %w", err)
	}

	requestURL := s.baseURL + "/auth/v1/signup"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, requestURL, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.apiKey)
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request signup endpoint: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read signup response: %w", err)
	}

	var parsed signUpResponse
	if err := json.Unmarshal(responseBody, &parsed); err != nil {
		return nil, fmt.Errorf("decode signup response: %w", err)
	}

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		errMessage := parsed.Description
		if errMessage == "" {
			errMessage = parsed.Msg
		}
		if errMessage == "" {
			errMessage = parsed.Message
		}
		if errMessage == "" {
			errMessage = parsed.Error
		}
		if errMessage == "" {
			errMessage = "could not create account"
		}

		return nil, errors.New(errMessage)
	}

	userID := strings.TrimSpace(parsed.User.ID)
	if userID == "" {
		userID = strings.TrimSpace(parsed.ID)
	}

	if userID == "" {
		return nil, errors.New("signup succeeded but user id is missing")
	}

	accessToken := strings.TrimSpace(parsed.AccessToken)
	if accessToken == "" {
		accessToken = strings.TrimSpace(parsed.Session.AccessToken)
	}

	refreshToken := strings.TrimSpace(parsed.RefreshToken)
	if refreshToken == "" {
		refreshToken = strings.TrimSpace(parsed.Session.RefreshToken)
	}

	tokenType := strings.TrimSpace(parsed.TokenType)
	if tokenType == "" {
		tokenType = strings.TrimSpace(parsed.Session.TokenType)
	}

	expiresIn := parsed.ExpiresIn
	if expiresIn == 0 {
		expiresIn = parsed.Session.ExpiresIn
	}

	fullName := strings.TrimSpace(input.FullName)
	if fullName == "" {
		fullName = defaultFullNameFromEmail(input.Email)
	}

	_, err = database.DB.Exec(ctx,
		`INSERT INTO public.users (id, email, full_name, role) VALUES ($1, $2, $3, $4)
		ON CONFLICT (id) DO UPDATE SET
			email = EXCLUDED.email,
			full_name = EXCLUDED.full_name,
			role = EXCLUDED.role`,
		userID,
		input.Email,
		fullName,
		role,
	)
	if err != nil {
		return nil, fmt.Errorf("store user profile: %w", err)
	}

	return &RegisterResult{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    tokenType,
		ExpiresIn:    expiresIn,
		UserID:       userID,
		Role:         role,
		NeedsTenant:  role == "tenant",
	}, nil
}

func (s *Service) ForgotPassword(ctx context.Context, input ForgotPasswordInput, redirectTo string) error {
	if strings.TrimSpace(input.Email) == "" {
		return errors.New("email is required")
	}

	if strings.TrimSpace(redirectTo) == "" {
		return errors.New("redirect URL is required")
	}

	payload := struct {
		Email      string `json:"email"`
		RedirectTo string `json:"redirect_to"`
	}{
		Email:      strings.TrimSpace(input.Email),
		RedirectTo: strings.TrimSpace(redirectTo),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal forgot password payload: %w", err)
	}

	requestURL := s.baseURL + "/auth/v1/recover"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, requestURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.apiKey)
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("request recover endpoint: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read recover response: %w", err)
	}

	var parsed tokenResponse
	_ = json.Unmarshal(responseBody, &parsed)

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		errMessage := parsed.Description
		if errMessage == "" {
			errMessage = parsed.Msg
		}
		if errMessage == "" {
			errMessage = parsed.Message
		}
		if errMessage == "" {
			errMessage = parsed.Error
		}
		if errMessage == "" {
			errMessage = "could not start password recovery"
		}

		return errors.New(errMessage)
	}

	return nil
}

func (s *Service) UpdatePassword(ctx context.Context, accessToken, newPassword string) error {
	accessToken = strings.TrimSpace(accessToken)
	if accessToken == "" {
		return errors.New("access token is required")
	}

	newPassword = strings.TrimSpace(newPassword)
	if len(newPassword) < 6 {
		return errors.New("password must be at least 6 characters")
	}

	payload := struct {
		Password string `json:"password"`
	}{
		Password: newPassword,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal update password payload: %w", err)
	}

	requestURL := s.baseURL + "/auth/v1/user"
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, requestURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create update password request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.apiKey)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("request update password endpoint: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read update password response: %w", err)
	}

	var parsed tokenResponse
	_ = json.Unmarshal(responseBody, &parsed)

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		errMessage := parsed.Description
		if errMessage == "" {
			errMessage = parsed.Msg
		}
		if errMessage == "" {
			errMessage = parsed.Message
		}
		if errMessage == "" {
			errMessage = parsed.Error
		}
		if errMessage == "" {
			errMessage = "could not update password"
		}

		return errors.New(errMessage)
	}

	return nil
}

func (s *Service) VerifyEmail(ctx context.Context, tokenHash, token, verifyType, email string) (*VerifyResult, error) {
	tokenHash = strings.TrimSpace(tokenHash)
	token = strings.TrimSpace(token)
	if tokenHash == "" && token == "" {
		return nil, errors.New("token is required")
	}

	verifyType = strings.TrimSpace(verifyType)
	if verifyType == "" {
		verifyType = "signup"
	}

	if tokenHash != "" {
		result, err := s.verifyEmailWithPayload(ctx, struct {
			Type      string `json:"type"`
			TokenHash string `json:"token_hash"`
		}{
			Type:      verifyType,
			TokenHash: tokenHash,
		})
		if err == nil {
			return result, nil
		}

		if token == "" {
			return nil, err
		}
	}

	return s.verifyEmailWithPayload(ctx, struct {
		Type  string `json:"type"`
		Token string `json:"token"`
		Email string `json:"email,omitempty"`
	}{
		Type:  verifyType,
		Token: token,
		Email: strings.TrimSpace(email),
	})
}

func (s *Service) verifyEmailWithPayload(ctx context.Context, payload interface{}) (*VerifyResult, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal verify payload: %w", err)
	}

	requestURL := s.baseURL + "/auth/v1/verify"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, requestURL, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create verify request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.apiKey)
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request verify endpoint: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read verify response: %w", err)
	}

	var parsed tokenResponse
	if err := json.Unmarshal(responseBody, &parsed); err != nil {
		return nil, fmt.Errorf("decode verify response: %w", err)
	}

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		errMessage := parsed.Description
		if errMessage == "" {
			errMessage = parsed.Msg
		}
		if errMessage == "" {
			errMessage = parsed.Message
		}
		if errMessage == "" {
			errMessage = parsed.Error
		}
		if errMessage == "" {
			errMessage = "could not verify account"
		}

		return nil, errors.New(errMessage)
	}

	if strings.TrimSpace(parsed.AccessToken) == "" {
		return nil, errors.New("verification succeeded but access token is missing")
	}

	return &VerifyResult{
		AccessToken:  strings.TrimSpace(parsed.AccessToken),
		RefreshToken: strings.TrimSpace(parsed.RefreshToken),
		TokenType:    strings.TrimSpace(parsed.TokenType),
		ExpiresIn:    parsed.ExpiresIn,
	}, nil
}

func (s *Service) fetchUser(ctx context.Context, accessToken string) (*authUserResponse, error) {
	requestURL := s.baseURL + "/auth/v1/user"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create user request: %w", err)
	}

	req.Header.Set("apikey", s.apiKey)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request user endpoint: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read user response: %w", err)
	}

	var parsed authUserResponse
	if err := json.Unmarshal(responseBody, &parsed); err != nil {
		return nil, fmt.Errorf("decode user response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("could not fetch authenticated user")
	}

	if strings.TrimSpace(parsed.ID) == "" {
		return nil, errors.New("authenticated user id is missing")
	}

	return &parsed, nil
}

func ResolveUserIDFromAccessToken(ctx context.Context, service *Service, accessToken string) (string, error) {
	if strings.TrimSpace(accessToken) == "" {
		return "", errors.New("access token is required")
	}

	user, err := service.fetchUser(ctx, accessToken)
	if err != nil {
		return "", err
	}

	return user.ID, nil
}

func LookupRoleByUserID(ctx context.Context, userID string) (string, error) {
	return lookupRoleByUserID(ctx, userID)
}

func NeedsTenantProfile(ctx context.Context, userID, role string) (bool, error) {
	return needsTenantProfile(ctx, userID, role)
}

func lookupRoleByUserID(ctx context.Context, userID string) (string, error) {
	if strings.TrimSpace(userID) == "" {
		return "", errors.New("user id is required")
	}

	var role string
	err := database.DB.QueryRow(ctx, `SELECT role FROM public.users WHERE id = $1`, userID).Scan(&role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", errors.New("user profile not found")
		}
		return "", fmt.Errorf("load user role: %w", err)
	}

	return strings.ToLower(strings.TrimSpace(role)), nil
}

func needsTenantProfile(ctx context.Context, userID, role string) (bool, error) {
	if role != "tenant" {
		return false, nil
	}

	var exists bool
	err := database.DB.QueryRow(
		ctx,
		`SELECT EXISTS (SELECT 1 FROM public.tenant_profiles WHERE user_id = $1)`,
		userID,
	).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check tenant profile: %w", err)
	}

	return !exists, nil
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
