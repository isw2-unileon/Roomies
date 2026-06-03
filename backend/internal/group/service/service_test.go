package service

import (
	"context"
	"errors"
	"testing"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/group"
)

type fakeGroupRepository struct {
	groupDetail            *group.Group
	hasPendingJoinRequest  bool
	hasRejectedJoinRequest bool
	createdJoinRequestID   string
	createdJoinRequest     bool
}

func (f *fakeGroupRepository) ListTenantGroups(ctx context.Context, userID string, filters group.ListGroupsFilters) ([]group.Group, error) {
	return nil, nil
}

func (f *fakeGroupRepository) GetTenantGroupByID(ctx context.Context, groupID, userID string) (*group.Group, error) {
	return f.groupDetail, nil
}

func (f *fakeGroupRepository) CreateGroup(ctx context.Context, creatorID string, input group.CreateGroupInput) (string, error) {
	return "", nil
}

func (f *fakeGroupRepository) AddGroupOwnerMember(ctx context.Context, groupID, creatorID string) error {
	return nil
}

func (f *fakeGroupRepository) CreatePendingInvitations(ctx context.Context, groupID, invitedBy string, invitedUserIDs []string) error {
	return nil
}

func (f *fakeGroupRepository) ListGroupCandidates(ctx context.Context, currentUserID string, filters group.CandidateFilters) ([]group.Candidate, error) {
	return nil, nil
}

func (f *fakeGroupRepository) GetApartmentCapacity(ctx context.Context, apartmentID string) (int, error) {
	return 0, nil
}

func (f *fakeGroupRepository) CountAcceptedMembersAndPendingInvitations(ctx context.Context, groupID string) (int, error) {
	return 0, nil
}

func (f *fakeGroupRepository) GetInvitationForUser(ctx context.Context, invitationID, userID string) (*group.Invitation, error) {
	return nil, nil
}

func (f *fakeGroupRepository) AcceptInvitation(ctx context.Context, invitationID, userID string) error {
	return nil
}

func (f *fakeGroupRepository) RejectInvitation(ctx context.Context, invitationID, userID string) error {
	return nil
}

func (f *fakeGroupRepository) AddGroupMember(ctx context.Context, groupID, userID, role string) error {
	return nil
}

func (f *fakeGroupRepository) CanUserAcceptGroup(ctx context.Context, groupID, userID string) (bool, error) {
	return false, nil
}

func (f *fakeGroupRepository) AcceptGroupForUser(ctx context.Context, groupID, userID string) error {
	return nil
}

func (f *fakeGroupRepository) HasPendingJoinRequest(ctx context.Context, groupID, requesterUserID string) (bool, error) {
	return f.hasPendingJoinRequest, nil
}

func (f *fakeGroupRepository) HasRejectedJoinRequest(ctx context.Context, groupID, requesterUserID string) (bool, error) {
	return f.hasRejectedJoinRequest, nil
}

func (f *fakeGroupRepository) CreateJoinRequest(ctx context.Context, groupID, requesterUserID string) (string, error) {
	f.createdJoinRequest = true
	if f.createdJoinRequestID == "" {
		f.createdJoinRequestID = "join-request-1"
	}
	return f.createdJoinRequestID, nil
}

func (f *fakeGroupRepository) ListJoinRequests(ctx context.Context, groupID string) ([]group.JoinRequest, error) {
	return nil, nil
}

func (f *fakeGroupRepository) CanUserReviewJoinRequests(ctx context.Context, groupID, userID string) (bool, error) {
	return false, nil
}

func (f *fakeGroupRepository) CanUserVoteJoinRequest(ctx context.Context, requestID, voterUserID string) (bool, error) {
	return false, nil
}

func (f *fakeGroupRepository) VoteJoinRequest(ctx context.Context, requestID, voterUserID, decision string) error {
	return nil
}

func (f *fakeGroupRepository) ResolveJoinRequestStatus(ctx context.Context, requestID string) (string, bool, error) {
	return "", false, nil
}

func (f *fakeGroupRepository) GetJoinRequest(ctx context.Context, requestID string) (*group.JoinRequest, error) {
	return nil, nil
}

func (f *fakeGroupRepository) CancelJoinRequest(ctx context.Context, requestID, requesterUserID string) error {
	return nil
}

func (f *fakeGroupRepository) IsGroupCreator(ctx context.Context, groupID, userID string) (bool, error) {
	return false, nil
}

func (f *fakeGroupRepository) UpdateGroupApartment(ctx context.Context, groupID string, apartmentID *string) error {
	return nil
}

func (f *fakeGroupRepository) FilterExistingTenantIDs(ctx context.Context, userIDs []string) ([]string, error) {
	return nil, nil
}

func TestCreateJoinRequestRejectsPreviouslyRejectedRequest(t *testing.T) {
	repo := &fakeGroupRepository{
		groupDetail:            &group.Group{ID: "group-1", UserRelation: group.UserRelationViewer},
		hasRejectedJoinRequest: true,
	}
	svc := NewService(repo, nil)

	_, err := svc.CreateJoinRequest(context.Background(), "group-1", "tenant-1", "tenant")
	if !errors.Is(err, ErrJoinRequestAlreadyRejected) {
		t.Fatalf("err = %v, want %v", err, ErrJoinRequestAlreadyRejected)
	}
	if repo.createdJoinRequest {
		t.Fatalf("CreateJoinRequest should not be called when a rejected request already exists")
	}
}

func TestCreateJoinRequestAllowsViewerWithoutPreviousRequest(t *testing.T) {
	repo := &fakeGroupRepository{
		groupDetail:          &group.Group{ID: "group-1", UserRelation: group.UserRelationViewer},
		createdJoinRequestID: "join-request-42",
	}
	svc := NewService(repo, nil)

	requestID, err := svc.CreateJoinRequest(context.Background(), "group-1", "tenant-1", "tenant")
	if err != nil {
		t.Fatalf("CreateJoinRequest returned error: %v", err)
	}
	if requestID != "join-request-42" {
		t.Fatalf("requestID = %q, want join-request-42", requestID)
	}
	if !repo.createdJoinRequest {
		t.Fatalf("CreateJoinRequest should be called when no previous rejected request exists")
	}
}
