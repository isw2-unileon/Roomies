package group

const (
	StatusForming  = "FORMING"
	StatusReady    = "READY"
	StatusApplied  = "APPLIED"
	StatusAccepted = "ACCEPTED"
	StatusRejected = "REJECTED"
	StatusClosed   = "CLOSED"

	MemberRoleOwner  = "owner"
	MemberRoleMember = "member"

	MemberStatusAccepted = "ACCEPTED"
	MemberStatusLeft     = "LEFT"

	InvitationStatusPending  = "PENDING"
	InvitationStatusAccepted = "ACCEPTED"
	InvitationStatusRejected = "REJECTED"
	InvitationStatusExpired  = "EXPIRED"

	UserRelationCreator           = "creator"
	UserRelationMember            = "member"
	UserRelationPendingInvitation = "pending_invitation"
)

type CreateGroupInput struct {
	Name           string
	Description    string
	ApartmentID    string
	InvitedUserIDs []string
}

type UpdateGroupApartmentInput struct {
	ApartmentID string
}

type ListGroupsFilters struct {
	Search       string
	Status       string
	HasApartment string
	Members      int
	SortBy       string
}

type CandidateFilters struct {
	Search     string
	University string
}

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
