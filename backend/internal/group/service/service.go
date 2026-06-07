package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/group"
)

const (
	signedAvatarURLTTLSeconds = 3600
	apartmentPhotosBucket     = "Apartment_photos"
	signedImageURLTTLSeconds  = 3600
)

type imageStorage interface {
	CreateSignedURL(ctx context.Context, bucket string, path string, expiresIn int) (string, error)
}

type repository interface {
	ListTenantGroups(ctx context.Context, userID string, filters group.ListGroupsFilters) ([]group.Group, error)
	GetTenantGroupByID(ctx context.Context, groupID, userID string) (*group.Group, error)
	CreateGroup(ctx context.Context, creatorID string, input group.CreateGroupInput) (string, error)
	AddGroupOwnerMember(ctx context.Context, groupID, creatorID string) error
	DeleteGroup(ctx context.Context, groupID string) error
	CreatePendingInvitations(ctx context.Context, groupID, invitedBy string, invitedUserIDs []string) error
	ListGroupCandidates(ctx context.Context, currentUserID string, filters group.CandidateFilters) ([]group.Candidate, error)
	FilterInvitableTenantIDs(ctx context.Context, groupID string, userIDs []string) ([]string, error)
	GetApartmentCapacity(ctx context.Context, apartmentID string) (int, error)
	CountAcceptedMembersAndPendingInvitations(ctx context.Context, groupID string) (int, error)
	GetInvitationForUser(ctx context.Context, invitationID, userID string) (*group.Invitation, error)
	AcceptInvitation(ctx context.Context, invitationID, userID string) error
	RejectInvitation(ctx context.Context, invitationID, userID string) error
	AddGroupMember(ctx context.Context, groupID, userID, role string) error
	LeaveGroup(ctx context.Context, groupID, userID string) error
	CanUserAcceptGroup(ctx context.Context, groupID, userID string) (bool, error)
	AcceptGroupForUser(ctx context.Context, groupID, userID string) error
	HasPendingJoinRequest(ctx context.Context, groupID, requesterUserID string) (bool, error)
	HasRejectedJoinRequest(ctx context.Context, groupID, requesterUserID string) (bool, error)
	CreateJoinRequest(ctx context.Context, groupID, requesterUserID, source string) (string, error)
	ListJoinRequests(ctx context.Context, groupID string) ([]group.JoinRequest, error)
	CanUserReviewJoinRequests(ctx context.Context, groupID, userID string) (bool, error)
	CanUserVoteJoinRequest(ctx context.Context, requestID, voterUserID string) (bool, error)
	VoteJoinRequest(ctx context.Context, requestID, voterUserID, decision string) error
	FinalizeJoinRequestApproval(ctx context.Context, requestID string) (string, bool, error)
	CancelJoinRequest(ctx context.Context, requestID, requesterUserID string) error
	IsGroupCreator(ctx context.Context, groupID, userID string) (bool, error)
	UpdateGroupApartment(ctx context.Context, groupID string, apartmentID *string) error
	FilterExistingTenantIDs(ctx context.Context, userIDs []string) ([]string, error)
	HasUserGroupForApartment(ctx context.Context, userID, apartmentID string) (bool, error)
	GetMyGroupForApartment(ctx context.Context, userID, apartmentID string) (*group.Group, error)
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

// ErrJoinRequestAlreadyRejected is returned when the user already has a rejected join request for the group.
var ErrJoinRequestAlreadyRejected = errors.New("join request already rejected")

// ErrJoinRequestNotFound is returned when the requested join request does not exist.
var ErrJoinRequestNotFound = errors.New("join request not found")

// ErrGroupApartmentAlreadyAssigned is returned when the group already has a linked apartment.
var ErrGroupApartmentAlreadyAssigned = errors.New("group apartment already assigned")

// ErrGroupApartmentRemovalNotAllowed is returned when trying to remove a linked apartment.
var ErrGroupApartmentRemovalNotAllowed = errors.New("group apartment removal is not allowed")

// ErrGroupAlreadyExistsForApartment is returned when the user already has a group for this apartment.
var ErrGroupAlreadyExistsForApartment = errors.New("you already have a group for this apartment")

// Service contains tenant group business logic.
type Service struct {
	repo         repository
	imageStorage imageStorage
}

// NewService creates a tenant group service.
func NewService(repo repository, imageStorage imageStorage) *Service {
	return &Service{repo: repo, imageStorage: imageStorage}
}

// ListTenantGroups returns the groups related to the authenticated tenant.
func (s *Service) ListTenantGroups(ctx context.Context, userID, role string, filters group.ListGroupsFilters) ([]group.Group, error) {
	if err := validateTenant(userID, role); err != nil {
		return nil, err
	}

	filters.Search = strings.TrimSpace(filters.Search)
	filters.Status = normalizeTenantGroupStatusFilter(filters.Status)
	filters.HasApartment = strings.ToLower(strings.TrimSpace(filters.HasApartment))
	filters.SortBy = strings.ToLower(strings.TrimSpace(filters.SortBy))
	filters.Scope = strings.ToLower(strings.TrimSpace(filters.Scope))

	if filters.SortBy == "" {
		filters.SortBy = "recent"
	}
	if filters.Scope != "discoverable" {
		filters.Scope = "my"
	}

	groups, err := s.repo.ListTenantGroups(ctx, strings.TrimSpace(userID), filters)
	if err != nil {
		return nil, err
	}
	if err := s.signGroups(ctx, groups); err != nil {
		return nil, err
	}
	return groups, nil
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

	if err := s.signGroup(ctx, result); err != nil {
		return nil, err
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
		alreadyHas, err := s.repo.HasUserGroupForApartment(ctx, strings.TrimSpace(creatorID), input.ApartmentID)
		if err != nil {
			return "", err
		}
		if alreadyHas {
			return "", ErrGroupAlreadyExistsForApartment
		}
		if err := s.ensureApartmentHasCapacity(ctx, input.ApartmentID, 1); err != nil {
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

	if err := s.repo.AcceptGroupForUser(ctx, groupID, strings.TrimSpace(creatorID)); err != nil {
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
	filters.GroupID = strings.TrimSpace(filters.GroupID)
	if filters.GroupID != "" {
		canInvite, err := s.repo.CanUserReviewJoinRequests(ctx, filters.GroupID, strings.TrimSpace(currentUserID))
		if err != nil {
			return nil, err
		}
		if !canInvite {
			return nil, ErrForbidden
		}
	}

	candidates, err := s.repo.ListGroupCandidates(ctx, strings.TrimSpace(currentUserID), filters)
	if err != nil {
		return nil, err
	}
	if err := s.signCandidates(ctx, candidates); err != nil {
		return nil, err
	}
	return candidates, nil
}

// InviteUsers invites tenant candidates to an existing group.
func (s *Service) InviteUsers(ctx context.Context, groupID, userID, role string, invitedUserIDs []string) error {
	if err := validateTenant(userID, role); err != nil {
		return err
	}
	groupID = strings.TrimSpace(groupID)
	userID = strings.TrimSpace(userID)
	if groupID == "" {
		return errors.New("group id is required")
	}

	groupDetail, err := s.repo.GetTenantGroupByID(ctx, groupID, userID)
	if err != nil {
		return err
	}
	if groupDetail == nil {
		return ErrGroupNotFound
	}

	canInvite, err := s.repo.CanUserReviewJoinRequests(ctx, groupID, userID)
	if err != nil {
		return err
	}
	if !canInvite {
		return ErrForbidden
	}

	invitedUserIDs = normalizeUserIDs(invitedUserIDs, userID)
	validInvitedUserIDs, err := s.repo.FilterInvitableTenantIDs(ctx, groupID, invitedUserIDs)
	if err != nil {
		return err
	}
	if len(validInvitedUserIDs) == 0 {
		return ErrNoValidInvitedUsers
	}
	if groupDetail.Apartment != nil && len(groupDetail.Members) >= groupDetail.Apartment.TotalSpots {
		return ErrApartmentFull
	}

	return s.repo.CreatePendingInvitations(ctx, groupID, userID, validInvitedUserIDs)
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
	if groupDetail.Apartment != nil && len(groupDetail.Members) >= groupDetail.Apartment.TotalSpots {
		return ErrApartmentFull
	}

	if err := s.repo.AcceptInvitation(ctx, strings.TrimSpace(invitationID), strings.TrimSpace(userID)); err != nil {
		return err
	}

	hasPending, err := s.repo.HasPendingJoinRequest(ctx, invitation.GroupID, strings.TrimSpace(userID))
	if err != nil {
		return err
	}
	if hasPending {
		return ErrJoinRequestAlreadyPending
	}

	_, err = s.repo.CreateJoinRequest(ctx, invitation.GroupID, strings.TrimSpace(userID), group.JoinRequestSourceGroupInvitation)
	return err
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

// DeleteGroup deletes a tenant group. Only the creator can delete it.
func (s *Service) DeleteGroup(ctx context.Context, groupID, userID, role string) error {
	if err := validateTenant(userID, role); err != nil {
		return err
	}
	groupID = strings.TrimSpace(groupID)
	userID = strings.TrimSpace(userID)
	if groupID == "" {
		return errors.New("group id is required")
	}

	groupDetail, err := s.repo.GetTenantGroupByID(ctx, groupID, userID)
	if err != nil {
		return err
	}
	if groupDetail == nil {
		return ErrGroupNotFound
	}

	isCreator, err := s.repo.IsGroupCreator(ctx, groupID, userID)
	if err != nil {
		return err
	}
	if !isCreator {
		return ErrForbidden
	}

	return s.repo.DeleteGroup(ctx, groupID)
}

// LeaveGroup removes an accepted non-owner member from a tenant group.
func (s *Service) LeaveGroup(ctx context.Context, groupID, userID, role string) error {
	if err := validateTenant(userID, role); err != nil {
		return err
	}
	groupID = strings.TrimSpace(groupID)
	userID = strings.TrimSpace(userID)
	if groupID == "" {
		return errors.New("group id is required")
	}

	groupDetail, err := s.repo.GetTenantGroupByID(ctx, groupID, userID)
	if err != nil {
		return err
	}
	if groupDetail == nil {
		return ErrGroupNotFound
	}
	if groupDetail.UserRelation != group.UserRelationMember {
		return ErrForbidden
	}

	return s.repo.LeaveGroup(ctx, groupID, userID)
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

	hasRejected, err := s.repo.HasRejectedJoinRequest(ctx, groupID, userID)
	if err != nil {
		return "", err
	}
	if hasRejected {
		return "", ErrJoinRequestAlreadyRejected
	}

	return s.repo.CreateJoinRequest(ctx, groupID, userID, group.JoinRequestSourceDirectRequest)
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

	joinRequests, err := s.repo.ListJoinRequests(ctx, groupID)
	if err != nil {
		return nil, err
	}
	if err := s.signJoinRequests(ctx, joinRequests); err != nil {
		return nil, err
	}
	return joinRequests, nil
}

func (s *Service) signGroups(ctx context.Context, groups []group.Group) error {
	for idx := range groups {
		if err := s.signGroup(ctx, &groups[idx]); err != nil {
			return err
		}
	}
	return nil
}

func (s *Service) signGroup(ctx context.Context, item *group.Group) error {
	for idx := range item.Members {
		signedURL, err := s.signAvatarURL(ctx, item.Members[idx].AvatarURL)
		if err != nil {
			return err
		}
		item.Members[idx].AvatarURL = signedURL
	}
	for idx := range item.PendingInvitations {
		signedURL, err := s.signAvatarURL(ctx, item.PendingInvitations[idx].User.AvatarURL)
		if err != nil {
			return err
		}
		item.PendingInvitations[idx].User.AvatarURL = signedURL
	}
	for idx := range item.JoinRequests {
		signedURL, err := s.signAvatarURL(ctx, item.JoinRequests[idx].Requester.AvatarURL)
		if err != nil {
			return err
		}
		item.JoinRequests[idx].Requester.AvatarURL = signedURL
	}
	if item.Apartment != nil {
		signedURL, err := s.signApartmentImageURL(ctx, item.Apartment.ImageURL)
		if err != nil {
			return err
		}
		item.Apartment.ImageURL = signedURL
	}
	return nil
}

func (s *Service) signCandidates(ctx context.Context, candidates []group.Candidate) error {
	for idx := range candidates {
		signedURL, err := s.signAvatarURL(ctx, candidates[idx].AvatarURL)
		if err != nil {
			return err
		}
		candidates[idx].AvatarURL = signedURL
	}
	return nil
}

func (s *Service) signJoinRequests(ctx context.Context, joinRequests []group.JoinRequest) error {
	for idx := range joinRequests {
		signedURL, err := s.signAvatarURL(ctx, joinRequests[idx].Requester.AvatarURL)
		if err != nil {
			return err
		}
		joinRequests[idx].Requester.AvatarURL = signedURL
	}
	return nil
}

func (s *Service) signAvatarURL(ctx context.Context, avatarURL string) (string, error) {
	avatarURL = strings.TrimSpace(avatarURL)
	if avatarURL == "" || strings.HasPrefix(avatarURL, "http://") || strings.HasPrefix(avatarURL, "https://") || strings.HasPrefix(avatarURL, "data:image/") {
		return avatarURL, nil
	}
	if s.imageStorage == nil {
		return "", nil
	}
	signedURL, err := s.imageStorage.CreateSignedURL(ctx, "profile-avatars", avatarURL, signedAvatarURLTTLSeconds)
	if err != nil {
		return "", fmt.Errorf("sign group avatar: %w", err)
	}
	return signedURL, nil
}

func (s *Service) signApartmentImageURL(ctx context.Context, imagePath string) (string, error) {
	imagePath = strings.TrimSpace(imagePath)
	if imagePath == "" {
		return "", nil
	}
	if strings.HasPrefix(imagePath, "http://") || strings.HasPrefix(imagePath, "https://") {
		return imagePath, nil
	}
	if s.imageStorage == nil {
		return "", nil
	}
	signedURL, err := s.imageStorage.CreateSignedURL(ctx, apartmentPhotosBucket, imagePath, signedImageURLTTLSeconds)
	if err != nil {
		return "", fmt.Errorf("sign group apartment image: %w", err)
	}
	return signedURL, nil
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

	return s.finalizeApprovedJoinRequestIfNeeded(ctx, requestID)
}

// finalizeApprovedJoinRequestIfNeeded resolves the request status and, if approved, adds the requester as member.
func (s *Service) finalizeApprovedJoinRequestIfNeeded(ctx context.Context, requestID string) error {
	_, _, err := s.repo.FinalizeJoinRequestApproval(ctx, requestID)
	return err
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

	groupDetail, err := s.repo.GetTenantGroupByID(ctx, strings.TrimSpace(groupID), strings.TrimSpace(userID))
	if err != nil {
		return err
	}
	if groupDetail == nil {
		return ErrGroupNotFound
	}

	apartmentID := strings.TrimSpace(input.ApartmentID)
	if apartmentID == "" {
		return ErrGroupApartmentRemovalNotAllowed
	}

	if groupDetail.Apartment != nil {
		return ErrGroupApartmentAlreadyAssigned
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

func normalizeTenantGroupStatusFilter(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case "request_sent":
		return "REQUEST_SENT"
	case "accepted":
		return "ACCEPTED"
	case "rejected":
		return "REJECTED"
	case "closed":
		return "CLOSED"
	case "all", "":
		return ""
	default:
		return ""
	}
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

// GetMyGroupForApartment returns the active group the user belongs to for the given apartment, or nil.
func (s *Service) GetMyGroupForApartment(ctx context.Context, userID, role, apartmentID string) (*group.Group, error) {
	if err := validateTenant(userID, role); err != nil {
		return nil, err
	}
	apartmentID = strings.TrimSpace(apartmentID)
	if apartmentID == "" {
		return nil, errors.New("apartment id is required")
	}
	result, err := s.repo.GetMyGroupForApartment(ctx, strings.TrimSpace(userID), apartmentID)
	if err != nil {
		return nil, err
	}
	if result == nil {
		return nil, nil
	}
	if err := s.signGroup(ctx, result); err != nil {
		return nil, err
	}
	return result, nil
}

func (s *Service) ensureApartmentHasCapacity(ctx context.Context, apartmentID string, requiredPlaces int) error {
	totalSpots, err := s.repo.GetApartmentCapacity(ctx, strings.TrimSpace(apartmentID))
	if err != nil {
		return err
	}
	if requiredPlaces > totalSpots {
		return ErrApartmentFull
	}
	return nil
}
