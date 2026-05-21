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

func TestServiceAcceptsProfileRepositoryInterface(t *testing.T) {
	repo := &fakeProfileRepository{}
	svc := NewService(repo)

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
	svc := NewService(&fakeProfileRepository{})

	err := svc.SaveTenantProfile(context.Background(), "owner-1", "owner", profile.TenantProfileInput{})
	if !errors.Is(err, ErrTenantRequired) {
		t.Fatalf("err = %v, want %v", err, ErrTenantRequired)
	}
}
