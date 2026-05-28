package service

import (
	"context"
	"errors"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/group"
)

type repository interface {
	ListTenantGroups(ctx context.Context, userID string, filters group.ListGroupsFilters) ([]group.Group, error)
	GetTenantGroupByID(ctx context.Context, groupID, userID string) (*group.Group, error)
	CreateGroup(ctx context.Context, creatorID string, input group.CreateGroupInput) (string, error)
	AddGroupOwnerMember(ctx context.Context, groupID, creatorID string) error
	CreatePendingInvitations(ctx context.Context, groupID, invitedBy string, invitedUserIDs []string) error
	ListGroupCandidates(ctx context.Context, currentUserID string, filters group.CandidateFilters) ([]group.Candidate, error)
	GetApartmentCapacity(ctx context.Context, apartmentID string) (int, error)
	CountAcceptedMembersAndPendingInvitations(ctx context.Context, groupID string) (int, error)
	GetInvitationForUser(ctx context.Context, invitationID, userID string) (*group.Invitation, error)
	AcceptInvitation(ctx context.Context, invitationID, userID string) error
	RejectInvitation(ctx context.Context, invitationID, userID string) error
	AddGroupMember(ctx context.Context, groupID, userID, role string) error
	CanUserAcceptGroup(ctx context.Context, groupID, userID string) (bool, error)
	AcceptGroupForUser(ctx context.Context, groupID, userID string) error
	HasPendingJoinRequest(ctx context.Context, groupID, requesterUserID string) (bool, error)
	CreateJoinRequest(ctx context.Context, groupID, requesterUserID string) (string, error)
	ListJoinRequests(ctx context.Context, groupID string) ([]group.JoinRequest, error)
	CanUserReviewJoinRequests(ctx context.Context, groupID, userID string) (bool, error)
	CanUserVoteJoinRequest(ctx context.Context, requestID, voterUserID string) (bool, error)
	VoteJoinRequest(ctx context.Context, requestID, voterUserID, decision string) error
	ResolveJoinRequestStatus(ctx context.Context, requestID string) (string, bool, error)
	GetJoinRequest(ctx context.Context, requestID string) (*group.JoinRequest, error)
	CancelJoinRequest(ctx context.Context, requestID, requesterUserID string) error
	IsGroupCreator(ctx context.Context, groupID, userID string) (bool, error)
	UpdateGroupApartment(ctx context.Context, groupID string, apartmentID *string) error
	FilterExistingTenantIDs(ctx context.Context, userIDs []string) ([]string, error)
}

// ErrTenantRequired is returned when the authenticated user is not a tenant.
var ErrTenantRequired = errors.New("tenant role is required")

// ErrGroupNotFound is returned when the requested group does not exist or is not visible to the user.
var ErrGroupNotFound = errors.New("group not found")

// ErrForbidden is returned when the user cannot perform the requested group action.
var ErrForbidden = errors.New("forbidden")

// ErrInvitationNotFound is returned when the requested invitation does not exist for the user.
var ErrInvitationNotFound = errors.New("invitation not found")

// ErrInvitationNotPending is returned when the invitation has already been answered.
var ErrInvitationNotPending = errors.New("invitation is not pending")

// ErrApartmentFull is returned when the group exceeds the apartment available spots.
var ErrApartmentFull = errors.New("group exceeds apartment available spots")

// ErrNoValidInvitedUsers is returned when no invited users are valid tenants.
var ErrNoValidInvitedUsers = errors.New("no valid invited users found")

// ErrJoinRequestAlreadyPending is returned when the user already has a pending join request for the group.
var ErrJoinRequestAlreadyPending = errors.New("join request already pending")

// ErrJoinRequestNotFound is returned when the requested join request does not exist.
var ErrJoinRequestNotFound = errors.New("join request not found")

// Service contains tenant group business logic.
type Service struct {
	repo repository
}

// NewService creates a tenant group service.
func NewService(repo repository) *Service {
	return &Service{repo: repo}
}

// ListTenantGroups returns the groups related to the authenticated tenant.
func (s *Service) ListTenantGroups(ctx context.Context, userID, role string, filters group.ListGroupsFilters) ([]group.Group, error) {
	if err := validateTenant(userID, role); err != nil {
		return nil, err
	}

	filters.Search = strings.TrimSpace(filters.Search)
	filters.Status = strings.ToUpper(strings.TrimSpace(filters.Status))
	filters.HasApartment = strings.ToLower(strings.TrimSpace(filters.HasApartment))
	filters.SortBy = strings.ToLower(strings.TrimSpace(filters.SortBy))

	if filters.SortBy == "" {
		filters.SortBy = "recent"
	}

	return s.repo.ListTenantGroups(ctx, strings.TrimSpace(userID), filters)
}

