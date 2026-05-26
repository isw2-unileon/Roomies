package httpserver

import (
	"errors"
	"strings"
)

// ExtractBearerToken returns the token from a Bearer authorization header.
func ExtractBearerToken(authorizationHeader string) (string, error) {
	header := strings.TrimSpace(authorizationHeader)
	if header == "" {
		return "", errors.New("authorization token is required")
	}
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return "", errors.New("authorization header must use Bearer token")
	}
	token := strings.TrimSpace(parts[1])
	if token == "" {
		return "", errors.New("authorization token is required")
	}
	return token, nil
}
