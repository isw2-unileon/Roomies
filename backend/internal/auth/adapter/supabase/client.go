package supabase

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

	authport "github.com/isw2-unileon/proyect-scaffolding/backend/internal/auth/port"
)

// Client implements AuthProvider against Supabase Auth HTTP API.
type Client struct {
	baseURL string
	apiKey  string
	client  *http.Client
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
	ID string `json:"id"`
}

// NewClient creates a Supabase auth client.
func NewClient(baseURL, apiKey string) (*Client, error) {
	if strings.TrimSpace(baseURL) == "" {
		return nil, errors.New("supabase URL is required")
	}
	if strings.TrimSpace(apiKey) == "" {
		return nil, errors.New("supabase publishable key is required")
	}
	return &Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		apiKey:  apiKey,
		client:  &http.Client{Timeout: 12 * time.Second},
	}, nil
}

// Login authenticates via Supabase token endpoint.
func (c *Client) Login(ctx context.Context, input authport.LoginInput) (*authport.LoginResult, error) {
	body, err := json.Marshal(input)
	if err != nil {
		return nil, fmt.Errorf("marshal login payload: %w", err)
	}
	req, err := c.newJSONRequest(ctx, http.MethodPost, c.baseURL+"/auth/v1/token?grant_type=password", body, "")
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request token endpoint: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read token response: %w", err)
	}
	var parsed tokenResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("decode token response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, errors.New(supabaseErrorMessage(parsed.Description, parsed.Msg, parsed.Message, parsed.Error, "invalid credentials"))
	}
	return &authport.LoginResult{
		AccessToken:  parsed.AccessToken,
		RefreshToken: parsed.RefreshToken,
		TokenType:    parsed.TokenType,
		ExpiresIn:    parsed.ExpiresIn,
	}, nil
}

// Register creates account via Supabase signup endpoint.
func (c *Client) Register(ctx context.Context, input authport.RegisterInput, emailRedirectTo string) (*authport.RegisterResult, error) {
	payload := struct {
		Email           string                 `json:"email"`
		Password        string                 `json:"password"`
		EmailRedirectTo string                 `json:"email_redirect_to,omitempty"`
		Data            map[string]interface{} `json:"data"`
	}{
		Email:           input.Email,
		Password:        input.Password,
		EmailRedirectTo: strings.TrimSpace(emailRedirectTo),
		Data:            map[string]interface{}{"role": strings.ToLower(strings.TrimSpace(input.Role))},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal register payload: %w", err)
	}
	req, err := c.newJSONRequest(ctx, http.MethodPost, c.baseURL+"/auth/v1/signup", body, "")
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request signup endpoint: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read signup response: %w", err)
	}
	var parsed signUpResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("decode signup response: %w", err)
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return nil, errors.New(supabaseErrorMessage(parsed.Description, parsed.Msg, parsed.Message, parsed.Error, "could not create account"))
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
	return &authport.RegisterResult{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    tokenType,
		ExpiresIn:    expiresIn,
		UserID:       userID,
	}, nil
}

// ForgotPassword triggers recovery email.
func (c *Client) ForgotPassword(ctx context.Context, input authport.ForgotPasswordInput, redirectTo string) error {
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
	req, err := c.newJSONRequest(ctx, http.MethodPost, c.baseURL+"/auth/v1/recover", body, "")
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("request recover endpoint: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read recover response: %w", err)
	}
	var parsed tokenResponse
	_ = json.Unmarshal(raw, &parsed)
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return errors.New(supabaseErrorMessage(parsed.Description, parsed.Msg, parsed.Message, parsed.Error, "could not start password recovery"))
	}
	return nil
}

// UpdatePassword updates password for authenticated/recovery session.
func (c *Client) UpdatePassword(ctx context.Context, accessToken, newPassword string) error {
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
	}{Password: newPassword}
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal update password payload: %w", err)
	}
	req, err := c.newJSONRequest(ctx, http.MethodPut, c.baseURL+"/auth/v1/user", body, accessToken)
	if err != nil {
		return fmt.Errorf("create update password request: %w", err)
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("request update password endpoint: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read update password response: %w", err)
	}
	var parsed tokenResponse
	_ = json.Unmarshal(raw, &parsed)
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return errors.New(supabaseErrorMessage(parsed.Description, parsed.Msg, parsed.Message, parsed.Error, "could not update password"))
	}
	return nil
}

// VerifyEmail verifies signup/recovery token.
func (c *Client) VerifyEmail(ctx context.Context, tokenHash, token, verifyType, email string) (*authport.VerifyResult, error) {
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
		result, err := c.verifyEmailWithPayload(ctx, struct {
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
	return c.verifyEmailWithPayload(ctx, struct {
		Type  string `json:"type"`
		Token string `json:"token"`
		Email string `json:"email,omitempty"`
	}{
		Type:  verifyType,
		Token: token,
		Email: strings.TrimSpace(email),
	})
}

// FetchUserID resolves user id from access token.
func (c *Client) FetchUserID(ctx context.Context, accessToken string) (string, error) {
	req, err := c.newJSONRequest(ctx, http.MethodGet, c.baseURL+"/auth/v1/user", nil, accessToken)
	if err != nil {
		return "", fmt.Errorf("create user request: %w", err)
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("request user endpoint: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read user response: %w", err)
	}
	var parsed authUserResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", fmt.Errorf("decode user response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return "", errors.New("could not fetch authenticated user")
	}
	if strings.TrimSpace(parsed.ID) == "" {
		return "", errors.New("authenticated user id is missing")
	}
	return parsed.ID, nil
}

func (c *Client) verifyEmailWithPayload(ctx context.Context, payload interface{}) (*authport.VerifyResult, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("marshal verify payload: %w", err)
	}
	req, err := c.newJSONRequest(ctx, http.MethodPost, c.baseURL+"/auth/v1/verify", body, "")
	if err != nil {
		return nil, fmt.Errorf("create verify request: %w", err)
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request verify endpoint: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read verify response: %w", err)
	}
	var parsed tokenResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("decode verify response: %w", err)
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return nil, errors.New(supabaseErrorMessage(parsed.Description, parsed.Msg, parsed.Message, parsed.Error, "could not verify account"))
	}
	if strings.TrimSpace(parsed.AccessToken) == "" {
		return nil, errors.New("verification succeeded but access token is missing")
	}
	return &authport.VerifyResult{
		AccessToken:  parsed.AccessToken,
		RefreshToken: parsed.RefreshToken,
		TokenType:    parsed.TokenType,
		ExpiresIn:    parsed.ExpiresIn,
	}, nil
}

func (c *Client) newJSONRequest(ctx context.Context, method, url string, body []byte, bearerToken string) (*http.Request, error) {
	var reader *bytes.Reader
	if body == nil {
		reader = bytes.NewReader([]byte{})
	} else {
		reader = bytes.NewReader(body)
	}
	req, err := http.NewRequestWithContext(ctx, method, url, reader)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", c.apiKey)
	if strings.TrimSpace(bearerToken) == "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	} else {
		req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(bearerToken))
	}
	return req, nil
}

func supabaseErrorMessage(description, msg, message, errStr, fallback string) string {
	if strings.TrimSpace(description) != "" {
		return description
	}
	if strings.TrimSpace(msg) != "" {
		return msg
	}
	if strings.TrimSpace(message) != "" {
		return message
	}
	if strings.TrimSpace(errStr) != "" {
		return errStr
	}
	return fallback
}
