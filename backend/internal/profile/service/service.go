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
	CreateSignedURL(ctx context.Context, bucket, path string, expiresIn int) (string, error)
}

const signedAvatarURLTTLSeconds = 3600

type repository interface {
	LookupRoleByUserID(ctx context.Context, userID string) (string, error)
	NeedsTenantProfile(ctx context.Context, userID, role string) (bool, error)
	UpsertTenantProfile(ctx context.Context, userID string, input profile.TenantProfileInput) error
	GetTenantProfileByUserID(ctx context.Context, userID string) (*profile.TenantProfileInput, error)
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

// GetTenantProfileByUserID returns the preference profile for any tenant user.
func (s *Service) GetTenantProfileByUserID(ctx context.Context, userID string) (*profile.TenantProfileInput, error) {
	return s.repo.GetTenantProfileByUserID(ctx, userID)
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
	personalProfile, err := s.repo.GetTenantPersonalProfile(ctx, userID)
	if err != nil || personalProfile == nil {
		return personalProfile, err
	}
	result := *personalProfile
	result.AvatarURL, err = s.signedAvatarURL(ctx, personalProfile.AvatarURL)
	if err != nil {
		return nil, err
	}
	return &result, nil
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
	if err := s.validateTenantAvatarUpload(userID, role, fileData); err != nil {
		return "", err
	}

	ext, err := resolveAvatarExtension(filename, contentType)
	if err != nil {
		return "", err
	}
	contentType, err = resolveAvatarContentType(contentType, ext)
	if err != nil {
		return "", err
	}
	objectPath := buildAvatarObjectPath(userID, ext)
	if err := s.imageStorage.UploadObject(ctx, profileAvatarsBucket, objectPath, contentType, fileData); err != nil {
		return "", fmt.Errorf("upload tenant avatar: %w", err)
	}
	if err := s.repo.UpdateTenantAvatarURL(ctx, userID, objectPath); err != nil {
		return "", err
	}
	avatarURL, err := s.signedAvatarURL(ctx, objectPath)
	if err != nil {
		return "", err
	}
	return avatarURL, nil
}

func (s *Service) validateTenantAvatarUpload(userID, role string, fileData []byte) error {
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return ErrTenantRequired
	}
	if s.imageStorage == nil {
		return errors.New("image upload is not configured")
	}
	if strings.TrimSpace(userID) == "" {
		return errors.New("user id is required")
	}
	if len(fileData) == 0 {
		return errors.New("avatar file is required")
	}
	if len(fileData) > 2_000_000 {
		return errors.New("avatar file exceeds maximum size of 2MB")
	}
	return nil
}

func resolveAvatarExtension(filename, contentType string) (string, error) {
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
	return ext, nil
}

func resolveAvatarContentType(contentType, ext string) (string, error) {
	if strings.TrimSpace(contentType) == "" {
		contentType = mime.TypeByExtension(ext)
	}
	contentType = strings.ToLower(strings.TrimSpace(contentType))
	if !strings.HasPrefix(contentType, "image/") {
		return "", errors.New("avatar file must be an image")
	}
	return contentType, nil
}

func buildAvatarObjectPath(userID, ext string) string {
	return fmt.Sprintf("avatars/%s/profile%s", strings.TrimSpace(userID), ext)
}

func (s *Service) signedAvatarURL(ctx context.Context, avatarValue string) (string, error) {
	avatarValue = strings.TrimSpace(avatarValue)
	if avatarValue == "" {
		return "", nil
	}
	if strings.HasPrefix(avatarValue, "http://") || strings.HasPrefix(avatarValue, "https://") || strings.HasPrefix(avatarValue, "data:image/") {
		return avatarValue, nil
	}
	if s.imageStorage == nil {
		return "", nil
	}
	signedURL, err := s.imageStorage.CreateSignedURL(ctx, profileAvatarsBucket, avatarValue, signedAvatarURLTTLSeconds)
	if err != nil {
		return "", fmt.Errorf("sign tenant avatar: %w", err)
	}
	return signedURL, nil
}
