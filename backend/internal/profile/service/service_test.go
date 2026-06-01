package service

import (
	"context"
	"errors"
	"testing"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
)

type fakeProfileRepository struct {
	savedUserID string
	savedInput  profile.TenantProfileInput
	personal    *profile.TenantPersonalProfile
	savedPerson profile.TenantPersonalProfileInput
}

type fakeImageStorage struct {
	signedURL           string
	uploadedBucket      string
	uploadedPath        string
	uploadedContentType string
	uploadedData        []byte
}

func (f *fakeProfileRepository) LookupRoleByUserID(ctx context.Context, userID string) (string, error) {
	return "tenant", nil
}

func (f *fakeProfileRepository) NeedsTenantProfile(ctx context.Context, userID, role string) (bool, error) {
	return role == "tenant", nil
}

func (f *fakeProfileRepository) UpsertTenantProfile(ctx context.Context, userID string, input profile.TenantProfileInput) error {
	f.savedUserID = userID
	f.savedInput = input
	return nil
}

func (f *fakeProfileRepository) GetTenantPersonalProfile(ctx context.Context, userID string) (*profile.TenantPersonalProfile, error) {
	return f.personal, nil
}

func (f *fakeProfileRepository) UpdateTenantPersonalProfile(ctx context.Context, userID string, input profile.TenantPersonalProfileInput) error {
	f.savedUserID = userID
	f.savedPerson = input
	return nil
}

func (f *fakeProfileRepository) UpdateTenantAvatarURL(ctx context.Context, userID, avatarURL string) error {
	f.savedUserID = userID
	f.savedPerson.AvatarURL = avatarURL
	return nil
}

func (f *fakeImageStorage) UploadObject(ctx context.Context, bucket, objectPath, contentType string, fileData []byte) error {
	f.uploadedBucket = bucket
	f.uploadedPath = objectPath
	f.uploadedContentType = contentType
	f.uploadedData = fileData
	return nil
}

func (f *fakeImageStorage) CreateSignedURL(ctx context.Context, bucket, objectPath string, expiresIn int) (string, error) {
	if f.signedURL != "" {
		return f.signedURL, nil
	}
	return "https://example.test/storage/v1/object/sign/" + bucket + "/" + objectPath + "?token=abc", nil
}

func TestServiceAcceptsProfileRepositoryInterface(t *testing.T) {
	repo := &fakeProfileRepository{}
	svc := NewService(repo, nil)

	input := profile.TenantProfileInput{
		BudgetMin:     300,
		BudgetMax:     500,
		PreferredArea: "Center",
		MoveInDate:    "2026-06-01",
		WorkSchedule:  "morning",
		NoiseLevel:    "quiet",
		Cleanliness:   "normal",
	}
	if err := svc.SaveTenantProfile(context.Background(), "user-1", "tenant", input); err != nil {
		t.Fatalf("SaveTenantProfile returned error: %v", err)
	}
	if repo.savedUserID != "user-1" {
		t.Fatalf("savedUserID = %q, want user-1", repo.savedUserID)
	}
}

func TestSaveTenantProfileRejectsNonTenantRole(t *testing.T) {
	svc := NewService(&fakeProfileRepository{}, nil)

	err := svc.SaveTenantProfile(context.Background(), "owner-1", "owner", profile.TenantProfileInput{})
	if !errors.Is(err, ErrTenantRequired) {
		t.Fatalf("err = %v, want %v", err, ErrTenantRequired)
	}
}

func TestGetTenantPersonalProfileReturnsRepositoryData(t *testing.T) {
	repo := &fakeProfileRepository{personal: &profile.TenantPersonalProfile{UserID: "user-1", FullName: "Jairo", Email: "jairo@example.test", AvatarURL: "avatars/user-1/profile.png"}}
	storage := &fakeImageStorage{signedURL: "https://example.test/avatar-signed.png"}
	svc := NewService(repo, storage)

	personal, err := svc.GetTenantPersonalProfile(context.Background(), "user-1", "tenant")
	if err != nil {
		t.Fatalf("GetTenantPersonalProfile returned error: %v", err)
	}
	if personal == nil || personal.Email != "jairo@example.test" {
		t.Fatalf("personal = %#v, want email jairo@example.test", personal)
	}
	if personal.AvatarURL != "https://example.test/avatar-signed.png" {
		t.Fatalf("avatarURL = %q, want signed URL", personal.AvatarURL)
	}
}

func TestSaveTenantPersonalProfileRejectsNonTenantRole(t *testing.T) {
	svc := NewService(&fakeProfileRepository{}, nil)

	err := svc.SaveTenantPersonalProfile(context.Background(), "owner-1", "owner", profile.TenantPersonalProfileInput{})
	if !errors.Is(err, ErrTenantRequired) {
		t.Fatalf("err = %v, want %v", err, ErrTenantRequired)
	}
}

func TestUploadTenantAvatarStoresPublicURL(t *testing.T) {
	repo := &fakeProfileRepository{}
	storage := &fakeImageStorage{signedURL: "https://example.test/avatar.png"}
	svc := NewService(repo, storage)

	avatarURL, err := svc.UploadTenantAvatar(context.Background(), "user-1", "tenant", "avatar.png", "image/png", []byte("image"))
	if err != nil {
		t.Fatalf("UploadTenantAvatar returned error: %v", err)
	}
	if avatarURL != "https://example.test/avatar.png" {
		t.Fatalf("avatarURL = %q, want https://example.test/avatar.png", avatarURL)
	}
	if storage.uploadedBucket != "profile-avatars" {
		t.Fatalf("bucket = %q, want profile-avatars", storage.uploadedBucket)
	}
	if repo.savedPerson.AvatarURL != "avatars/user-1/profile.png" {
		t.Fatalf("saved avatar = %q", repo.savedPerson.AvatarURL)
	}
}
