package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/application"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/matching"
	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/profile"
	"github.com/jackc/pgx/v5"
)

const signedAvatarURLTTLSeconds = 3600
const signedPhotoURLTTLSeconds = 3600
const apartmentPhotosBucket = "Apartment_photos"

type imageStorage interface {
	CreateSignedURL(ctx context.Context, bucket string, path string, expiresIn int) (string, error)
}

type repository interface {
	HasActiveApplication(ctx context.Context, apartmentID, tenantID string) (bool, error)
	GetTenantApplicationForApartment(ctx context.Context, apartmentID, tenantID string) (string, string, error)
	CreateTenantApplication(ctx context.Context, apartmentID, tenantID string, compatibilityScore int) (string, error)
	CancelTenantApplication(ctx context.Context, applicationID, tenantID string) (bool, error)
	LeaveAcceptedApartment(ctx context.Context, applicationID, tenantID string) (bool, error)
	ListInterestedTenants(ctx context.Context, apartmentID string) ([]application.InterestedTenantCandidate, error)
	ListTenantApplications(ctx context.Context, tenantID string) ([]application.TenantApplication, error)
	GetGroupApplicationContext(ctx context.Context, groupID, userID string) (*application.GroupApplicationContext, error)
	GetLatestGroupApplicationForApartment(ctx context.Context, apartmentID, groupID string) (*application.Record, error)
	CreateGroupApplication(ctx context.Context, apartmentID, groupID string) (string, error)
	ListOwnerApplications(ctx context.Context, ownerID string) ([]application.OwnerApplication, error)
	GetOwnerApplicationByID(ctx context.Context, applicationID, ownerID string) (*application.OwnerApplication, error)
	ApproveOwnerApplication(ctx context.Context, applicationID, ownerID string) (bool, error)
	RejectOwnerApplication(ctx context.Context, applicationID, ownerID string) (bool, error)
	RemoveAcceptedTenant(ctx context.Context, apartmentID, tenantID, ownerID string) (bool, error)
}

type apartmentReader interface {
	GetApartmentByID(ctx context.Context, apartmentID string) (*apartment.Apartment, error)
}

type profileReader interface {
	GetTenantProfileByUserID(ctx context.Context, userID string) (*profile.TenantProfileInput, error)
}

// ErrTenantRequired is returned when a non-tenant requests tenant-only operations.
var ErrTenantRequired = errors.New("tenant role is required")

// ErrOwnerRequired is returned when a non-owner requests owner-only operations.
var ErrOwnerRequired = errors.New("owner role is required")

// ErrApartmentNotFound is returned when an apartment does not exist.
var ErrApartmentNotFound = errors.New("apartment not found")

// ErrApartmentFull is returned when apartment has no free spots.
var ErrApartmentFull = errors.New("apartment is full")

// ErrApplicationAlreadyExists is returned when tenant already has active application for apartment.
var ErrApplicationAlreadyExists = errors.New("active application already exists")

// ErrApplicationNotCancelable is returned when application cannot be cancelled.
var ErrApplicationNotCancelable = errors.New("application is not cancelable")

// ErrInterestedTenantsForbidden is returned when a user cannot view interested tenants.
var ErrInterestedTenantsForbidden = errors.New("interested tenants are not available for this user")

// ErrGroupNotFound is returned when the group does not exist.
var ErrGroupNotFound = errors.New("group not found")

// ErrGroupNotReady is returned when a group is not fully accepted yet.
var ErrGroupNotReady = errors.New("group is not fully accepted")

// ErrGroupApartmentRequired is returned when a group has no assigned apartment.
var ErrGroupApartmentRequired = errors.New("group apartment is required")

// ErrGroupApplicationForbidden is returned when the user cannot submit the group application.
var ErrGroupApplicationForbidden = errors.New("group application is forbidden")

// ErrOwnerApplicationNotFound is returned when the owner cannot access the application.
var ErrOwnerApplicationNotFound = errors.New("owner application not found")

// ErrOwnerApplicationAlreadyHandled is returned when an application is no longer pending owner review.
var ErrOwnerApplicationAlreadyHandled = errors.New("owner application is not pending")

