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
	IsGroupCreator(ctx context.Context, groupID, userID string) (bool, error)
	UpdateGroupApartment(ctx context.Context, groupID string, apartmentID *string) error
	FilterExistingTenantIDs(ctx context.Context, userIDs []string) ([]string, error)
}

var (
	ErrTenantRequired       = errors.New("tenant role is required")
	ErrGroupNotFound        = errors.New("group not found")
	ErrForbidden            = errors.New("forbidden")
	ErrInvitationNotFound   = errors.New("invitation not found")
	ErrInvitationNotPending = errors.New("invitation is not pending")
	ErrApartmentFull        = errors.New("group exceeds apartment available spots")
	ErrNoValidInvitedUsers  = errors.New("no valid invited users found")
)

type Service struct {
	repo repository
}

func NewService(repo repository) *Service {
	return &Service{repo: repo}
}

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

func (s *Service) ListGroupCandidates(ctx context.Context, currentUserID, role string, filters group.CandidateFilters) ([]group.Candidate, error) {
	if err := validateTenant(currentUserID, role); err != nil {
		return nil, err
	}

	filters.Search = strings.TrimSpace(filters.Search)
	filters.University = strings.TrimSpace(filters.University)

	return s.repo.ListGroupCandidates(ctx, strings.TrimSpace(currentUserID), filters)
}

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
