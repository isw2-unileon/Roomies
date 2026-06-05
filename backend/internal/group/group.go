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
	// UserRelationViewer indicates that the current user is only viewing the group.
	UserRelationViewer = "viewer"

	// JoinRequestStatusPending indicates the join request is awaiting member votes.
	JoinRequestStatusPending = "PENDING"
	// JoinRequestStatusApproved indicates all members approved the join request.
	JoinRequestStatusApproved = "APPROVED"
	// JoinRequestStatusRejected indicates a member rejected the join request.
	JoinRequestStatusRejected = "REJECTED"
	// JoinRequestStatusCancelled indicates the requester cancelled the join request.
	JoinRequestStatusCancelled = "CANCELLED"

	// JoinRequestVoteApprove represents an approval vote.
	JoinRequestVoteApprove = "APPROVE"
	// JoinRequestVoteReject represents a rejection vote.
	JoinRequestVoteReject = "REJECT"
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
	Search string
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
	IsFullyAccepted         bool
	AverageBudgetMax        int
	Apartment               *Apartment
	CurrentApartmentRequest *ApartmentRequest
	CurrentJoinRequest      *UserJoinRequest
	Members                 []Member
	PendingInvitations      []Invitation
	JoinRequests            []JoinRequest
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

// ApartmentRequest contains the current request from the group to its assigned apartment.
type ApartmentRequest struct {
	ID          string
	ApartmentID string
	GroupID     string
	Type        string
	Status      string
	CreatedAt   string
}

// Member represents an accepted group member.
type Member struct {
	UserID            string
	Name              string
	Email             string
	AvatarURL         string
	Role              string
	Status            string
	Age               int
	Sex               string
	Situation         string
	Degree            string
	Profession        string
	BudgetMax         int
	PreferredArea     string
	Pets              bool
	Smoking           bool
	SocializationLevel string
	NightlifeLevel    string
	HasAccepted       bool
	IsCurrentUser     bool
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
	UserID             string
	Name               string
	Email              string
	AvatarURL          string
	Age                int
	Sex                string
	Situation          string
	Degree             string
	Profession         string
	BudgetMax          int
	PreferredArea      string
	Pets               bool
	Smoking            bool
	SocializationLevel string
	NightlifeLevel     string
}

// JoinRequest represents a request from a viewer to join a group.
type JoinRequest struct {
	ID              string
	GroupID         string
	RequesterUserID string
	Status          string
	CreatedAt       string
	UpdatedAt       string
	Requester       Candidate
	Votes           []JoinRequestVote
}

// UserJoinRequest contains the latest join request created by the current user for a group.
type UserJoinRequest struct {
	ID              string
	GroupID         string
	RequesterUserID string
	Status          string
	CreatedAt       string
	UpdatedAt       string
}

// JoinRequestVote represents a member's vote on a join request.
type JoinRequestVote struct {
	RequestID   string
	VoterUserID string
	Decision    string
	CreatedAt   string
	UpdatedAt   string
	VoterName   string
}
