package service

import (
	"context"
	"errors"
	"testing"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/group"
)

type fakeGroupRepository struct {
	groupDetail                *group.Group
	invitation                 *group.Invitation
	hasPendingJoinRequest      bool
	hasRejectedJoinRequest     bool
	createdJoinRequestID       string
	createdJoinRequest         bool
	createdJoinRequestSource   string
	createdGroupID             string
	isGroupCreator             bool
	canReviewJoinRequests      bool
	updatedApartmentID         *string
	ownerMemberAdded           bool
	acceptedGroupForUserID     string
	deletedGroupID             string
	acceptedInvitationID       string
	acceptedInvitationUserID   string
	addedGroupMemberUserID     string
	leftGroupID                string
	leftGroupUserID            string
	invitableTenantIDs         []string
	createdPendingGroupID      string
	createdPendingInvitedBy    string
	createdPendingUserIDs      []string
	apartmentCapacity          int
	currentPeopleCount         int
	finalizedJoinRequestStatus string
	finalizedJoinRequestDone   bool
	canVoteJoinRequest         bool
	votedRequestID             string
	votedUserID                string
	votedDecision              string
	listFilters                group.ListGroupsFilters
}

func (f *fakeGroupRepository) ListTenantGroups(ctx context.Context, userID string, filters group.ListGroupsFilters) ([]group.Group, error) {
	f.listFilters = filters
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
	f.createdPendingGroupID = groupID
	f.createdPendingInvitedBy = invitedBy
	f.createdPendingUserIDs = invitedUserIDs
	return nil
}

func (f *fakeGroupRepository) ListGroupCandidates(ctx context.Context, currentUserID string, filters group.CandidateFilters) ([]group.Candidate, error) {
	return nil, nil
}

func (f *fakeGroupRepository) FilterInvitableTenantIDs(ctx context.Context, groupID string, userIDs []string) ([]string, error) {
	if f.invitableTenantIDs != nil {
		return f.invitableTenantIDs, nil
	}
	return userIDs, nil
}

func (f *fakeGroupRepository) GetApartmentCapacity(ctx context.Context, apartmentID string) (int, error) {
	return f.apartmentCapacity, nil
}

func (f *fakeGroupRepository) CountAcceptedMembersAndPendingInvitations(ctx context.Context, groupID string) (int, error) {
	return f.currentPeopleCount, nil
}

func (f *fakeGroupRepository) GetInvitationForUser(ctx context.Context, invitationID, userID string) (*group.Invitation, error) {
	return f.invitation, nil
}

func (f *fakeGroupRepository) AcceptInvitation(ctx context.Context, invitationID, userID string) error {
	f.acceptedInvitationID = invitationID
	f.acceptedInvitationUserID = userID
	return nil
}

func (f *fakeGroupRepository) RejectInvitation(ctx context.Context, invitationID, userID string) error {
	return nil
}

func (f *fakeGroupRepository) AddGroupMember(ctx context.Context, groupID, userID, role string) error {
	f.addedGroupMemberUserID = userID
	return nil
}

