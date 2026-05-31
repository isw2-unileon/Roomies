package service

import (
	"context"
	"errors"
	"fmt"
	"mime"
	"path/filepath"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
)

const profileAvatarsBucket = "profile-avatars"

type imageStorage interface {
	UploadObject(ctx context.Context, bucket, objectPath, contentType string, fileData []byte) error
	PublicObjectURL(bucket, objectPath string) string
}

type repository interface {
	LookupRoleByUserID(ctx context.Context, userID string) (string, error)
	NeedsTenantProfile(ctx context.Context, userID, role string) (bool, error)
	UpsertTenantProfile(ctx context.Context, userID string, input profile.TenantProfileInput) error
	GetTenantPersonalProfile(ctx context.Context, userID string) (*profile.TenantPersonalProfile, error)
	UpdateTenantPersonalProfile(ctx context.Context, userID string, input profile.TenantPersonalProfileInput) error
	UpdateTenantAvatarURL(ctx context.Context, userID, avatarURL string) error
}

// ErrTenantRequired is returned when a non-tenant tries to save a tenant profile.
var ErrTenantRequired = errors.New("tenant role is required")

// Service contains profile use cases.
type Service struct {
	repo         repository
	imageStorage imageStorage
}

// NewService creates the profile service.
func NewService(repo repository, imageStorage imageStorage) *Service {
	return &Service{repo: repo, imageStorage: imageStorage}
}

// LookupRoleByUserID resolves the app role for a user.
func (s *Service) LookupRoleByUserID(ctx context.Context, userID string) (string, error) {
	return s.repo.LookupRoleByUserID(ctx, userID)
}

// NeedsTenantProfile checks if tenant onboarding is pending.
func (s *Service) NeedsTenantProfile(ctx context.Context, userID, role string) (bool, error) {
	return s.repo.NeedsTenantProfile(ctx, userID, role)
}

// SaveTenantProfile upserts tenant onboarding/profile data.
func (s *Service) SaveTenantProfile(ctx context.Context, userID, role string, input profile.TenantProfileInput) error {
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return ErrTenantRequired
	}
	return s.repo.UpsertTenantProfile(ctx, userID, input)
}

// GetTenantPersonalProfile returns editable account data for a tenant user.
func (s *Service) GetTenantPersonalProfile(ctx context.Context, userID, role string) (*profile.TenantPersonalProfile, error) {
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return nil, ErrTenantRequired
	}
	return s.repo.GetTenantPersonalProfile(ctx, userID)
}

// SaveTenantPersonalProfile updates editable account fields for a tenant user.
func (s *Service) SaveTenantPersonalProfile(ctx context.Context, userID, role string, input profile.TenantPersonalProfileInput) error {
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return ErrTenantRequired
	}
	return s.repo.UpdateTenantPersonalProfile(ctx, userID, input)
}

// UploadTenantAvatar stores the avatar in storage and persists its public URL.
func (s *Service) UploadTenantAvatar(ctx context.Context, userID, role, filename, contentType string, fileData []byte) (string, error) {
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return "", ErrTenantRequired
	}
	if s.imageStorage == nil {
		return "", errors.New("image upload is not configured")
	}
	if strings.TrimSpace(userID) == "" {
		return "", errors.New("user id is required")
	}
	if len(fileData) == 0 {
		return "", errors.New("avatar file is required")
	}
	if len(fileData) > 2_000_000 {
		return "", errors.New("avatar file exceeds maximum size of 2MB")
	}

	ext := strings.ToLower(strings.TrimSpace(filepath.Ext(filename)))
	if ext == "" {
		exts, _ := mime.ExtensionsByType(contentType)
		if len(exts) > 0 {
			ext = strings.ToLower(strings.TrimSpace(exts[0]))
		}
	}
	if ext == "" {
		ext = ".jpg"
	}
	if ext != ".png" && ext != ".jpg" && ext != ".jpeg" && ext != ".webp" {
		return "", fmt.Errorf("avatar file type %q is not supported", ext)
	}
	if strings.TrimSpace(contentType) == "" {
		contentType = mime.TypeByExtension(ext)
	}
	if !strings.HasPrefix(strings.ToLower(strings.TrimSpace(contentType)), "image/") {
		return "", errors.New("avatar file must be an image")
	}

	objectPath := fmt.Sprintf("avatars/%s/profile%s", strings.TrimSpace(userID), ext)
	if err := s.imageStorage.UploadObject(ctx, profileAvatarsBucket, objectPath, contentType, fileData); err != nil {
		return "", fmt.Errorf("upload tenant avatar: %w", err)
	}
	avatarURL := s.imageStorage.PublicObjectURL(profileAvatarsBucket, objectPath)
	if avatarURL == "" {
		return "", errors.New("could not build public avatar URL")
	}
	if err := s.repo.UpdateTenantAvatarURL(ctx, userID, avatarURL); err != nil {
		return "", err
	}
	return avatarURL, nil
}