// GetTenantGroupByID returns a group detail if the tenant is related to it.
func (s *Service) GetTenantGroupByID(ctx context.Context, groupID, userID, role string) (*group.Group, error) {
	if err := validateTenant(userID, role); err != nil {
		return nil, err
	}
	if strings.TrimSpace(groupID) == "" {
		return nil, errors.New("group id is required")
	}

	result, err := s.repo.GetTenantGroupByID(ctx, strings.TrimSpace(groupID), strings.TrimSpace(userID))
	if err != nil {
		return nil, err
	}
	if result == nil {
		return nil, ErrGroupNotFound
	}

	return result, nil
}

// CreateGroup creates a group, adds the creator as owner and creates pending invitations.
func (s *Service) CreateGroup(ctx context.Context, creatorID, role string, input group.CreateGroupInput) (string, error) {
	if err := validateTenant(creatorID, role); err != nil {
		return "", err
	}

	input.Name = strings.TrimSpace(input.Name)
	input.Description = strings.TrimSpace(input.Description)
	input.ApartmentID = strings.TrimSpace(input.ApartmentID)
	input.InvitedUserIDs = normalizeUserIDs(input.InvitedUserIDs, creatorID)

	if input.Name == "" {
		return "", errors.New("name is required")
	}

	validInvitedUserIDs, err := s.repo.FilterExistingTenantIDs(ctx, input.InvitedUserIDs)
	if err != nil {
		return "", err
	}
	input.InvitedUserIDs = validInvitedUserIDs

	if input.ApartmentID != "" {
		requiredPlaces := 1 + len(input.InvitedUserIDs)
		if err := s.ensureApartmentHasCapacity(ctx, input.ApartmentID, requiredPlaces); err != nil {
			return "", err
		}
	}

	groupID, err := s.repo.CreateGroup(ctx, strings.TrimSpace(creatorID), input)
	if err != nil {
		return "", err
	}

	if err := s.repo.AddGroupOwnerMember(ctx, groupID, strings.TrimSpace(creatorID)); err != nil {
		return "", err
	}

	if len(input.InvitedUserIDs) > 0 {
		if err := s.repo.CreatePendingInvitations(ctx, groupID, strings.TrimSpace(creatorID), input.InvitedUserIDs); err != nil {
			return "", err
		}
	}

	return groupID, nil
}

// ListGroupCandidates returns tenant profiles that can be invited to groups.
func (s *Service) ListGroupCandidates(ctx context.Context, currentUserID, role string, filters group.CandidateFilters) ([]group.Candidate, error) {
	if err := validateTenant(currentUserID, role); err != nil {
		return nil, err
	}

	filters.Search = strings.TrimSpace(filters.Search)
	filters.University = strings.TrimSpace(filters.University)

	return s.repo.ListGroupCandidates(ctx, strings.TrimSpace(currentUserID), filters)
}

// AcceptInvitation accepts a pending group invitation and adds the tenant as member.
func (s *Service) AcceptInvitation(ctx context.Context, invitationID, userID, role string) error {
	if err := validateTenant(userID, role); err != nil {
		return err
	}
	if strings.TrimSpace(invitationID) == "" {
		return errors.New("invitation id is required")
	}

	invitation, err := s.repo.GetInvitationForUser(ctx, strings.TrimSpace(invitationID), strings.TrimSpace(userID))
	if err != nil {
		return err
	}
	if invitation == nil {
		return ErrInvitationNotFound
	}
	if strings.ToUpper(strings.TrimSpace(invitation.Status)) != group.InvitationStatusPending {
		return ErrInvitationNotPending
	}

	groupDetail, err := s.repo.GetTenantGroupByID(ctx, invitation.GroupID, userID)
	if err != nil {
		return err
	}
	if groupDetail == nil {
		return ErrGroupNotFound
	}

	if groupDetail.Apartment != nil {
		currentPeople, err := s.repo.CountAcceptedMembersAndPendingInvitations(ctx, invitation.GroupID)
		if err != nil {
			return err
		}
		if currentPeople > groupDetail.Apartment.AvailableSpots {
			return ErrApartmentFull
		}
	}

	if err := s.repo.AcceptInvitation(ctx, strings.TrimSpace(invitationID), strings.TrimSpace(userID)); err != nil {
		return err
	}

	return s.repo.AddGroupMember(ctx, invitation.GroupID, strings.TrimSpace(userID), group.MemberRoleMember)
}

