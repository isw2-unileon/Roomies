export type PropertyStatus = 'open' | 'closed' | 'full'
export type MatchStatus = 'pending' | 'approved' | 'rejected'

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