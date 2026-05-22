package supabase

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCreateSignedURLRequestsStorageSignEndpoint(t *testing.T) {
	var gotPath string
	var gotAPIKey string
	var gotAuthorization string
	var gotExpiresIn int

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.EscapedPath()
		gotAPIKey = r.Header.Get("apikey")
		gotAuthorization = r.Header.Get("Authorization")

		var payload struct {
			ExpiresIn int `json:"expiresIn"`
		}
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			t.Fatalf("decode request body: %v", err)
		}
		gotExpiresIn = payload.ExpiresIn

		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"signedURL":"/object/sign/apartment-photos/apartments/flat%20one.jpg?token=abc"}`))
	}))
	t.Cleanup(server.Close)

	client, err := NewClient(server.URL, "secret-key")
	if err != nil {
		t.Fatalf("NewClient returned error: %v", err)
	}

	signedURL, err := client.CreateSignedURL(context.Background(), "apartment-photos", "apartments/flat one.jpg", 3600)
	if err != nil {
		t.Fatalf("CreateSignedURL returned error: %v", err)
	}

	if gotPath != "/storage/v1/object/sign/apartment-photos/apartments/flat%20one.jpg" {
		t.Fatalf("path = %q, want escaped storage sign endpoint", gotPath)
	}
	if gotAPIKey != "secret-key" {
		t.Fatalf("apikey = %q, want secret-key", gotAPIKey)
	}
	if gotAuthorization != "Bearer secret-key" {
		t.Fatalf("Authorization = %q, want Bearer secret-key", gotAuthorization)
	}
	if gotExpiresIn != 3600 {
		t.Fatalf("expiresIn = %d, want 3600", gotExpiresIn)
	}
	wantSignedURL := server.URL + "/storage/v1/object/sign/apartment-photos/apartments/flat%20one.jpg?token=abc"
	if signedURL != wantSignedURL {
		t.Fatalf("signedURL = %q, want %q", signedURL, wantSignedURL)
	}
}

func TestCreateSignedURLDoesNotDuplicateStoragePrefix(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"signedURL":"/storage/v1/object/sign/apartment-photos/photo.jpg?token=abc"}`))
	}))
	t.Cleanup(server.Close)

	client, err := NewClient(server.URL, "secret-key")
	if err != nil {
		t.Fatalf("NewClient returned error: %v", err)
	}

	signedURL, err := client.CreateSignedURL(context.Background(), "apartment-photos", "photo.jpg", 3600)
	if err != nil {
		t.Fatalf("CreateSignedURL returned error: %v", err)
	}

	wantSignedURL := server.URL + "/storage/v1/object/sign/apartment-photos/photo.jpg?token=abc"
	if signedURL != wantSignedURL {
		t.Fatalf("signedURL = %q, want %q", signedURL, wantSignedURL)
	}
}
