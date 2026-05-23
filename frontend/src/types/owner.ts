export type PropertyStatus = 'open' | 'closed' | 'full'
export type MatchStatus = 'pending' | 'approved' | 'rejected'
export type OwnerNavTab = 'explore' | 'properties' | 'requests' | 'messages' | 'notifications' | 'profile'
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
    name: string
    role: string
}

export interface OwnerDashboardProperty {
    id: string
    title: string
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
}

export interface OwnerDashboardRequest {
    id: string
    tenant: string
    profile: string
    property: string
    address: string
    compatibility: number
    requestedAt: string
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
