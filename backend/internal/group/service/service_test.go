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
	createdGroupID         string
	isGroupCreator         bool
	updatedApartmentID     *string
	ownerMemberAdded       bool
	acceptedGroupForUserID string
	deletedGroupID         string
}

func (f *fakeGroupRepository) ListTenantGroups(ctx context.Context, userID string, filters group.ListGroupsFilters) ([]group.Group, error) {
	return nil, nil
}

func (f *fakeGroupRepository) GetTenantGroupByID(ctx context.Context, groupID, userID string) (*group.Group, error) {
	return f.groupDetail, nil
}

func (f *fakeGroupRepository) CreateGroup(ctx context.Context, creatorID string, input group.CreateGroupInput) (string, error) {
	if f.createdGroupID == "" {
		f.createdGroupID = "group-1"
	}
	return f.createdGroupID, nil
}

func (f *fakeGroupRepository) AddGroupOwnerMember(ctx context.Context, groupID, creatorID string) error {
	f.ownerMemberAdded = true
	return nil
}

func (f *fakeGroupRepository) DeleteGroup(ctx context.Context, groupID string) error {
	f.deletedGroupID = groupID
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
	f.acceptedGroupForUserID = userID
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
	return f.isGroupCreator, nil
}

func (f *fakeGroupRepository) UpdateGroupApartment(ctx context.Context, groupID string, apartmentID *string) error {
	f.updatedApartmentID = apartmentID
	return nil
}

func (f *fakeGroupRepository) FilterExistingTenantIDs(ctx context.Context, userIDs []string) ([]string, error) {
	return nil, nil
}

func (f *fakeGroupRepository) HasUserGroupForApartment(ctx context.Context, userID, apartmentID string) (bool, error) {
	return false, nil
}

func (f *fakeGroupRepository) GetMyGroupForApartment(ctx context.Context, userID, apartmentID string) (*group.Group, error) {
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

func TestCreateGroupAutoAcceptsOwner(t *testing.T) {
	repo := &fakeGroupRepository{createdGroupID: "group-42"}
	svc := NewService(repo, nil)

	groupID, err := svc.CreateGroup(context.Background(), "tenant-1", "tenant", group.CreateGroupInput{Name: "Centro Leon"})
	if err != nil {
		t.Fatalf("CreateGroup returned error: %v", err)
	}
	if groupID != "group-42" {
		t.Fatalf("groupID = %q, want group-42", groupID)
	}
	if !repo.ownerMemberAdded {
		t.Fatalf("AddGroupOwnerMember should be called")
	}
	if repo.acceptedGroupForUserID != "tenant-1" {
		t.Fatalf("acceptedGroupForUserID = %q, want tenant-1", repo.acceptedGroupForUserID)
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

func TestUpdateGroupApartmentAllowsFirstApartmentLink(t *testing.T) {
	repo := &fakeGroupRepository{
		isGroupCreator: true,
		groupDetail: &group.Group{
			ID:           "group-1",
			UserRelation: group.UserRelationCreator,
			Apartment:    nil,
		},
	}
	svc := NewService(repo, nil)

	err := svc.UpdateGroupApartment(context.Background(), "group-1", "tenant-1", "tenant", group.UpdateGroupApartmentInput{ApartmentID: "apt-1"})
	if err != nil {
		t.Fatalf("UpdateGroupApartment returned error: %v", err)
	}
	if repo.updatedApartmentID == nil || *repo.updatedApartmentID != "apt-1" {
		t.Fatalf("updatedApartmentID = %v, want apt-1", repo.updatedApartmentID)
	}
}

func TestUpdateGroupApartmentRejectsRemoval(t *testing.T) {
	repo := &fakeGroupRepository{
		isGroupCreator: true,
		groupDetail: &group.Group{
			ID:           "group-1",
			UserRelation: group.UserRelationCreator,
		},
	}
	svc := NewService(repo, nil)

	err := svc.UpdateGroupApartment(context.Background(), "group-1", "tenant-1", "tenant", group.UpdateGroupApartmentInput{})
	if !errors.Is(err, ErrGroupApartmentRemovalNotAllowed) {
		t.Fatalf("err = %v, want %v", err, ErrGroupApartmentRemovalNotAllowed)
	}
}

func TestUpdateGroupApartmentRejectsReplacingAssignedApartment(t *testing.T) {
	repo := &fakeGroupRepository{
		isGroupCreator: true,
		groupDetail: &group.Group{
			ID:           "group-1",
			UserRelation: group.UserRelationCreator,
			Apartment:    &group.Apartment{ID: "apt-1"},
		},
	}
	svc := NewService(repo, nil)

	err := svc.UpdateGroupApartment(context.Background(), "group-1", "tenant-1", "tenant", group.UpdateGroupApartmentInput{ApartmentID: "apt-2"})
	if !errors.Is(err, ErrGroupApartmentAlreadyAssigned) {
		t.Fatalf("err = %v, want %v", err, ErrGroupApartmentAlreadyAssigned)
	}
}

func TestUpdateGroupApartmentRejectsNonCreator(t *testing.T) {
	repo := &fakeGroupRepository{
		isGroupCreator: false,
		groupDetail: &group.Group{
			ID:           "group-1",
			UserRelation: group.UserRelationMember,
		},
	}
	svc := NewService(repo, nil)

	err := svc.UpdateGroupApartment(context.Background(), "group-1", "tenant-2", "tenant", group.UpdateGroupApartmentInput{ApartmentID: "apt-2"})
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("err = %v, want %v", err, ErrForbidden)
	}
}

func TestDeleteGroupAllowsCreator(t *testing.T) {
	repo := &fakeGroupRepository{
		groupDetail:    &group.Group{ID: "group-1", UserRelation: group.UserRelationCreator},
		isGroupCreator: true,
	}
	svc := NewService(repo, nil)

	err := svc.DeleteGroup(context.Background(), "group-1", "tenant-1", "tenant")
	if err != nil {
		t.Fatalf("DeleteGroup returned error: %v", err)
	}
	if repo.deletedGroupID != "group-1" {
		t.Fatalf("deletedGroupID = %q, want group-1", repo.deletedGroupID)
	}
}

func TestDeleteGroupRejectsNonCreator(t *testing.T) {
	repo := &fakeGroupRepository{
		groupDetail:    &group.Group{ID: "group-1", UserRelation: group.UserRelationMember},
		isGroupCreator: false,
	}
	svc := NewService(repo, nil)

	err := svc.DeleteGroup(context.Background(), "group-1", "tenant-2", "tenant")
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("err = %v, want %v", err, ErrForbidden)
	}
	if repo.deletedGroupID != "" {
		t.Fatalf("DeleteGroup should not be called for non creators")
	}
}

func TestDeleteGroupRejectsMissingGroup(t *testing.T) {
	repo := &fakeGroupRepository{}
	svc := NewService(repo, nil)

	err := svc.DeleteGroup(context.Background(), "group-404", "tenant-1", "tenant")
	if !errors.Is(err, ErrGroupNotFound) {
		t.Fatalf("err = %v, want %v", err, ErrGroupNotFound)
	}
}
