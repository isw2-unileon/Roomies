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

type RegisterInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type LoginResult struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

type RegisterResult struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
	UserID       string `json:"user_id"`
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
	Error        string `json:"error"`
	Description  string `json:"error_description"`
	Message      string `json:"message"`
	Msg          string `json:"msg"`
	User         struct {
		ID string `json:"id"`
	} `json:"user"`
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

	return &LoginResult{
		AccessToken:  parsed.AccessToken,
		RefreshToken: parsed.RefreshToken,
		TokenType:    parsed.TokenType,
		ExpiresIn:    parsed.ExpiresIn,
	}, nil
}

func (s *Service) Register(ctx context.Context, input RegisterInput) (*RegisterResult, error) {
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
		Email    string                 `json:"email"`
		Password string                 `json:"password"`
		Data     map[string]interface{} `json:"data"`
	}{
		Email:    input.Email,
		Password: input.Password,
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

	return &RegisterResult{
		AccessToken:  parsed.AccessToken,
		RefreshToken: parsed.RefreshToken,
		TokenType:    parsed.TokenType,
		ExpiresIn:    parsed.ExpiresIn,
		UserID:       parsed.User.ID,
	}, nil
}
