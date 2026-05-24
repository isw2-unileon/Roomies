package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"

	"github.com/isw2-unileon/proyect-scaffolding/backend/internal/apartment"
)

type repository interface {
	CreateApartment(ctx context.Context, ownerID string, input apartment.CreateApartmentInput) (string, int, error)
	ListOwnerApartments(ctx context.Context, ownerID string) ([]apartment.Apartment, error)
	ListAvailableApartments(ctx context.Context, filters apartment.ListApartmentsFilters) ([]apartment.Apartment, error)
	GetApartmentByID(ctx context.Context, apartmentID string) (*apartment.Apartment, error)
	GetApartmentRules(ctx context.Context, apartmentID string) (*apartment.Rules, error)
	GetTenantProfileByUserID(ctx context.Context, userID string) (*apartment.TenantProfile, error)
	HasActiveApplication(ctx context.Context, apartmentID, tenantID string) (bool, error)
	GetTenantApplicationForApartment(ctx context.Context, apartmentID, tenantID string) (string, string, error)
	CreateTenantApplication(ctx context.Context, apartmentID, tenantID string, compatibilityScore int) (string, error)
	CancelTenantApplication(ctx context.Context, applicationID, tenantID string) (bool, error)
	ListInterestedTenants(ctx context.Context, apartmentID string) ([]apartment.InterestedTenantCandidate, error)
	ListTenantApplications(ctx context.Context, tenantID string) ([]apartment.TenantApplication, error)
}

type imageURLSigner interface {
	CreateSignedURL(ctx context.Context, bucket string, path string, expiresIn int) (string, error)
}

const (
	apartmentPhotosBucket    = "Apartment_photos"
	signedImageURLTTLSeconds = 3600
)

// ErrOwnerRequired is returned when a non-owner tries to publish an apartment.
var ErrOwnerRequired = errors.New("owner role is required")

// ErrTenantRequired is returned when a non-tenant requests tenant-only operations.
var ErrTenantRequired = errors.New("tenant role is required")

// ErrApartmentNotFound is returned when an apartment does not exist.
var ErrApartmentNotFound = errors.New("apartment not found")

// ErrApartmentFull is returned when apartment has no free spots.
var ErrApartmentFull = errors.New("apartment is full")

// ErrApplicationAlreadyExists is returned when tenant already has active application for apartment.
var ErrApplicationAlreadyExists = errors.New("active application already exists")

// ErrApplicationNotCancelable is returned when application cannot be cancelled.
var ErrApplicationNotCancelable = errors.New("application is not cancelable")

// Service contains apartment use cases.
type Service struct {
	repo        repository
	imageSigner imageURLSigner
}

// NewService creates the apartment service.
func NewService(repo repository, imageSigner imageURLSigner) *Service {
	return &Service{repo: repo, imageSigner: imageSigner}
}

