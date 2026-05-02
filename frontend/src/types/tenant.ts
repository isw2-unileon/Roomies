export interface TenantProfile {
    id: string
    name: string
    email: string
    age: number
    preferredArea: string
    preferredAreaKey: string
    budgetMin: number
    budgetMax: number
    profileCompletion: number
    compatibilityAverage: number
}

export interface TenantProperty {
    id: string
    titleKey: string
    addressKey: string
    areaKey: string
    availableRooms: number
    totalRooms: number
    rent: number
    compatibilityScore: number
    status: PropertyAvailability
    images: string[]
    createdAt: string
}

export type PropertyAvailability = 'available' | 'occupied' | 'full'

export interface TenantApplication {
    id: string
    propertyId: string
    propertyTitle: string
    ownerName: string
    status: ApplicationStatus
    createdAt: string
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface TenantGroup {
    id: string
    name: string
    members: number
    status: GroupStatus
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
