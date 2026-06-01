package service

import (
	"context"
	"errors"
	"testing"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/application"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
	"github.com/jackc/pgx/v5"
)

type fakeApplicationRepository struct {
	createdApplicationApartmentID string
	createdApplicationTenantID    string
	createdCompatibilityScore     int
	createdGroupApplicationID     string
	createdGroupApartmentID       string
	createdGroupID                string
	hasActiveApplication          bool
	cancelApplicationUpdated      bool
	interestedTenants             []application.InterestedTenantCandidate
	tenantApplications            []application.TenantApplication
	groupContext                  *application.GroupApplicationContext
	latestGroupApplication        *application.Record
	ownerApplications             []application.OwnerApplication
	approveOwnerApplicationOK     bool
	rejectOwnerApplicationOK      bool
	approveOwnerApplicationErr    error
	rejectOwnerApplicationErr     error
}

func (f *fakeApplicationRepository) HasActiveApplication(ctx context.Context, apartmentID, tenantID string) (bool, error) {
	return f.hasActiveApplication, nil
}

func (f *fakeApplicationRepository) GetTenantApplicationForApartment(ctx context.Context, apartmentID, tenantID string) (string, string, error) {
	return "application-1", "PENDING_OWNER", nil
}

func (f *fakeApplicationRepository) CreateTenantApplication(ctx context.Context, apartmentID, tenantID string, compatibilityScore int) (string, error) {
	f.createdApplicationApartmentID = apartmentID
	f.createdApplicationTenantID = tenantID
	f.createdCompatibilityScore = compatibilityScore
	return "application-1", nil
}

func (f *fakeApplicationRepository) CancelTenantApplication(ctx context.Context, applicationID, tenantID string) (bool, error) {
	return f.cancelApplicationUpdated, nil
}

func (f *fakeApplicationRepository) ListInterestedTenants(ctx context.Context, apartmentID string) ([]application.InterestedTenantCandidate, error) {
	if f.interestedTenants != nil {
		return f.interestedTenants, nil
	}
	return []application.InterestedTenantCandidate{{
		InterestedTenant: application.InterestedTenant{UserID: "tenant-2", Name: "Laura", Age: 21, Studies: "Veterinaria"},
		BudgetMin:        320,
		BudgetMax:        460,
		PreferredArea:    "centro",
		Pets:             false,
		Smoking:          false,
		NoiseLevel:       "moderate",
		Cleanliness:      "normal",
		WorkSchedule:     "flexible",
	}}, nil
}

func (f *fakeApplicationRepository) ListTenantApplications(ctx context.Context, tenantID string) ([]application.TenantApplication, error) {
	if f.tenantApplications != nil {
		return f.tenantApplications, nil
	}
	return []application.TenantApplication{{
		ID:            "application-1",
		ApartmentID:   "apartment-1",
		PropertyTitle: "Flat",
		Status:        "PENDING_OWNER",
		CreatedAt:     "2026-05-23",
	}}, nil
}

func (f *fakeApplicationRepository) GetGroupApplicationContext(ctx context.Context, groupID, userID string) (*application.GroupApplicationContext, error) {
	return f.groupContext, nil
}

func (f *fakeApplicationRepository) GetLatestGroupApplicationForApartment(ctx context.Context, apartmentID, groupID string) (*application.Record, error) {
	return f.latestGroupApplication, nil
}

func (f *fakeApplicationRepository) CreateGroupApplication(ctx context.Context, apartmentID, groupID string) (string, error) {
	f.createdGroupApartmentID = apartmentID
	f.createdGroupID = groupID
	f.createdGroupApplicationID = "group-application-1"
	f.latestGroupApplication = &application.Record{
		ID:          f.createdGroupApplicationID,
		ApartmentID: apartmentID,
		GroupID:     groupID,
		Type:        "group",
		Status:      "PENDING_OWNER",
		CreatedAt:   "2026-06-01T12:00:00Z",
	}
	return f.createdGroupApplicationID, nil
}

func (f *fakeApplicationRepository) ListOwnerApplications(ctx context.Context, ownerID string) ([]application.OwnerApplication, error) {
	return f.ownerApplications, nil
}

func (f *fakeApplicationRepository) GetOwnerApplicationByID(ctx context.Context, applicationID, ownerID string) (*application.OwnerApplication, error) {
	for idx := range f.ownerApplications {
		if f.ownerApplications[idx].ID == applicationID {
			return &f.ownerApplications[idx], nil
		}
	}
	return nil, nil
}