// RejectInvitation rejects a pending group invitation.
func (s *Service) RejectInvitation(ctx context.Context, invitationID, userID, role string) error {
	if err := validateTenant(userID, role); err != nil {
		return err
	}
	if strings.TrimSpace(invitationID) == "" {
		return errors.New("invitation id is required")
	}

	invitation, err := s.repo.GetInvitationForUser(ctx, strings.TrimSpace(invitationID), strings.TrimSpace(userID))
	if err != nil {
		return err
	}
	if invitation == nil {
		return ErrInvitationNotFound
	}
	if strings.ToUpper(strings.TrimSpace(invitation.Status)) != group.InvitationStatusPending {
		return ErrInvitationNotPending
	}

	return s.repo.RejectInvitation(ctx, strings.TrimSpace(invitationID), strings.TrimSpace(userID))
}

// AcceptGroup accepts the group as creator or accepted member.
func (s *Service) AcceptGroup(ctx context.Context, groupID, userID, role string) error {
	if err := validateTenant(userID, role); err != nil {
		return err
	}
	if strings.TrimSpace(groupID) == "" {
		return errors.New("group id is required")
	}

	allowed, err := s.repo.CanUserAcceptGroup(ctx, strings.TrimSpace(groupID), strings.TrimSpace(userID))
	if err != nil {
		return err
	}
	if !allowed {
		return ErrForbidden
	}

	return s.repo.AcceptGroupForUser(ctx, strings.TrimSpace(groupID), strings.TrimSpace(userID))
}

// CreateJoinRequest creates a join request from a viewer to a group.
func (s *Service) CreateJoinRequest(ctx context.Context, groupID, userID, role string) (string, error) {
	if err := validateTenant(userID, role); err != nil {
		return "", err
	}
	groupID = strings.TrimSpace(groupID)
	userID = strings.TrimSpace(userID)
	if groupID == "" {
		return "", errors.New("group id is required")
	}

	groupDetail, err := s.repo.GetTenantGroupByID(ctx, groupID, userID)
	if err != nil {
		return "", err
	}
	if groupDetail == nil {
		return "", ErrGroupNotFound
	}
	if groupDetail.UserRelation != group.UserRelationViewer {
		return "", ErrForbidden
	}

	hasPending, err := s.repo.HasPendingJoinRequest(ctx, groupID, userID)
	if err != nil {
		return "", err
	}
	if hasPending {
		return "", ErrJoinRequestAlreadyPending
	}

	return s.repo.CreateJoinRequest(ctx, groupID, userID)
}

// ListJoinRequests returns pending join requests for a group. Only accepted members can list them.
func (s *Service) ListJoinRequests(ctx context.Context, groupID, userID, role string) ([]group.JoinRequest, error) {
	if err := validateTenant(userID, role); err != nil {
		return nil, err
	}
	groupID = strings.TrimSpace(groupID)
	userID = strings.TrimSpace(userID)
	if groupID == "" {
		return nil, errors.New("group id is required")
	}

	canReview, err := s.repo.CanUserReviewJoinRequests(ctx, groupID, userID)
	if err != nil {
		return nil, err
	}
	if !canReview {
		return nil, ErrForbidden
	}

	return s.repo.ListJoinRequests(ctx, groupID)
}

// VoteJoinRequest casts a member vote on a pending join request.
func (s *Service) VoteJoinRequest(ctx context.Context, requestID, userID, role, decision string) error {
	if err := validateTenant(userID, role); err != nil {
		return err
	}
	requestID = strings.TrimSpace(requestID)
	userID = strings.TrimSpace(userID)
	decision = strings.ToUpper(strings.TrimSpace(decision))
	if requestID == "" {
		return errors.New("request id is required")
	}
	if decision != group.JoinRequestVoteApprove && decision != group.JoinRequestVoteReject {
		return errors.New("invalid vote decision")
	}

	canVote, err := s.repo.CanUserVoteJoinRequest(ctx, requestID, userID)
	if err != nil {
		return err
	}
	if !canVote {
		return ErrForbidden
	}

	if err := s.repo.VoteJoinRequest(ctx, requestID, userID, decision); err != nil {
		return err
	}

	return s.finalizeApprovedJoinRequestIfNeeded(ctx, requestID, userID)
}

