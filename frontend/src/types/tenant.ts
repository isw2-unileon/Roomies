export interface TenantProfile {
    id: string
    name: string
    email: string
    age: number
    preferredArea: string
    preferredAreaKey: string
    budgetMin: number
    budgetMax: number
    moveInDate: string
    pets: boolean
    smoking: boolean
    noiseLevel: string
    cleanliness: string
    workSchedule: string
    sleepSchedule?: string
    socialLifestyle?: string
    studyHabits?: string
    language?: string
    university?: string
    guestPreferences?: string
    partyFrequency?: string
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