func (f *fakeApplicationRepository) ApproveOwnerApplication(ctx context.Context, applicationID, ownerID string) (bool, error) {
	if f.approveOwnerApplicationErr != nil {
		return false, f.approveOwnerApplicationErr
	}
	return f.approveOwnerApplicationOK, nil
}

func (f *fakeApplicationRepository) RejectOwnerApplication(ctx context.Context, applicationID, ownerID string) (bool, error) {
	if f.rejectOwnerApplicationErr != nil {
		return false, f.rejectOwnerApplicationErr
	}
	return f.rejectOwnerApplicationOK, nil
}

type fakeApartmentReader struct {
	apartment *apartment.Apartment
}

func (f fakeApartmentReader) GetApartmentByID(ctx context.Context, apartmentID string) (*apartment.Apartment, error) {
	if f.apartment != nil {
		return f.apartment, nil
	}
	return &apartment.Apartment{ID: apartmentID, OwnerID: "owner-1", BaseRent: 400, Area: "centro", TotalSpots: 3, OccupiedSpots: 1, Status: apartment.StatusAvailable}, nil
}

func (f fakeApartmentReader) GetApartmentRules(ctx context.Context, apartmentID string) (*apartment.Rules, error) {
	allowed := false
	return &apartment.Rules{
		SmokingAllowed:         &allowed,
		PetsAllowed:            &allowed,
		MaxNoiseLevel:          "moderate",
		CleanlinessExpectation: "normal",
		PreferredSchedule:      "flexible",
	}, nil
}

type fakeProfileReader struct{}

func (f fakeProfileReader) GetTenantProfileByUserID(ctx context.Context, userID string) (*profile.TenantProfile, error) {
	return &profile.TenantProfile{
		UserID:        userID,
		BudgetMin:     300,
		BudgetMax:     450,
		PreferredArea: "centro",
		Pets:          false,
		Smoking:       false,
		NoiseLevel:    "moderate",
		Cleanliness:   "normal",
		WorkSchedule:  "flexible",
	}, nil
}

func TestApplyToApartmentCreatesTenantApplication(t *testing.T) {
	repo := &fakeApplicationRepository{}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	applicationID, err := svc.ApplyToApartment(context.Background(), "apartment-1", "tenant-1", "tenant")
	if err != nil {
		t.Fatalf("ApplyToApartment returned error: %v", err)
	}
	if applicationID != "application-1" {
		t.Fatalf("applicationID = %q, want application-1", applicationID)
	}
	if repo.createdCompatibilityScore <= 0 {
		t.Fatalf("createdCompatibilityScore = %d, want > 0", repo.createdCompatibilityScore)
	}
}

func TestApplyToApartmentRejectsDuplicateActiveApplication(t *testing.T) {
	repo := &fakeApplicationRepository{hasActiveApplication: true}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	_, err := svc.ApplyToApartment(context.Background(), "apartment-1", "tenant-1", "tenant")
	if !errors.Is(err, ErrApplicationAlreadyExists) {
		t.Fatalf("err = %v, want %v", err, ErrApplicationAlreadyExists)
	}
}