// finalizeApprovedJoinRequestIfNeeded resolves the request status and, if approved, adds the requester as member.
func (s *Service) finalizeApprovedJoinRequestIfNeeded(ctx context.Context, requestID, voterUserID string) error {
	status, completed, err := s.repo.ResolveJoinRequestStatus(ctx, requestID)
	if err != nil {
		return err
	}
	if !completed || status != group.JoinRequestStatusApproved {
		return nil
	}

	joinRequest, err := s.repo.GetJoinRequest(ctx, requestID)
	if err != nil {
		return err
	}
	if joinRequest == nil {
		return ErrJoinRequestNotFound
	}

	if err := s.ensureGroupHasCapacityForNewMember(ctx, joinRequest.GroupID, voterUserID); err != nil {
		return err
	}

	return s.repo.AddGroupMember(ctx, joinRequest.GroupID, joinRequest.RequesterUserID, group.MemberRoleMember)
}

// ensureGroupHasCapacityForNewMember checks apartment capacity before adding a member.
func (s *Service) ensureGroupHasCapacityForNewMember(ctx context.Context, groupID, callerUserID string) error {
	groupDetail, err := s.repo.GetTenantGroupByID(ctx, groupID, callerUserID)
	if err != nil {
		return err
	}
	if groupDetail == nil || groupDetail.Apartment == nil {
		return nil
	}

	currentPeople, err := s.repo.CountAcceptedMembersAndPendingInvitations(ctx, groupID)
	if err != nil {
		return err
	}
	if currentPeople+1 > groupDetail.Apartment.AvailableSpots {
		return ErrApartmentFull
	}
	return nil
}

// CancelJoinRequest cancels a pending join request owned by the requester.
func (s *Service) CancelJoinRequest(ctx context.Context, requestID, userID, role string) error {
	if err := validateTenant(userID, role); err != nil {
		return err
	}
	if strings.TrimSpace(requestID) == "" {
		return errors.New("request id is required")
	}

	return s.repo.CancelJoinRequest(ctx, strings.TrimSpace(requestID), strings.TrimSpace(userID))
}

// UpdateGroupApartment assigns or removes the apartment linked to a group.
func (s *Service) UpdateGroupApartment(ctx context.Context, groupID, userID, role string, input group.UpdateGroupApartmentInput) error {
	if err := validateTenant(userID, role); err != nil {
		return err
	}
	if strings.TrimSpace(groupID) == "" {
		return errors.New("group id is required")
	}

	isCreator, err := s.repo.IsGroupCreator(ctx, strings.TrimSpace(groupID), strings.TrimSpace(userID))
	if err != nil {
		return err
	}
	if !isCreator {
		return ErrForbidden
	}

	apartmentID := strings.TrimSpace(input.ApartmentID)
	if apartmentID == "" {
		return s.repo.UpdateGroupApartment(ctx, strings.TrimSpace(groupID), nil)
	}

	currentPeople, err := s.repo.CountAcceptedMembersAndPendingInvitations(ctx, strings.TrimSpace(groupID))
	if err != nil {
		return err
	}
	if err := s.ensureApartmentHasCapacity(ctx, apartmentID, currentPeople); err != nil {
		return err
	}

	return s.repo.UpdateGroupApartment(ctx, strings.TrimSpace(groupID), &apartmentID)
}

func validateTenant(userID, role string) error {
	if strings.TrimSpace(userID) == "" {
		return errors.New("user id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return ErrTenantRequired
	}
	return nil
}

func normalizeUserIDs(userIDs []string, currentUserID string) []string {
	currentUserID = strings.TrimSpace(currentUserID)
	seen := make(map[string]struct{})
	result := make([]string, 0, len(userIDs))

	for _, userID := range userIDs {
		userID = strings.TrimSpace(userID)
		if userID == "" || userID == currentUserID {
			continue
		}
		if _, exists := seen[userID]; exists {
			continue
		}
		seen[userID] = struct{}{}
		result = append(result, userID)
	}

	return result
}

func (s *Service) ensureApartmentHasCapacity(ctx context.Context, apartmentID string, requiredPlaces int) error {
	availableSpots, err := s.repo.GetApartmentCapacity(ctx, strings.TrimSpace(apartmentID))
	if err != nil {
		return err
	}
	if requiredPlaces > availableSpots {
		return ErrApartmentFull
	}
	return nil
}