// CreateApartment validates and stores a new owner apartment listing.
func (s *Service) CreateApartment(ctx context.Context, ownerID, role string, input apartment.CreateApartmentInput) (*apartment.CreateApartmentResult, error) {
	if strings.TrimSpace(ownerID) == "" {
		return nil, errors.New("owner id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "owner" {
		return nil, ErrOwnerRequired
	}
	if strings.TrimSpace(input.Title) == "" {
		return nil, errors.New("title is required")
	}
	if strings.TrimSpace(input.Address) == "" {
		return nil, errors.New("address is required")
	}
	if input.TotalSpots <= 0 {
		return nil, errors.New("total_spots must be greater than zero")
	}
	if input.Bathrooms <= 0 {
		return nil, errors.New("bathrooms must be greater than zero")
	}
	if input.BaseRent <= 0 {
		return nil, errors.New("base_rent must be greater than zero")
	}

	input.Title = strings.TrimSpace(input.Title)
	input.Description = buildDescription(input.Description, input.Bathrooms, input.AvailableFrom)
	input.Address = strings.TrimSpace(input.Address)
	input.Area = strings.TrimSpace(input.Area)
	input.AvailableFrom = strings.TrimSpace(input.AvailableFrom)
	input.Status = apartment.StatusAvailable

	apartmentID, imagesStored, err := s.repo.CreateApartment(ctx, ownerID, input)
	if err != nil {
		return nil, err
	}

	return &apartment.CreateApartmentResult{
		ApartmentID:  apartmentID,
		ImagesStored: imagesStored,
	}, nil
}

func buildDescription(description string, bathrooms int, availableFrom string) string {
	descriptionParts := make([]string, 0, 3)
	if strings.TrimSpace(description) != "" {
		descriptionParts = append(descriptionParts, strings.TrimSpace(description))
	}
	descriptionParts = append(descriptionParts, fmt.Sprintf("Banos: %d", bathrooms))
	if strings.TrimSpace(availableFrom) != "" {
		descriptionParts = append(descriptionParts, fmt.Sprintf("Disponible desde: %s", strings.TrimSpace(availableFrom)))
	}
	return strings.Join(descriptionParts, "\n\n")
}

// ListOwnerApartments returns published apartments for an owner.
func (s *Service) ListOwnerApartments(ctx context.Context, ownerID, role string) ([]apartment.Apartment, error) {
	if strings.TrimSpace(ownerID) == "" {
		return nil, errors.New("owner id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "owner" {
		return nil, ErrOwnerRequired
	}
	apartments, err := s.repo.ListOwnerApartments(ctx, ownerID)
	if err != nil {
		return nil, err
	}
	return s.signApartmentImages(ctx, apartments)
}

// ListAvailableApartments returns tenant-visible apartment listings.
func (s *Service) ListAvailableApartments(ctx context.Context) ([]apartment.Apartment, error) {
	return s.ListAvailableApartmentsFiltered(ctx, apartment.ListApartmentsFilters{})
}

// ListAvailableApartmentsFiltered returns tenant-visible apartment listings with filters.
func (s *Service) ListAvailableApartmentsFiltered(ctx context.Context, filters apartment.ListApartmentsFilters) ([]apartment.Apartment, error) {
	normalized := normalizeListApartmentsFilters(filters)
	apartments, err := s.repo.ListAvailableApartments(ctx, normalized)
	if err != nil {
		return nil, err
	}
	return s.signApartmentImages(ctx, apartments)
}

func normalizeListApartmentsFilters(filters apartment.ListApartmentsFilters) apartment.ListApartmentsFilters {
	filters.Query = strings.TrimSpace(filters.Query)
	filters.Area = strings.TrimSpace(filters.Area)
	filters.Availability = strings.ToLower(strings.TrimSpace(filters.Availability))
	filters.SortBy = strings.ToLower(strings.TrimSpace(filters.SortBy))

	if filters.PriceMin < 0 {
		filters.PriceMin = 0
	}
	if filters.PriceMax <= 0 {
		filters.PriceMax = 100000
	}
	if filters.PriceMin > filters.PriceMax {
		filters.PriceMin, filters.PriceMax = filters.PriceMax, filters.PriceMin
	}

	if filters.TotalRoomsMin < 0 {
		filters.TotalRoomsMin = 0
	}
	if filters.TotalRoomsMax <= 0 {
		filters.TotalRoomsMax = 100000
	}
	if filters.TotalRoomsMin > filters.TotalRoomsMax {
		filters.TotalRoomsMin, filters.TotalRoomsMax = filters.TotalRoomsMax, filters.TotalRoomsMin
	}

	if filters.AvailableRoomsMin < 0 {
		filters.AvailableRoomsMin = 0
	}
	if filters.AvailableRoomsMax <= 0 {
		filters.AvailableRoomsMax = 100000
	}
	if filters.AvailableRoomsMin > filters.AvailableRoomsMax {
		filters.AvailableRoomsMin, filters.AvailableRoomsMax = filters.AvailableRoomsMax, filters.AvailableRoomsMin
	}

	if filters.Availability != "available" && filters.Availability != "soon" && filters.Availability != "all" {
		filters.Availability = "all"
	}

	switch filters.SortBy {
	case "price_low", "price_high", "rooms", "newest", "relevance":
	default:
		filters.SortBy = "relevance"
	}

	return filters
}

// GetApartmentDetailForTenant returns apartment detail and compatibility data for a tenant.
func (s *Service) GetApartmentDetailForTenant(ctx context.Context, apartmentID, tenantID, role string) (*apartment.Detail, error) {
	if strings.TrimSpace(apartmentID) == "" {
		return nil, errors.New("apartment id is required")
	}
	if strings.TrimSpace(tenantID) == "" {
		return nil, errors.New("tenant id is required")
	}
	if strings.ToLower(strings.TrimSpace(role)) != "tenant" {
		return nil, ErrTenantRequired
	}

	apartmentRow, err := s.repo.GetApartmentByID(ctx, apartmentID)
	if err != nil {
		return nil, err
	}
	if apartmentRow == nil {
		return nil, ErrApartmentNotFound
	}

	rules, err := s.repo.GetApartmentRules(ctx, apartmentID)
	if err != nil {
		return nil, err
	}

	tenantProfile, err := s.repo.GetTenantProfileByUserID(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	compatibilityScore, compatibilityReason := calculateCompatibility(*apartmentRow, rules, tenantProfile)
	apartmentsWithImage, err := s.signApartmentImages(ctx, []apartment.Apartment{*apartmentRow})
	if err != nil {
		return nil, err
	}

	applicationID, applicationStatus, err := s.repo.GetTenantApplicationForApartment(ctx, apartmentID, tenantID)
	if err != nil {
		return nil, err
	}
	mappedStatus := mapApplicationStatus(applicationStatus)
	canApply := strings.TrimSpace(applicationID) == "" || mappedStatus == "cancelled" || mappedStatus == "rejected"
	canCancel := mappedStatus == "pending"

	return &apartment.Detail{
		Apartment:                apartmentsWithImage[0],
		Rules:                    derefRules(rules),
		CompatibilityScore:       compatibilityScore,
		CompatibilityReason:      compatibilityReason,
		CurrentApplicationID:     applicationID,
		CurrentApplicationStatus: mappedStatus,
		CanApply:                 canApply,
		CanCancel:                canCancel,
	}, nil
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

	apartmentRow, err := s.repo.GetApartmentByID(ctx, apartmentID)
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

	rules, err := s.repo.GetApartmentRules(ctx, apartmentID)
	if err != nil {
		return "", err
	}
	tenantProfile, err := s.repo.GetTenantProfileByUserID(ctx, tenantID)
	if err != nil {
		return "", err
	}
	compatibilityScore, _ := calculateCompatibility(*apartmentRow, rules, tenantProfile)

	return s.repo.CreateTenantApplication(ctx, apartmentID, tenantID, compatibilityScore)
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

// ListInterestedTenants returns currently interested tenants for an apartment.
func (s *Service) ListInterestedTenants(ctx context.Context, apartmentID string) ([]apartment.InterestedTenant, error) {
	if strings.TrimSpace(apartmentID) == "" {
		return nil, errors.New("apartment id is required")
	}
	apartmentRow, err := s.repo.GetApartmentByID(ctx, apartmentID)
	if err != nil {
		return nil, err
	}
	if apartmentRow == nil {
		return nil, ErrApartmentNotFound
	}
	rules, err := s.repo.GetApartmentRules(ctx, apartmentID)
	if err != nil {
		return nil, err
	}
	candidates, err := s.repo.ListInterestedTenants(ctx, apartmentID)
	if err != nil {
		return nil, err
	}
	result := make([]apartment.InterestedTenant, 0, len(candidates))
	for _, candidate := range candidates {
		tenantProfile := &apartment.TenantProfile{
			UserID:        candidate.UserID,
			BudgetMin:     candidate.BudgetMin,
			BudgetMax:     candidate.BudgetMax,
			PreferredArea: candidate.PreferredArea,
			Pets:          candidate.Pets,
			Smoking:       candidate.Smoking,
			NoiseLevel:    candidate.NoiseLevel,
			Cleanliness:   candidate.Cleanliness,
			WorkSchedule:  candidate.WorkSchedule,
			Age:           candidate.Age,
			University:    candidate.Studies,
		}
		score, _ := calculateCompatibility(*apartmentRow, rules, tenantProfile)
		result = append(result, apartment.InterestedTenant{
			UserID:        candidate.UserID,
			Name:          candidate.Name,
			Age:           candidate.Age,
			Studies:       candidate.Studies,
			AvatarURL:     candidate.AvatarURL,
			Compatibility: score,
		})
	}
	return result, nil
}

// ListTenantApplications returns tenant applications with status and compatibility.
func (s *Service) ListTenantApplications(ctx context.Context, tenantID, role string) ([]apartment.TenantApplication, error) {
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
	tenantProfile, err := s.repo.GetTenantProfileByUserID(ctx, tenantID)
	if err != nil {
		return nil, err
	}
	for idx := range applications {
		if applications[idx].CompatibilityScore <= 0 {
			apartmentRow, apartmentErr := s.repo.GetApartmentByID(ctx, applications[idx].ApartmentID)
			if apartmentErr == nil && apartmentRow != nil {
				rules, rulesErr := s.repo.GetApartmentRules(ctx, applications[idx].ApartmentID)
				if rulesErr == nil {
					score, _ := calculateCompatibility(*apartmentRow, rules, tenantProfile)
					applications[idx].CompatibilityScore = score
				}
			}
		}
		applications[idx].Status = mapApplicationStatus(applications[idx].Status)
		applications[idx].DateLabel = buildDateLabel(applications[idx].Status, applications[idx].CreatedAt)
		applications[idx].RequestType = "Solicitud individual"
		applications[idx].StatusMessage = buildStatusMessage(applications[idx].Status)
	}
	return applications, nil
}

func (s *Service) signApartmentImages(ctx context.Context, apartments []apartment.Apartment) ([]apartment.Apartment, error) {
	if s.imageSigner == nil {
		return apartments, nil
	}
	for idx := range apartments {
		signedURL, err := s.signedImageURL(ctx, apartments[idx].ImageURL)
		if err != nil {
			apartments[idx].ImageURL = ""
			continue
		}
		apartments[idx].ImageURL = signedURL
	}
	return apartments, nil
}

func (s *Service) signedImageURL(ctx context.Context, imagePath string) (string, error) {
	imagePath = strings.TrimSpace(imagePath)
	if imagePath == "" {
		return "", nil
	}
	signedURL, err := s.imageSigner.CreateSignedURL(ctx, apartmentPhotosBucket, imagePath, signedImageURLTTLSeconds)
	if err != nil {
		return "", fmt.Errorf("sign apartment image: %w", err)
	}
	return signedURL, nil
}

func derefRules(rules *apartment.Rules) apartment.Rules {
	if rules == nil {
		return apartment.Rules{}
	}
	return *rules
}

func calculateCompatibility(apartmentRow apartment.Apartment, rules *apartment.Rules, tenantProfile *apartment.TenantProfile) (int, []string) {
	if tenantProfile == nil {
		return 0, nil
	}

	totalWeight := 0.0
	weightedScore := 0.0
	reasons := make([]string, 0, 4)

	addScore := func(weight float64, score float64, reason string) {
		if score < 0 {
			return
		}
		totalWeight += weight
		weightedScore += weight * score
		if score >= 70 && reason != "" {
			reasons = append(reasons, reason)
		}
	}

	addScore(0.20, budgetCompatibility(apartmentRow.BaseRent, tenantProfile.BudgetMin, tenantProfile.BudgetMax), "Presupuesto alineado")
	addScore(0.15, textEqualityScore(tenantProfile.PreferredArea, apartmentRow.Area), "Zona preferida similar")
	addScore(0.15, boolRuleScore(rules, tenantProfile.Pets, true), "Preferencias de mascotas compatibles")
	addScore(0.15, boolRuleScore(rules, tenantProfile.Smoking, false), "Normas de convivencia compatibles")
	addScore(0.10, orderedLevelScore(tenantProfile.NoiseLevel, ruleNoiseLevel(rules), []string{"quiet", "moderate", "loud"}), "Rangos de ruido compatibles")
	addScore(0.10, orderedLevelScore(tenantProfile.Cleanliness, ruleCleanliness(rules), []string{"relaxed", "normal", "very_clean"}), "Preferencias de limpieza compatibles")
	addScore(0.05, orderedLevelScore(tenantProfile.WorkSchedule, ruleSchedule(rules), []string{"morning", "flexible", "night"}), "Horarios compatibles")

	if totalWeight == 0 {
		return 0, nil
	}
	score := int(math.Round((weightedScore / totalWeight)))
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}
	if len(reasons) == 0 {
		reasons = append(reasons, "Perfil parcialmente compatible")
	}
	return score, reasons
}

func budgetCompatibility(baseRent, budgetMin, budgetMax int) float64 {
	if baseRent <= 0 || budgetMax <= 0 {
		return -1
	}
	if budgetMin > budgetMax {
		return -1
	}
	if baseRent >= budgetMin && baseRent <= budgetMax {
		return 100
	}
	if baseRent < budgetMin {
		delta := budgetMin - baseRent
		if delta <= 50 {
			return 90
		}
		if delta <= 120 {
			return 75
		}
		return 60
	}
	delta := baseRent - budgetMax
	if delta <= 40 {
		return 85
	}
	if delta <= 100 {
		return 60
	}
	if delta <= 180 {
		return 35
	}
	return 10
}

func textEqualityScore(a, b string) float64 {
	a = normalizeText(a)
	b = normalizeText(b)
	if a == "" || b == "" {
		return -1
	}
	if a == b {
		return 100
	}
	if strings.Contains(a, b) || strings.Contains(b, a) {
		return 70
	}
	return 25
}

func boolRuleScore(rules *apartment.Rules, tenantValue bool, forPets bool) float64 {
	if rules == nil {
		return -1
	}
	if forPets {
		if rules.PetsAllowed == nil {
			return -1
		}
		if *rules.PetsAllowed == tenantValue {
			return 100
		}
		if !tenantValue {
			return 80
		}
		return 10
	}
	if rules.SmokingAllowed == nil {
		return -1
	}
	if *rules.SmokingAllowed == tenantValue {
		return 100
	}
	if !tenantValue {
		return 80
	}
	return 10
}

func orderedLevelScore(tenantLevel, ruleLevel string, order []string) float64 {
	tenantLevel = normalizeText(tenantLevel)
	ruleLevel = normalizeText(ruleLevel)
	if tenantLevel == "" || ruleLevel == "" {
		return -1
	}
	tenantIdx := indexOf(order, tenantLevel)
	ruleIdx := indexOf(order, ruleLevel)
	if tenantIdx < 0 || ruleIdx < 0 {
		return -1
	}
	diff := math.Abs(float64(tenantIdx - ruleIdx))
	if diff == 0 {
		return 100
	}
	if diff == 1 {
		return 65
	}
	return 20
}

func indexOf(items []string, value string) int {
	for idx := range items {
		if items[idx] == value {
			return idx
		}
	}
	return -1
}

func ruleNoiseLevel(rules *apartment.Rules) string {
	if rules == nil {
		return ""
	}
	return rules.MaxNoiseLevel
}

func ruleCleanliness(rules *apartment.Rules) string {
	if rules == nil {
		return ""
	}
	return rules.CleanlinessExpectation
}

func ruleSchedule(rules *apartment.Rules) string {
	if rules == nil {
		return ""
	}
	return rules.PreferredSchedule
}

func normalizeText(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func mapApplicationStatus(status string) string {
	status = strings.ToUpper(strings.TrimSpace(status))
	switch status {
	case "PENDING_OWNER", "PENDING_CONFIRMED_TENANTS":
		return "pending"
	case "FULLY_CONFIRMED":
		return "approved"
	case "REJECTED_BY_OWNER", "REJECTED_BY_CONFIRMED_TENANTS":
		return "rejected"
	case "CANCELLED":
		return "cancelled"
	default:
		return "pending"
	}
}

func buildDateLabel(status string, createdAt string) string {
	switch status {
	case "approved":
		return "Aceptada el " + createdAt
	case "rejected":
		return "Respondida el " + createdAt
	case "cancelled":
		return "Cancelada el " + createdAt
	default:
		return "Solicitada el " + createdAt
	}
}

func buildStatusMessage(status string) string {
	switch status {
	case "approved":
		return "Tu solicitud ha sido aceptada por el propietario."
	case "rejected":
		return "El propietario ha rechazado tu solicitud para este piso."
	case "cancelled":
		return "La solicitud fue cancelada."
	default:
		return "Tu solicitud esta pendiente de revision por el propietario."
	}
}
