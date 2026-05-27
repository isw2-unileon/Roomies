package group

const (
	// StatusForming indicates that the group is still looking for members.
	StatusForming = "FORMING"
	// StatusReady indicates that the group is ready to apply to an apartment.
	StatusReady = "READY"
	// StatusApplied indicates that the group has already applied to an apartment.
	StatusApplied = "APPLIED"
	// StatusAccepted indicates that the group application was accepted.
	StatusAccepted = "ACCEPTED"
	// StatusRejected indicates that the group application was rejected.
	StatusRejected = "REJECTED"
	// StatusClosed indicates that the group is no longer active.
	StatusClosed = "CLOSED"

	// MemberRoleOwner identifies the group creator.
	MemberRoleOwner = "owner"
	// MemberRoleMember identifies a regular accepted group member.
	MemberRoleMember = "member"

	// MemberStatusAccepted indicates that the user belongs to the group.
	MemberStatusAccepted = "ACCEPTED"
	// MemberStatusLeft indicates that the user left the group.
	MemberStatusLeft = "LEFT"

	// InvitationStatusPending indicates that the invitation has not been answered.
	InvitationStatusPending = "PENDING"
	// InvitationStatusAccepted indicates that the invitation was accepted.
	InvitationStatusAccepted = "ACCEPTED"
	// InvitationStatusRejected indicates that the invitation was rejected.
	InvitationStatusRejected = "REJECTED"
	// InvitationStatusExpired indicates that the invitation expired.
	InvitationStatusExpired = "EXPIRED"

	// UserRelationCreator indicates that the current user created the group.
	UserRelationCreator = "creator"
	// UserRelationMember indicates that the current user is an accepted member.
	UserRelationMember = "member"
	// UserRelationPendingInvitation indicates that the current user has a pending invitation.
	UserRelationPendingInvitation = "pending_invitation"
)

// CreateGroupInput contains the data required to create a tenant group.
type CreateGroupInput struct {
	Name           string
	Description    string
	ApartmentID    string
	InvitedUserIDs []string
}

// UpdateGroupApartmentInput contains the apartment assignment update for a group.
type UpdateGroupApartmentInput struct {
	ApartmentID string
}

// ListGroupsFilters contains the filters used to list tenant groups.
type ListGroupsFilters struct {
	Search       string
	Status       string
	HasApartment string
	Members      int
	SortBy       string
}

// CandidateFilters contains the filters used to search tenant candidates.
type CandidateFilters struct {
	Search     string
	University string
}

// Group represents a tenant group with members, invitations and optional apartment.
type Group struct {
	ID                      string
	Name                    string
	Description             string
	Status                  string
	CreatedBy               string
	CreatedAt               string
	UserRelation            string
	InvitationID            string
	AcceptedMembersCount    int
	PendingInvitationsCount int
	AverageBudgetMin        int
	AverageBudgetMax        int
	Apartment               *Apartment
	Members                 []Member
	PendingInvitations      []Invitation
}

// Apartment represents the apartment assigned to a group.
type Apartment struct {
	ID             string
	Title          string
	Address        string
	Area           string
	TotalSpots     int
	OccupiedSpots  int
	AvailableSpots int
	BaseRent       int
	ImageURL       string
}

// Member represents an accepted group member.
type Member struct {
	UserID        string
	Name          string
	Email         string
	AvatarURL     string
	Role          string
	Status        string
	Age           int
	University    string
	BudgetMin     int
	BudgetMax     int
	PreferredArea string
	MoveInDate    string
	Pets          bool
	Smoking       bool
	NoiseLevel    string
	Cleanliness   string
	WorkSchedule  string
	IsCurrentUser bool
}

// Invitation represents a pending or answered group invitation.
type Invitation struct {
	ID            string
	GroupID       string
	InvitedBy     string
	InvitedUserID string
	Status        string
	CreatedAt     string
	RespondedAt   string
	User          Candidate
}

// Candidate represents a tenant profile that can be invited to a group.
type Candidate struct {
	UserID        string
	Name          string
	Email         string
	AvatarURL     string
	Age           int
	University    string
	BudgetMin     int
	BudgetMax     int
	PreferredArea string
	MoveInDate    string
	Pets          bool
	Smoking       bool
	NoiseLevel    string
	Cleanliness   string
	WorkSchedule  string
}
