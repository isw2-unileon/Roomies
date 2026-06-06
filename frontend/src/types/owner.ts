export type PropertyStatus = 'open' | 'closed' | 'full'
export type MatchStatus = 'pending' | 'approved' | 'rejected'
export type OwnerApplicationType = 'individual' | 'group'
export type OwnerNavTab = 'properties' | 'applications' | 'messages' | 'profile'
export type OwnerIssueStatus = 'pending' | 'in_progress' | 'resolved'

export interface OwnerProperty {
    id: string
    title: string
    address: string
    area: string
    availableRooms: number
    rent: number
    status: PropertyStatus
    createdAt: string
}

export interface PropertyLike {
    id: string
    propertyId: string
    propertyTitle: string
    tenantName: string
    tenantEmail: string
    status: MatchStatus
    createdAt: string
}

export interface OwnerProfile {
    userId: string
    fullName: string
    email: string
    avatarUrl: string
    displayName: string
    phone: string
}

export interface OwnerDashboardProperty {
    id: string
    title: string
    description?: string
    address: string
    area?: string
    totalSpots: number
    occupiedSpots: number
    rent?: number
    status?: string
    createdAt?: string
    tenant?: string
    paymentStatus?: 'received' | 'pending'
    nextDueDate?: string
    requests?: number
    image: string
    imageUrls?: string[]
    imagePaths?: string[]
    latitude?: number
    longitude?: number
    bathrooms?: number
    surfaceM2?: number
    floor?: number
    smokingAllowed?: boolean | null
    petsAllowed?: boolean | null
    studentsAllowed?: boolean | null
    notes?: string
}

export interface OwnerDashboardRequest {
    id: string
    apartmentId: string
    propertyTitle: string
    address: string
    type: OwnerApplicationType
    status: string
    createdAt: string
    tenant?: OwnerApplicationApplicant
    group?: OwnerApplicationGroup
    compatibilityScore?: number
}

export interface OwnerApplicationApplicant {
	userId: string
	name: string
	email: string
	avatarUrl: string
}

export interface OwnerApplicationGroupMember {
	userId: string
	name: string
	email: string
	avatarUrl: string
	compatibilityScore?: number
}

export interface OwnerApplicationGroup {
	groupId: string
	name: string
	creator: OwnerApplicationApplicant
	members: OwnerApplicationGroupMember[]
}

export interface OwnerDashboardPayment {
    id: string
    property: string
    amount: number
    paidAt: string
}

export interface OwnerDashboardIssue {
    id: string
    title: string
    property: string
    tenant: string
    status: OwnerIssueStatus
}

export interface OwnerActivityItem {
    id: string
    title: string
    meta: string
}