func (f *fakeGroupRepository) LeaveGroup(ctx context.Context, groupID, userID string) error {
	f.leftGroupID = groupID
	f.leftGroupUserID = userID
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

func (f *fakeGroupRepository) CreateJoinRequest(ctx context.Context, groupID, requesterUserID, source string) (string, error) {
	f.createdJoinRequest = true
	f.createdJoinRequestSource = source
	if f.createdJoinRequestID == "" {
		f.createdJoinRequestID = "join-request-1"
	}
	return f.createdJoinRequestID, nil
}

func (f *fakeGroupRepository) ListJoinRequests(ctx context.Context, groupID string) ([]group.JoinRequest, error) {
	return nil, nil
}

func (f *fakeGroupRepository) CanUserReviewJoinRequests(ctx context.Context, groupID, userID string) (bool, error) {
	return f.canReviewJoinRequests, nil
}

func (f *fakeGroupRepository) CanUserVoteJoinRequest(ctx context.Context, requestID, voterUserID string) (bool, error) {
	return f.canVoteJoinRequest, nil
}

func (f *fakeGroupRepository) VoteJoinRequest(ctx context.Context, requestID, voterUserID, decision string) error {
	f.votedRequestID = requestID
	f.votedUserID = voterUserID
	f.votedDecision = decision
	return nil
}

func (f *fakeGroupRepository) FinalizeJoinRequestApproval(ctx context.Context, requestID string) (string, bool, error) {
	return f.finalizedJoinRequestStatus, f.finalizedJoinRequestDone, nil
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

func TestListTenantGroupsDefaultsToMyScope(t *testing.T) {
	repo := &fakeGroupRepository{}
	svc := NewService(repo, nil)

	_, err := svc.ListTenantGroups(context.Background(), "tenant-1", "tenant", group.ListGroupsFilters{})
	if err != nil {
		t.Fatalf("ListTenantGroups returned error: %v", err)
	}
	if repo.listFilters.Scope != "my" {
		t.Fatalf("scope = %q, want my", repo.listFilters.Scope)
	}
}

func TestListTenantGroupsKeepsDiscoverableScope(t *testing.T) {
	repo := &fakeGroupRepository{}
	svc := NewService(repo, nil)

	_, err := svc.ListTenantGroups(context.Background(), "tenant-1", "tenant", group.ListGroupsFilters{Scope: "discoverable"})
	if err != nil {
		t.Fatalf("ListTenantGroups returned error: %v", err)
	}
	if repo.listFilters.Scope != "discoverable" {
		t.Fatalf("scope = %q, want discoverable", repo.listFilters.Scope)
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

func TestAcceptInvitationRejectsMissingInvitation(t *testing.T) {
	repo := &fakeGroupRepository{}
	svc := NewService(repo, nil)

	err := svc.AcceptInvitation(context.Background(), "inv-404", "tenant-1", "tenant")
	if !errors.Is(err, ErrInvitationNotFound) {
		t.Fatalf("err = %v, want %v", err, ErrInvitationNotFound)
	}
	if repo.acceptedInvitationID != "" {
		t.Fatalf("AcceptInvitation should not be called when invitation does not exist")
	}
}

func TestAcceptInvitationCreatesInvitationSourcedJoinRequest(t *testing.T) {
	repo := &fakeGroupRepository{
		invitation: &group.Invitation{
			ID:            "inv-1",
			GroupID:       "group-1",
			InvitedUserID: "tenant-2",
			Status:        group.InvitationStatusPending,
		},
		groupDetail: &group.Group{ID: "group-1"},
	}
	svc := NewService(repo, nil)

	err := svc.AcceptInvitation(context.Background(), "inv-1", "tenant-2", "tenant")
	if err != nil {
		t.Fatalf("AcceptInvitation returned error: %v", err)
	}
	if repo.acceptedInvitationID != "inv-1" || repo.acceptedInvitationUserID != "tenant-2" {
		t.Fatalf("accept invitation called with unexpected values: %q %q", repo.acceptedInvitationID, repo.acceptedInvitationUserID)
	}
	if !repo.createdJoinRequest {
		t.Fatalf("CreateJoinRequest should be called after accepting the invitation")
	}
	if repo.createdJoinRequestSource != group.JoinRequestSourceGroupInvitation {
		t.Fatalf("createdJoinRequestSource = %q, want %q", repo.createdJoinRequestSource, group.JoinRequestSourceGroupInvitation)
	}
}

func TestAcceptInvitationAllowsInvitationConsensusFlowWhenApartmentHasThreeTotalSpots(t *testing.T) {
	repo := &fakeGroupRepository{
		invitation: &group.Invitation{
			ID:            "inv-3",
			GroupID:       "group-1",
			InvitedUserID: "tenant-3",
			Status:        group.InvitationStatusPending,
		},
		groupDetail: &group.Group{
			ID: "group-1",
			Apartment: &group.Apartment{
				ID:             "apt-1",
				TotalSpots:     3,
				AvailableSpots: 2,
			},
		},
		currentPeopleCount: 3,
	}
	svc := NewService(repo, nil)

	err := svc.AcceptInvitation(context.Background(), "inv-3", "tenant-3", "tenant")
	if err != nil {
		t.Fatalf("AcceptInvitation returned error: %v", err)
	}
	if repo.createdJoinRequestSource != group.JoinRequestSourceGroupInvitation {
		t.Fatalf("createdJoinRequestSource = %q, want %q", repo.createdJoinRequestSource, group.JoinRequestSourceGroupInvitation)
	}
}

func TestAcceptInvitationRejectsWhenGroupIsFull(t *testing.T) {
	repo := &fakeGroupRepository{
		invitation: &group.Invitation{
			ID:            "inv-full",
			GroupID:       "group-1",
			InvitedUserID: "tenant-4",
			Status:        group.InvitationStatusPending,
		},
		groupDetail: &group.Group{
			ID:        "group-1",
			Apartment: &group.Apartment{ID: "apt-1", TotalSpots: 3},
			Members:   []group.Member{{UserID: "tenant-1"}, {UserID: "tenant-2"}, {UserID: "tenant-3"}},
		},
	}
	svc := NewService(repo, nil)

	err := svc.AcceptInvitation(context.Background(), "inv-full", "tenant-4", "tenant")
	if !errors.Is(err, ErrApartmentFull) {
		t.Fatalf("err = %v, want %v", err, ErrApartmentFull)
	}
	if repo.acceptedInvitationID != "" {
		t.Fatalf("AcceptInvitation should not be called when group is full")
	}
	if repo.createdJoinRequest {
		t.Fatalf("CreateJoinRequest should not be called when group is full")
	}
}

func TestInviteUsersRejectsNonMember(t *testing.T) {
	repo := &fakeGroupRepository{
		groupDetail:           &group.Group{ID: "group-1"},
		canReviewJoinRequests: false,
	}
	svc := NewService(repo, nil)

	err := svc.InviteUsers(context.Background(), "group-1", "tenant-2", "tenant", []string{"tenant-3"})
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("err = %v, want %v", err, ErrForbidden)
	}
	if len(repo.createdPendingUserIDs) > 0 {
		t.Fatalf("CreatePendingInvitations should not be called for non members")
	}
}

func TestInviteUsersRejectsWhenGroupIsFull(t *testing.T) {
	repo := &fakeGroupRepository{
		groupDetail: &group.Group{
			ID:        "group-1",
			Apartment: &group.Apartment{ID: "apt-1", TotalSpots: 3},
			Members:   []group.Member{{UserID: "tenant-1"}, {UserID: "tenant-2"}, {UserID: "tenant-3"}},
		},
		canReviewJoinRequests: true,
		invitableTenantIDs:    []string{"tenant-4"},
	}
	svc := NewService(repo, nil)

	err := svc.InviteUsers(context.Background(), "group-1", "tenant-2", "tenant", []string{"tenant-4"})
	if !errors.Is(err, ErrApartmentFull) {
		t.Fatalf("err = %v, want %v", err, ErrApartmentFull)
	}
	if len(repo.createdPendingUserIDs) > 0 {
		t.Fatalf("CreatePendingInvitations should not be called when group is full")
	}
}

func TestInviteUsersAllowsThirdSlotWhenApartmentHasThreeTotalSpots(t *testing.T) {
	repo := &fakeGroupRepository{
		groupDetail: &group.Group{
			ID: "group-1",
			Apartment: &group.Apartment{
				ID:             "apt-1",
				TotalSpots:     3,
				AvailableSpots: 2,
			},
		},
		canReviewJoinRequests: true,
		invitableTenantIDs:    []string{"tenant-3"},
		apartmentCapacity:     3,
		currentPeopleCount:    2,
	}
	svc := NewService(repo, nil)

	err := svc.InviteUsers(context.Background(), "group-1", "tenant-2", "tenant", []string{"tenant-3"})
	if err != nil {
		t.Fatalf("InviteUsers returned error: %v", err)
	}
	if len(repo.createdPendingUserIDs) != 1 || repo.createdPendingUserIDs[0] != "tenant-3" {
		t.Fatalf("createdPendingUserIDs = %#v, want tenant-3", repo.createdPendingUserIDs)
	}
}

func TestInviteUsersCreatesPendingInvitationsForValidCandidates(t *testing.T) {
	repo := &fakeGroupRepository{
		groupDetail:           &group.Group{ID: "group-1"},
		canReviewJoinRequests: true,
		invitableTenantIDs:    []string{"tenant-3", "tenant-4"},
	}
	svc := NewService(repo, nil)

	err := svc.InviteUsers(context.Background(), "group-1", "tenant-2", "tenant", []string{"tenant-2", "tenant-3", "tenant-4"})
	if err != nil {
		t.Fatalf("InviteUsers returned error: %v", err)
	}
	if repo.createdPendingGroupID != "group-1" || repo.createdPendingInvitedBy != "tenant-2" {
		t.Fatalf("unexpected pending invitation metadata: %q %q", repo.createdPendingGroupID, repo.createdPendingInvitedBy)
	}
	if len(repo.createdPendingUserIDs) != 2 || repo.createdPendingUserIDs[0] != "tenant-3" || repo.createdPendingUserIDs[1] != "tenant-4" {
		t.Fatalf("createdPendingUserIDs = %#v, want tenant-3 and tenant-4", repo.createdPendingUserIDs)
	}
}

func TestInviteUsersRejectsWhenNoValidCandidatesRemain(t *testing.T) {
	repo := &fakeGroupRepository{
		groupDetail:           &group.Group{ID: "group-1"},
		canReviewJoinRequests: true,
		invitableTenantIDs:    []string{},
	}
	svc := NewService(repo, nil)

	err := svc.InviteUsers(context.Background(), "group-1", "tenant-2", "tenant", []string{"tenant-2"})
	if !errors.Is(err, ErrNoValidInvitedUsers) {
		t.Fatalf("err = %v, want %v", err, ErrNoValidInvitedUsers)
	}
}

func TestLeaveGroupAllowsAcceptedMember(t *testing.T) {
	repo := &fakeGroupRepository{
		groupDetail: &group.Group{ID: "group-1", UserRelation: group.UserRelationMember},
	}
	svc := NewService(repo, nil)

	err := svc.LeaveGroup(context.Background(), "group-1", "tenant-2", "tenant")
	if err != nil {
		t.Fatalf("LeaveGroup returned error: %v", err)
	}
	if repo.leftGroupID != "group-1" || repo.leftGroupUserID != "tenant-2" {
		t.Fatalf("LeaveGroup called with unexpected values: %q %q", repo.leftGroupID, repo.leftGroupUserID)
	}
}

func TestLeaveGroupRejectsCreator(t *testing.T) {
	repo := &fakeGroupRepository{
		groupDetail: &group.Group{ID: "group-1", UserRelation: group.UserRelationCreator},
	}
	svc := NewService(repo, nil)

	err := svc.LeaveGroup(context.Background(), "group-1", "tenant-1", "tenant")
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("err = %v, want %v", err, ErrForbidden)
	}
	if repo.leftGroupID != "" {
		t.Fatalf("repository LeaveGroup should not be called for creators")
	}
}

func TestLeaveGroupRejectsViewer(t *testing.T) {
	repo := &fakeGroupRepository{
		groupDetail: &group.Group{ID: "group-1", UserRelation: group.UserRelationViewer},
	}
	svc := NewService(repo, nil)

	err := svc.LeaveGroup(context.Background(), "group-1", "tenant-3", "tenant")
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("err = %v, want %v", err, ErrForbidden)
	}
	if repo.leftGroupID != "" {
		t.Fatalf("repository LeaveGroup should not be called for viewers")
	}
}

func TestLeaveGroupRejectsNonTenant(t *testing.T) {
	repo := &fakeGroupRepository{}
	svc := NewService(repo, nil)

	err := svc.LeaveGroup(context.Background(), "group-1", "owner-1", "owner")
	if !errors.Is(err, ErrTenantRequired) {
		t.Fatalf("err = %v, want %v", err, ErrTenantRequired)
	}
	if repo.leftGroupID != "" {
		t.Fatalf("repository LeaveGroup should not be called for non tenants")
	}
}

func TestVoteJoinRequestAllowsThirdMemberWhenApartmentHasThreeTotalSpots(t *testing.T) {
	repo := &fakeGroupRepository{
		canVoteJoinRequest:         true,
		finalizedJoinRequestStatus: group.JoinRequestStatusApproved,
		finalizedJoinRequestDone:   true,
		groupDetail: &group.Group{
			ID: "group-1",
			Apartment: &group.Apartment{
				ID:             "apt-1",
				TotalSpots:     3,
				AvailableSpots: 2,
			},
		},
		currentPeopleCount: 2,
	}
	svc := NewService(repo, nil)

	err := svc.VoteJoinRequest(context.Background(), "request-1", "tenant-2", "tenant", group.JoinRequestVoteApprove)
	if err != nil {
		t.Fatalf("VoteJoinRequest returned error: %v", err)
	}
	if repo.votedDecision != group.JoinRequestVoteApprove {
		t.Fatalf("votedDecision = %q, want %q", repo.votedDecision, group.JoinRequestVoteApprove)
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
	if repo.createdJoinRequestSource != group.JoinRequestSourceDirectRequest {
		t.Fatalf("createdJoinRequestSource = %q, want %q", repo.createdJoinRequestSource, group.JoinRequestSourceDirectRequest)
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