func TestListInterestedTenantsCalculatesCompatibility(t *testing.T) {
	repo := &fakeApplicationRepository{}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	result, err := svc.ListInterestedTenants(context.Background(), "apartment-1", "tenant-1", "tenant")
	if err != nil {
		t.Fatalf("ListInterestedTenants returned error: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("len(result) = %d, want 1", len(result))
	}
	if result[0].Compatibility <= 0 {
		t.Fatalf("Compatibility = %d, want > 0", result[0].Compatibility)
	}
}

func TestListInterestedTenantsAllowsOwnerForOwnApartment(t *testing.T) {
	repo := &fakeApplicationRepository{}
	reader := fakeApartmentReader{apartment: &apartment.Apartment{ID: "apartment-1", OwnerID: "owner-1", BaseRent: 400, Area: "centro", TotalSpots: 3, Status: "HIDDEN"}}
	svc := NewService(repo, reader, fakeProfileReader{}, nil)

	result, err := svc.ListInterestedTenants(context.Background(), "apartment-1", "owner-1", "owner")
	if err != nil {
		t.Fatalf("ListInterestedTenants returned error: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("len(result) = %d, want 1", len(result))
	}
}

func TestListInterestedTenantsRejectsOwnerForOtherApartment(t *testing.T) {
	repo := &fakeApplicationRepository{}
	reader := fakeApartmentReader{apartment: &apartment.Apartment{ID: "apartment-1", OwnerID: "owner-2", BaseRent: 400, Area: "centro", TotalSpots: 3, Status: apartment.StatusAvailable}}
	svc := NewService(repo, reader, fakeProfileReader{}, nil)

	_, err := svc.ListInterestedTenants(context.Background(), "apartment-1", "owner-1", "owner")
	if !errors.Is(err, ErrInterestedTenantsForbidden) {
		t.Fatalf("err = %v, want %v", err, ErrInterestedTenantsForbidden)
	}
}

func TestListInterestedTenantsHidesClosedApartmentFromTenant(t *testing.T) {
	repo := &fakeApplicationRepository{}
	reader := fakeApartmentReader{apartment: &apartment.Apartment{ID: "apartment-1", OwnerID: "owner-1", BaseRent: 400, Area: "centro", TotalSpots: 3, Status: "CLOSED"}}
	svc := NewService(repo, reader, fakeProfileReader{}, nil)

	_, err := svc.ListInterestedTenants(context.Background(), "apartment-1", "tenant-1", "tenant")
	if !errors.Is(err, ErrApartmentNotFound) {
		t.Fatalf("err = %v, want %v", err, ErrApartmentNotFound)
	}
}

func TestListInterestedTenantsRejectsUnknownRole(t *testing.T) {
	repo := &fakeApplicationRepository{}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	_, err := svc.ListInterestedTenants(context.Background(), "apartment-1", "user-1", "admin")
	if !errors.Is(err, ErrInterestedTenantsForbidden) {
		t.Fatalf("err = %v, want %v", err, ErrInterestedTenantsForbidden)
	}
}

func TestListTenantApplicationsMapsStatus(t *testing.T) {
	repo := &fakeApplicationRepository{}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	result, err := svc.ListTenantApplications(context.Background(), "tenant-1", "tenant")
	if err != nil {
		t.Fatalf("ListTenantApplications returned error: %v", err)
	}
	if len(result) != 1 {
		t.Fatalf("len(result) = %d, want 1", len(result))
	}
	if result[0].Status != "pending" {
		t.Fatalf("Status = %q, want pending", result[0].Status)
	}
}

func TestApplyGroupToAssignedApartmentCreatesGroupApplication(t *testing.T) {
	repo := &fakeApplicationRepository{groupContext: &application.GroupApplicationContext{
		GroupID:         "group-1",
		ApartmentID:     "apartment-1",
		CreatedBy:       "tenant-1",
		IsCreator:       true,
		IsMember:        true,
		IsFullyAccepted: true,
	}}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	record, created, err := svc.ApplyGroupToAssignedApartment(context.Background(), "group-1", "tenant-1", "tenant")
	if err != nil {
		t.Fatalf("ApplyGroupToAssignedApartment returned error: %v", err)
	}
	if !created {
		t.Fatal("created = false, want true")
	}
	if record == nil || record.ID == "" {
		t.Fatal("record is nil or empty")
	}
	if repo.createdGroupApartmentID != "apartment-1" || repo.createdGroupID != "group-1" {
		t.Fatalf("created group application = (%q,%q), want (apartment-1,group-1)", repo.createdGroupApartmentID, repo.createdGroupID)
	}
}

func TestApplyGroupToAssignedApartmentReturnsExistingActiveApplication(t *testing.T) {
	existing := &application.Record{ID: "application-9", ApartmentID: "apartment-1", GroupID: "group-1", Type: "group", Status: "PENDING_OWNER", CreatedAt: "2026-06-01T12:00:00Z"}
	repo := &fakeApplicationRepository{groupContext: &application.GroupApplicationContext{
		GroupID:         "group-1",
		ApartmentID:     "apartment-1",
		CreatedBy:       "tenant-1",
		IsCreator:       true,
		IsMember:        true,
		IsFullyAccepted: true,
	}, latestGroupApplication: existing}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	record, created, err := svc.ApplyGroupToAssignedApartment(context.Background(), "group-1", "tenant-1", "tenant")
	if err != nil {
		t.Fatalf("ApplyGroupToAssignedApartment returned error: %v", err)
	}
	if created {
		t.Fatal("created = true, want false")
	}
	if record == nil || record.ID != existing.ID {
		t.Fatalf("record = %+v, want existing application", record)
	}
	if repo.createdGroupApplicationID != "" {
		t.Fatalf("createdGroupApplicationID = %q, want empty", repo.createdGroupApplicationID)
	}
}

func TestApplyGroupToAssignedApartmentAllowsResubmittingRejectedApplication(t *testing.T) {
	repo := &fakeApplicationRepository{groupContext: &application.GroupApplicationContext{
		GroupID:         "group-1",
		ApartmentID:     "apartment-1",
		CreatedBy:       "tenant-1",
		IsCreator:       true,
		IsMember:        true,
		IsFullyAccepted: true,
	}, latestGroupApplication: &application.Record{ID: "application-9", ApartmentID: "apartment-1", GroupID: "group-1", Type: "group", Status: "REJECTED_BY_OWNER", CreatedAt: "2026-06-01T12:00:00Z"}}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	record, created, err := svc.ApplyGroupToAssignedApartment(context.Background(), "group-1", "tenant-1", "tenant")
	if err != nil {
		t.Fatalf("ApplyGroupToAssignedApartment returned error: %v", err)
	}
	if !created {
		t.Fatal("created = false, want true")
	}
	if record == nil || record.ID != "group-application-1" {
		t.Fatalf("record = %+v, want new application", record)
	}
}

func TestApplyGroupToAssignedApartmentRejectsNonCreator(t *testing.T) {
	repo := &fakeApplicationRepository{groupContext: &application.GroupApplicationContext{
		GroupID:         "group-1",
		ApartmentID:     "apartment-1",
		CreatedBy:       "tenant-2",
		IsCreator:       false,
		IsMember:        true,
		IsFullyAccepted: true,
	}}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	_, _, err := svc.ApplyGroupToAssignedApartment(context.Background(), "group-1", "tenant-1", "tenant")
	if !errors.Is(err, ErrGroupApplicationForbidden) {
		t.Fatalf("err = %v, want %v", err, ErrGroupApplicationForbidden)
	}
}

func TestApplyGroupToAssignedApartmentRejectsGroupWithoutApartment(t *testing.T) {
	repo := &fakeApplicationRepository{groupContext: &application.GroupApplicationContext{
		GroupID:         "group-1",
		CreatedBy:       "tenant-1",
		IsCreator:       true,
		IsMember:        true,
		IsFullyAccepted: true,
	}}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	_, _, err := svc.ApplyGroupToAssignedApartment(context.Background(), "group-1", "tenant-1", "tenant")
	if !errors.Is(err, ErrGroupApartmentRequired) {
		t.Fatalf("err = %v, want %v", err, ErrGroupApartmentRequired)
	}
}

func TestApplyGroupToAssignedApartmentRejectsGroupNotReady(t *testing.T) {
	repo := &fakeApplicationRepository{groupContext: &application.GroupApplicationContext{
		GroupID:         "group-1",
		ApartmentID:     "apartment-1",
		CreatedBy:       "tenant-1",
		IsCreator:       true,
		IsMember:        true,
		IsFullyAccepted: false,
	}}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	_, _, err := svc.ApplyGroupToAssignedApartment(context.Background(), "group-1", "tenant-1", "tenant")
	if !errors.Is(err, ErrGroupNotReady) {
		t.Fatalf("err = %v, want %v", err, ErrGroupNotReady)
	}
}

func TestApproveOwnerApplicationMapsNotFound(t *testing.T) {
	repo := &fakeApplicationRepository{approveOwnerApplicationErr: pgx.ErrNoRows}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	err := svc.ApproveOwnerApplication(context.Background(), "application-1", "owner-1", "owner")
	if !errors.Is(err, ErrOwnerApplicationNotFound) {
		t.Fatalf("err = %v, want %v", err, ErrOwnerApplicationNotFound)
	}
}

func TestRejectOwnerApplicationRejectsAlreadyHandled(t *testing.T) {
	repo := &fakeApplicationRepository{rejectOwnerApplicationOK: false}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	err := svc.RejectOwnerApplication(context.Background(), "application-1", "owner-1", "owner")
	if !errors.Is(err, ErrOwnerApplicationAlreadyHandled) {
		t.Fatalf("err = %v, want %v", err, ErrOwnerApplicationAlreadyHandled)
	}
}

func TestCancelTenantApplicationRejectsNotCancelable(t *testing.T) {
	repo := &fakeApplicationRepository{cancelApplicationUpdated: false}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	err := svc.CancelTenantApplication(context.Background(), "application-1", "tenant-1", "tenant")
	if !errors.Is(err, ErrApplicationNotCancelable) {
		t.Fatalf("err = %v, want %v", err, ErrApplicationNotCancelable)
	}
}

func TestCancelTenantApplicationUpdatesPendingApplication(t *testing.T) {
	repo := &fakeApplicationRepository{cancelApplicationUpdated: true}
	svc := NewService(repo, fakeApartmentReader{}, fakeProfileReader{}, nil)

	err := svc.CancelTenantApplication(context.Background(), "application-1", "tenant-1", "tenant")
	if err != nil {
		t.Fatalf("CancelTenantApplication returned error: %v", err)
	}
}
