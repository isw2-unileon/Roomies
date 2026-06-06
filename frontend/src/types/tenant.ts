export interface TenantProfile {
    id: string
    name: string
    email: string
    age: number
    preferredArea: string
    preferredAreaKey: string
    budgetMax: number
    pets: boolean
    smoking: boolean
    sex?: string
    situation?: string
    degree?: string
    profession?: string
    socializationLevel?: string
    nightlifeLevel?: string
    profileCompletion: number
    compatibilityAverage: number
}

export interface TenantPersonalProfile {
    userId: string
    fullName: string
    email: string
    avatarUrl: string
}

export interface TenantProperty {
    id: string
    titleKey: string
    description?: string
    ownerName?: string
    addressKey: string
    areaKey: string
    availableRooms: number
    totalRooms: number
    rent: number
    compatibilityScore: number
    status: PropertyAvailability
    images: string[]
    createdAt: string
    latitude: number
    longitude: number
    bathrooms: number
    surfaceM2: number
    floor: number
    isCurrentTenantHome?: boolean
}

export type PropertyAvailability = 'available' | 'occupied' | 'full'

export interface TenantApplication {
    id: string
    propertyId: string
    propertyTitle: string
    ownerName: string
    address: string
    image: string
    places: number
    size: number
    bathrooms: number
    status: ApplicationStatus
    createdAt: string
    dateLabel: string
    compatibility: number
    requestType: string
    statusMessage: string
    applicationType: 'individual' | 'group'
    isGroupApplication: boolean
    groupId: string
    groupName: string
    submittedByUserId: string
    submittedByName: string
    groupMembers: TenantApplicationGroupMember[]
    canCancel: boolean
}

export interface TenantApplicationGroupMember {
    userId: string
    name: string
    email: string
    avatarUrl: string
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type ApplicationFilter = 'all' | ApplicationStatus

export type TenantGroupStatus = 'forming' | 'ready'

export interface TenantGroupMember {
    id: string
    name: string
    age: number
    studies: string
    avatar: string
    tags: string[]
    compatibility: number
    role?: string
    isCurrentUser?: boolean
}

export interface TenantGroup {
    id: string
    title: string
    location: string
    propertyAddress: string
    description: string
    image: string
    university: string
    entryDate: string
    members: number
    maxMembers: number
    neededPlaces: number
    budget: string
    badge?: string
    status: TenantGroupStatus
    averageCompatibility: number
    memberAvatars: string[]
    membersData: TenantGroupMember[]
}

export type GroupStatus = 'active' | 'inactive' | 'pending'

export interface TenantMessage {
    id: string
    senderId: string
    senderName: string
    content: string
    timestamp: string
    read: boolean
}

export interface TenantPropertyRules {
    smokingAllowed: boolean | null
    petsAllowed: boolean | null
    studentsAllowed: boolean | null
    notes: string
}

export interface TenantPropertyDetail {
    property: TenantProperty
    compatibilityReasons: string[]
    rules: TenantPropertyRules
    currentApplicationId: string
    currentApplicationStatus: string
    canApply: boolean
    canCancel: boolean
    canLeave: boolean
}

export interface InterestedTenant {
    userId: string
    name: string
    age: number
    studies: string
    avatarUrl: string
    compatibility: number
}

export interface ApartmentResident {
    userId: string
    name: string
    avatarUrl: string
    joinedAt: string
}

export type TenantGroupApiStatus =
    | 'FORMING'
    | 'READY'
    | 'APPLIED'
    | 'ACCEPTED'
    | 'REJECTED'
    | 'CLOSED'

export type TenantGroupUserRelation = 'creator' | 'member' | 'pending_invitation' | 'viewer'

export type TenantGroupMemberRole = 'owner' | 'member'

export type TenantGroupMemberStatus = 'ACCEPTED' | 'LEFT'

export type TenantGroupInvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
export type TenantGroupJoinRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type TenantGroupJoinVoteDecision = 'APPROVE' | 'REJECT'
export type TenantGroupJoinRequestSource = 'DIRECT_REQUEST' | 'GROUP_INVITATION'

export interface TenantGroupApartment {
    id: string
    title: string
    address: string
    area: string
    totalSpots: number
    occupiedSpots: number
    availableSpots: number
    baseRent: number
    imageUrl: string
}

export interface TenantGroupApartmentRequest {
	id: string
	apartmentId: string
	groupId: string
	type: string
	status: string
	createdAt: string
}

export interface TenantGroupCurrentJoinRequest {
	id: string
	groupId: string
	requesterUserId: string
	source: TenantGroupJoinRequestSource
	status: TenantGroupJoinRequestStatus
	createdAt: string
	updatedAt: string
}

export interface TenantGroupListItem {
    id: string
    name: string
    description: string
    status: TenantGroupApiStatus
    createdBy: string
    createdAt: string
    userRelation: TenantGroupUserRelation
    invitationId: string
    acceptedMembersCount: number
    pendingInvitationsCount: number
    isFullyAccepted: boolean
    averageBudgetMin: number
    averageBudgetMax: number
    apartment: TenantGroupApartment | null
	currentApartmentRequest: TenantGroupApartmentRequest | null
	currentJoinRequest: TenantGroupCurrentJoinRequest | null
}

export interface TenantGroupProfile {
    userId: string
    name: string
    email: string
    avatarUrl: string
    age: number
    sex: string
    situation: string
    university?: string
    degree: string
    profession: string
    budgetMax: number
    preferredArea: string
    pets: boolean
    smoking: boolean
    socializationLevel: string
    nightlifeLevel: string
}

export interface TenantRoommateProfile extends TenantGroupProfile {
    compatibility: number
}

export interface TenantGroupAcceptedMember extends TenantGroupProfile {
    role: TenantGroupMemberRole
    status: TenantGroupMemberStatus
    hasAccepted: boolean
    isCurrentUser: boolean
}

export type TenantGroupCandidate = TenantGroupProfile 

export interface TenantGroupInvitation {
    id: string
    groupId: string
    invitedBy: string
    invitedUserId: string
    status: TenantGroupInvitationStatus
    createdAt: string
    respondedAt: string
    user: TenantGroupCandidate
}

export interface TenantGroupJoinVote {
    requestId: string
    voterUserId: string
    voterName: string
    decision: TenantGroupJoinVoteDecision
    createdAt: string
    updatedAt: string
}

export interface TenantGroupJoinRequest {
    id: string
    groupId: string
    requesterUserId: string
    source: TenantGroupJoinRequestSource
    status: TenantGroupJoinRequestStatus
    createdAt: string
    updatedAt: string
    requester: TenantGroupCandidate
    votes: TenantGroupJoinVote[]
}

export interface TenantGroupDetailItem extends TenantGroupListItem {
    members: TenantGroupAcceptedMember[]
    pendingInvitations: TenantGroupInvitation[]
    joinRequests: TenantGroupJoinRequest[]
}