// ErrOwnerApplicationConflict is returned when approving the application would create an inconsistent state.
var ErrOwnerApplicationConflict = errors.New("owner application conflicts with the current apartment assignment")

const ownerApplicationConflictMessage = "owner application conflicts with the current apartment assignment"

// Service contains application use cases.
type Service struct {
	repo            repository
	apartmentReader apartmentReader
	profileReader   profileReader
	imageStorage    imageStorage
}

// NewService creates the application service.
func NewService(repo repository, apartmentReader apartmentReader, profileReader profileReader, imageStorage imageStorage) *Service {
	return &Service{repo: repo, apartmentReader: apartmentReader, profileReader: profileReader, imageStorage: imageStorage}
}

// GetTenantApplicationForApartment returns the most recent tenant application for an apartment.
func (s *Service) GetTenantApplicationForApartment(ctx context.Context, apartmentID, tenantID string) (string, string, error) {
	return s.repo.GetTenantApplicationForApartment(ctx, apartmentID, tenantID)
}

// ApplyToApartment creates an individual application for a tenant.
func (s *Service) ApplyToApartment(ctx context.Context, apartmentID, tenantID, role string) (string, error) {
	if strings.TrimSpace(apartmentID) == "" {
		return "", errors.New("apartment id is required")
	}
	if strings.TrimSpace(tenantID) == "" {
		return "", errors.New("tenant id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return "", ErrTenantRequired
	}

	apartmentRow, err := s.apartmentReader.GetApartmentByID(ctx, apartmentID)
	if err != nil {
		return "", err
	}
	if apartmentRow == nil {
		return "", ErrApartmentNotFound
	}
	if apartmentRow.TotalSpots-apartmentRow.OccupiedSpots <= 0 {
		return "", ErrApartmentFull
	}

	hasActive, err := s.repo.HasActiveApplication(ctx, apartmentID, tenantID)
	if err != nil {
		return "", err
	}
	if hasActive {
		return "", ErrApplicationAlreadyExists
	}

	tenantProfile, err := s.profileReader.GetTenantProfileByUserID(ctx, tenantID)
	if err != nil {
		return "", err
	}
	compatibilityScore, _ := matching.CalculateCompatibility(*apartmentRow, tenantProfile)

	return s.repo.CreateTenantApplication(ctx, apartmentID, tenantID, compatibilityScore)
}

// ApplyGroupToAssignedApartment creates or returns the current group application for the assigned apartment.
func (s *Service) ApplyGroupToAssignedApartment(ctx context.Context, groupID, userID, role string) (*application.Record, bool, error) {
	trimmedGroupID, trimmedUserID, err := validateGroupApplicationInput(groupID, userID, role)
	if err != nil {
		return nil, false, err
	}

	groupContext, err := s.loadAndValidateGroupApplicationContext(ctx, trimmedGroupID, trimmedUserID)
	if err != nil {
		return nil, false, err
	}
	if err := s.validateGroupApplicationApartment(ctx, groupContext.ApartmentID); err != nil {
		return nil, false, err
	}

	existing, err := s.repo.GetLatestGroupApplicationForApartment(ctx, groupContext.ApartmentID, groupContext.GroupID)
	if err != nil {
		return nil, false, err
	}
	if existing != nil && isActiveApplicationStatus(existing.Status) {
		return existing, false, nil
	}

	if _, err := s.repo.CreateGroupApplication(ctx, groupContext.ApartmentID, groupContext.GroupID); err != nil {
		return nil, false, err
	}

	created, err := s.repo.GetLatestGroupApplicationForApartment(ctx, groupContext.ApartmentID, groupContext.GroupID)
	if err != nil {
		return nil, false, err
	}
	if created == nil {
		return nil, false, errors.New("group application was not created")
	}

	return created, true, nil
}

func validateGroupApplicationInput(groupID, userID, role string) (string, string, error) {
	trimmedGroupID := strings.TrimSpace(groupID)
	if trimmedGroupID == "" {
		return "", "", errors.New("group id is required")
	}
	trimmedUserID := strings.TrimSpace(userID)
	if trimmedUserID == "" {
		return "", "", errors.New("tenant id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return "", "", ErrTenantRequired
	}
	return trimmedGroupID, trimmedUserID, nil
}

func (s *Service) loadAndValidateGroupApplicationContext(ctx context.Context, groupID, userID string) (*application.GroupApplicationContext, error) {
	groupContext, err := s.repo.GetGroupApplicationContext(ctx, groupID, userID)
	if err != nil {
		return nil, err
	}
	if groupContext == nil {
		return nil, ErrGroupNotFound
	}
	if !groupContext.IsCreator && !groupContext.IsMember {
		return nil, ErrGroupApplicationForbidden
	}
	if !groupContext.IsCreator {
		return nil, ErrGroupApplicationForbidden
	}
	if !groupContext.IsFullyAccepted {
		return nil, ErrGroupNotReady
	}
	if strings.TrimSpace(groupContext.ApartmentID) == "" {
		return nil, ErrGroupApartmentRequired
	}
	return groupContext, nil
}

func (s *Service) validateGroupApplicationApartment(ctx context.Context, apartmentID string) error {
	apartmentRow, err := s.apartmentReader.GetApartmentByID(ctx, apartmentID)
	if err != nil {
		return err
	}
	if apartmentRow == nil {
		return ErrApartmentNotFound
	}
	if apartmentRow.TotalSpots-apartmentRow.OccupiedSpots <= 0 {
		return ErrApartmentFull
	}
	return nil
}

// CancelTenantApplication cancels a pending tenant application.
func (s *Service) CancelTenantApplication(ctx context.Context, applicationID, tenantID, role string) error {
	if strings.TrimSpace(applicationID) == "" {
		return errors.New("application id is required")
	}
	if strings.TrimSpace(tenantID) == "" {
		return errors.New("tenant id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return ErrTenantRequired
	}
	updated, err := s.repo.CancelTenantApplication(ctx, applicationID, tenantID)
	if err != nil {
		return err
	}
	if !updated {
		return ErrApplicationNotCancelable
	}
	return nil
}

// LeaveAcceptedApartment lets a tenant leave an already accepted apartment.
func (s *Service) LeaveAcceptedApartment(ctx context.Context, applicationID, tenantID, role string) error {
	if strings.TrimSpace(applicationID) == "" {
		return errors.New("application id is required")
	}
	if strings.TrimSpace(tenantID) == "" {
		return errors.New("tenant id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return ErrTenantRequired
	}
	updated, err := s.repo.LeaveAcceptedApartment(ctx, strings.TrimSpace(applicationID), strings.TrimSpace(tenantID))
	if err != nil {
		return err
	}
	if !updated {
		return ErrApplicationNotCancelable
	}
	return nil
}

// ListInterestedTenants returns currently interested tenants for an apartment.
func (s *Service) ListInterestedTenants(ctx context.Context, apartmentID, viewerID, role string) ([]application.InterestedTenant, error) {
	if strings.TrimSpace(apartmentID) == "" {
		return nil, errors.New("apartment id is required")
	}
	if strings.TrimSpace(viewerID) == "" {
		return nil, ErrInterestedTenantsForbidden
	}
	apartmentRow, err := s.apartmentReader.GetApartmentByID(ctx, apartmentID)
	if err != nil {
		return nil, err
	}
	if apartmentRow == nil {
		return nil, ErrApartmentNotFound
	}
	if err := authorizeInterestedTenantsViewer(apartmentRow, viewerID, role); err != nil {
		return nil, err
	}
	viewerProfile, err := s.profileReader.GetTenantProfileByUserID(ctx, viewerID)
	if err != nil {
		return nil, err
	}
	candidates, err := s.repo.ListInterestedTenants(ctx, apartmentID)
	if err != nil {
		return nil, err
	}
	result := make([]application.InterestedTenant, 0, len(candidates))
	for _, candidate := range candidates {
		if candidate.UserID == viewerID {
			continue
		}
		candidateProfile := &profile.TenantProfileInput{
			UserID:        candidate.UserID,
			BudgetMax:     candidate.BudgetMax,
			PreferredArea: candidate.PreferredArea,
			Pets:          candidate.Pets,
			Smoking:       candidate.Smoking,
			Age:           candidate.Age,
			Situation:     candidate.Situation,
			Degree:        candidate.Degree,
			Profession:    candidate.Profession,
			Socialization: candidate.Socialization,
			Nightlife:     candidate.Nightlife,
		}
		score := matching.CalculateTenantCompatibility(viewerProfile, candidateProfile)
		result = append(result, application.InterestedTenant{
			UserID:        candidate.UserID,
			Name:          candidate.Name,
			Age:           candidate.Age,
			Studies:       candidate.Studies,
			AvatarURL:     candidate.AvatarURL,
			Compatibility: score,
		})
	}
	for idx := range result {
		signedURL, signErr := s.signAvatarURL(ctx, result[idx].AvatarURL)
		if signErr != nil {
			return nil, signErr
		}
		result[idx].AvatarURL = signedURL
	}
	return result, nil
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
		return "", fmt.Errorf("sign application avatar: %w", err)
	}
	return signedURL, nil
}

func (s *Service) signApartmentPhotoURL(ctx context.Context, photoPath string) (string, error) {
	photoPath = strings.TrimSpace(photoPath)
	if photoPath == "" || strings.HasPrefix(photoPath, "http://") || strings.HasPrefix(photoPath, "https://") {
		return photoPath, nil
	}
	if s.imageStorage == nil {
		return "", nil
	}
	signedURL, err := s.imageStorage.CreateSignedURL(ctx, apartmentPhotosBucket, photoPath, signedPhotoURLTTLSeconds)
	if err != nil {
		return "", fmt.Errorf("sign application apartment photo: %w", err)
	}
	return signedURL, nil
}

func authorizeInterestedTenantsViewer(apartmentRow *apartment.Apartment, viewerID, role string) error {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "tenant":
		status := strings.ToUpper(strings.TrimSpace(apartmentRow.Status))
		if status == "CLOSED" || status == "HIDDEN" {
			return ErrApartmentNotFound
		}
		return nil
	case "owner":
		if strings.TrimSpace(apartmentRow.OwnerID) != strings.TrimSpace(viewerID) {
			return ErrInterestedTenantsForbidden
		}
		return nil
	default:
		return ErrInterestedTenantsForbidden
	}
}

// ListTenantApplications returns tenant applications with status and compatibility.
func (s *Service) ListTenantApplications(ctx context.Context, tenantID, role string) ([]application.TenantApplication, error) {
	if strings.TrimSpace(tenantID) == "" {
		return nil, errors.New("tenant id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return nil, ErrTenantRequired
	}
	applications, err := s.repo.ListTenantApplications(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	tenantProfile, err := s.profileReader.GetTenantProfileByUserID(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	for idx := range applications {
		if applications[idx].CompatibilityScore <= 0 {
			apartmentRow, apartmentErr := s.apartmentReader.GetApartmentByID(ctx, applications[idx].ApartmentID)
			if apartmentErr == nil && apartmentRow != nil {
				score, _ := matching.CalculateCompatibility(*apartmentRow, tenantProfile)
				applications[idx].CompatibilityScore = score
			}
		}

		applications[idx].Status = application.MapStatus(applications[idx].Status)
		applications[idx].DateLabel = application.BuildDateLabel(applications[idx].Status, applications[idx].CreatedAt)
		applications[idx].RequestType = buildTenantRequestTypeLabel(applications[idx])
		applications[idx].StatusMessage = buildTenantApplicationStatusMessage(applications[idx])
		isGroup := strings.EqualFold(strings.TrimSpace(applications[idx].Type), "group")
		isGroupCreator := isGroup && applications[idx].SubmittedByUserID == tenantID
		applications[idx].CanCancel = applications[idx].Status == "pending" && (!isGroup || isGroupCreator)

		signedImageURL, signErr := s.signApartmentPhotoURL(ctx, applications[idx].ImageURL)
		if signErr == nil {
			applications[idx].ImageURL = signedImageURL
		}
	}
	return applications, nil
}

func buildTenantRequestTypeLabel(item application.TenantApplication) string {
	if strings.EqualFold(strings.TrimSpace(item.Type), "group") {
		if strings.TrimSpace(item.GroupName) != "" {
			return "Solicitud de grupo · " + item.GroupName
		}
		return "Solicitud de grupo"
	}
	return "Solicitud individual"
}

func buildTenantApplicationStatusMessage(item application.TenantApplication) string {
	if !strings.EqualFold(strings.TrimSpace(item.Type), "group") {
		return application.BuildStatusMessage(item.Status)
	}

	submitterName := strings.TrimSpace(item.SubmittedByName)
	if submitterName == "" {
		submitterName = "la persona creadora del grupo"
	}

	switch item.Status {
	case "approved":
		return "La solicitud grupal enviada por " + submitterName + " ha sido aceptada por el propietario."
	case "rejected":
		return "El propietario ha rechazado la solicitud grupal de este piso."
	case "cancelled":
		return "La solicitud grupal fue cancelada."
	default:
		return "La solicitud grupal enviada por " + submitterName + " esta pendiente de revision por el propietario."
	}
}

// ListOwnerApplications returns individual and group applications received by the owner.
func (s *Service) ListOwnerApplications(ctx context.Context, ownerID, role string) ([]application.OwnerApplication, error) {
	if strings.TrimSpace(ownerID) == "" {
		return nil, errors.New("owner id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "owner" {
		return nil, ErrOwnerRequired
	}

	applications, err := s.repo.ListOwnerApplications(ctx, strings.TrimSpace(ownerID))
	if err != nil {
		return nil, err
	}
	s.enrichOwnerApplicationCompatibility(ctx, applications)
	if err := s.signOwnerApplications(ctx, applications); err != nil {
		return nil, err
	}
	return applications, nil
}

// GetOwnerApplicationByID returns one received application with its full details.
func (s *Service) GetOwnerApplicationByID(ctx context.Context, applicationID, ownerID, role string) (*application.OwnerApplication, error) {
	if strings.TrimSpace(applicationID) == "" {
		return nil, errors.New("application id is required")
	}
	if strings.TrimSpace(ownerID) == "" {
		return nil, errors.New("owner id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "owner" {
		return nil, ErrOwnerRequired
	}

	item, err := s.repo.GetOwnerApplicationByID(ctx, strings.TrimSpace(applicationID), strings.TrimSpace(ownerID))
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, ErrOwnerApplicationNotFound
	}
	applications := []application.OwnerApplication{*item}
	s.enrichOwnerApplicationCompatibility(ctx, applications)
	if err := s.signOwnerApplications(ctx, applications); err != nil {
		return nil, err
	}
	return &applications[0], nil
}

// ApproveOwnerApplication approves a pending application belonging to the owner.
func (s *Service) ApproveOwnerApplication(ctx context.Context, applicationID, ownerID, role string) error {
	if strings.TrimSpace(applicationID) == "" {
		return errors.New("application id is required")
	}
	if strings.TrimSpace(ownerID) == "" {
		return errors.New("owner id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "owner" {
		return ErrOwnerRequired
	}

	updated, err := s.repo.ApproveOwnerApplication(ctx, strings.TrimSpace(applicationID), strings.TrimSpace(ownerID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrOwnerApplicationNotFound
		}
		if isOwnerApplicationConflictError(err) {
			return ErrOwnerApplicationConflict
		}
		return err
	}
	if !updated {
		return ErrOwnerApplicationAlreadyHandled
	}
	return nil
}

func isActiveApplicationStatus(status string) bool {
	switch strings.ToUpper(strings.TrimSpace(status)) {
	case "PENDING_OWNER", "PENDING_CONFIRMED_TENANTS":
		return true
	default:
		return false
	}
}

func isOwnerApplicationConflictError(err error) bool {
	return err != nil && err.Error() == ownerApplicationConflictMessage
}

// RejectOwnerApplication rejects a pending application belonging to the owner.
func (s *Service) RejectOwnerApplication(ctx context.Context, applicationID, ownerID, role string) error {
	if strings.TrimSpace(applicationID) == "" {
		return errors.New("application id is required")
	}
	if strings.TrimSpace(ownerID) == "" {
		return errors.New("owner id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "owner" {
		return ErrOwnerRequired
	}

	updated, err := s.repo.RejectOwnerApplication(ctx, strings.TrimSpace(applicationID), strings.TrimSpace(ownerID))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrOwnerApplicationNotFound
		}
		return err
	}
	if !updated {
		return ErrOwnerApplicationAlreadyHandled
	}
	return nil
}

// RemoveAcceptedTenant lets an owner remove an accepted tenant from one owned apartment.
func (s *Service) RemoveAcceptedTenant(ctx context.Context, apartmentID, tenantID, ownerID, role string) error {
	if strings.TrimSpace(apartmentID) == "" {
		return errors.New("apartment id is required")
	}
	if strings.TrimSpace(tenantID) == "" {
		return errors.New("tenant id is required")
	}
	if strings.TrimSpace(ownerID) == "" {
		return errors.New("owner id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "owner" {
		return ErrOwnerRequired
	}
	updated, err := s.repo.RemoveAcceptedTenant(ctx, strings.TrimSpace(apartmentID), strings.TrimSpace(tenantID), strings.TrimSpace(ownerID))
	if err != nil {
		return err
	}
	if !updated {
		return ErrOwnerApplicationNotFound
	}
	return nil
}

func (s *Service) enrichOwnerApplicationCompatibility(ctx context.Context, applications []application.OwnerApplication) {
	for idx := range applications {
		if applications[idx].Type == "individual" && applications[idx].Tenant != nil {
			s.enrichIndividualCompatibility(ctx, &applications[idx])
		} else if applications[idx].Type == "group" && applications[idx].Group != nil {
			s.enrichGroupCompatibility(ctx, &applications[idx])
		}
	}
}

func (s *Service) enrichIndividualCompatibility(ctx context.Context, app *application.OwnerApplication) {
	tenantProfile, err := s.profileReader.GetTenantProfileByUserID(ctx, app.Tenant.UserID)
	if err != nil {
		return
	}
	apartmentRow, err := s.apartmentReader.GetApartmentByID(ctx, app.ApartmentID)
	if err != nil || apartmentRow == nil {
		return
	}
	score, _ := matching.CalculateCompatibility(*apartmentRow, tenantProfile)
	app.CompatibilityScore = score
}

func (s *Service) enrichGroupCompatibility(ctx context.Context, app *application.OwnerApplication) {
	apartmentRow, err := s.apartmentReader.GetApartmentByID(ctx, app.ApartmentID)
	if err != nil || apartmentRow == nil {
		return
	}
	total := 0
	count := 0
	for idx := range app.Group.Members {
		memberProfile, err := s.profileReader.GetTenantProfileByUserID(ctx, app.Group.Members[idx].UserID)
		if err != nil {
			continue
		}
		score, _ := matching.CalculateCompatibility(*apartmentRow, memberProfile)
		app.Group.Members[idx].CompatibilityScore = score
		total += score
		count++
	}
	if count > 0 {
		app.CompatibilityScore = total / count
	}
}

func (s *Service) signOwnerApplications(ctx context.Context, applications []application.OwnerApplication) error {
	for idx := range applications {
		if applications[idx].Tenant != nil {
			signedURL, err := s.signAvatarURL(ctx, applications[idx].Tenant.AvatarURL)
			if err != nil {
				return err
			}
			applications[idx].Tenant.AvatarURL = signedURL
		}
		if applications[idx].Group != nil {
			signedCreatorURL, err := s.signAvatarURL(ctx, applications[idx].Group.Creator.AvatarURL)
			if err != nil {
				return err
			}
			applications[idx].Group.Creator.AvatarURL = signedCreatorURL
			for memberIdx := range applications[idx].Group.Members {
				signedMemberURL, err := s.signAvatarURL(ctx, applications[idx].Group.Members[memberIdx].AvatarURL)
				if err != nil {
					return err
				}
				applications[idx].Group.Members[memberIdx].AvatarURL = signedMemberURL
			}
		}
	}
	return nil
}
