import { apiFetch } from '@/api'
import type {
  InterestedTenant,
  PropertyAvailability,
  TenantPersonalProfile,
  TenantApplication,
  TenantGroupAcceptedMember,
  TenantGroupApartment,
  TenantGroupCurrentJoinRequest,
  TenantGroupApartmentRequest,
  TenantGroupCandidate,
  TenantGroupDetailItem,
  TenantGroupInvitation,
  TenantGroupJoinRequest,
  TenantGroupJoinVote,
  TenantGroupListItem,
  TenantGroupProfile,
  TenantRoommateProfile,
  TenantProperty,
  TenantPropertyDetail,
  TenantPropertyRules,
} from '@/types/tenant'

export interface SaveTenantProfileInput {
  budgetMax: number
  preferredArea: string
  pets: boolean
  smoking: boolean
  age: number
  sex: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  situation: 'student' | 'worker' | 'unemployed'
  degree?: string
  profession?: string
  socializationLevel: 'low' | 'medium' | 'high'
  nightlifeLevel: 'low' | 'medium' | 'high'
}

export interface SaveTenantPersonalProfileInput {
  fullName: string
}

interface TenantProfileResponseDto {
  message?: string
  onboarding_complete?: boolean
  error?: string
}

interface TenantPersonalProfileDto {
  user_id: string
  full_name: string
  email: string
  avatar_url: string
  error?: string
}

type TenantPersonalProfileResponseDto = TenantPersonalProfileDto

interface TenantAvatarUploadResponseDto {
  message?: string
  avatar_url?: string
  error?: string
}

interface TenantApartmentDto {
  id: string
  title: string
  address: string
  area: string
  total_spots: number
  available_spots: number
  base_rent: number
  status: string
  created_at: string
  image_url?: string | null
  image_urls?: string[] | null
  image_paths?: string[] | null
  description?: string
  owner_name?: string
  compatibility_score?: number
  latitude: number
  longitude: number
  bathrooms?: number
  surface_m2?: number
  floor?: number
  smoking_allowed?: boolean | null
  pets_allowed?: boolean | null
  students_allowed?: boolean | null
  notes?: string
  is_current_tenant_home?: boolean | null
}

interface TenantApartmentDetailResponseDto {
  apartment?: TenantApartmentDto
  compatibility_reasons?: string[]
  current_application_id?: string
  current_application_status?: string
  can_apply?: boolean | string | number | null
  can_cancel?: boolean | string | number | null
  can_leave?: boolean | string | number | null
  error?: string
}

interface TenantApartmentsResponseDto {
  apartments?: TenantApartmentDto[]
  error?: string
}

interface ApplyApartmentResponseDto {
  application_id?: string
  status?: string
  error?: string
}

interface CancelApplicationResponseDto {
  message?: string
  error?: string
}

interface InterestedTenantDto {
  user_id: string
  name: string
  age: number
  studies: string
  avatar_url: string
  compatibility: number
}

interface InterestedTenantsResponseDto {
  tenants?: InterestedTenantDto[]
  error?: string
}

interface TenantApplicationDto {
  id: string
  apartment_id: string
  property_title: string
  owner_name: string
  address: string
  image_url: string
  places: number
  size: number
  bathrooms: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  created_at: string
  date_label: string
  compatibility: number
  request_type: string
  status_message: string
  application_type?: 'individual' | 'group'
  is_group_application?: boolean
  group_id?: string
  group_name?: string
  submitted_by_user_id?: string
  submitted_by_name?: string
  group_members?: TenantApplicationGroupMemberDto[]
  can_cancel?: boolean
}

interface TenantApplicationsResponseDto {
  applications?: TenantApplicationDto[]
  error?: string
}

interface TenantApplicationGroupMemberDto {
  user_id: string
  name: string
  email: string
  avatar_url: string
}

interface TenantGroupApartmentDto {
  id: string
  title: string
  address: string
  area: string
  total_spots: number
  occupied_spots: number
  available_spots: number
  base_rent: number
  image_url: string
}

interface TenantGroupDto {
  id: string
  name: string
  description: string
  status: 'FORMING' | 'READY' | 'APPLIED' | 'ACCEPTED' | 'REJECTED' | 'CLOSED'
  created_by: string
  created_at: string
  user_relation: 'creator' | 'member' | 'pending_invitation' | 'viewer'
  invitation_id: string
  accepted_members_count: number
  pending_invitations_count: number
  is_fully_accepted: boolean
  average_budget_min?: number
  average_budget_max: number
  apartment: TenantGroupApartmentDto | null
  current_apartment_request?: TenantGroupApartmentRequestDto | null
  current_join_request?: TenantGroupCurrentJoinRequestDto | null
  members?: TenantGroupMemberDto[]
  pending_invitations?: TenantGroupInvitationDto[]
  join_requests?: TenantGroupJoinRequestDto[]
}

interface TenantGroupApartmentRequestDto {
	id: string
	apartment_id: string
	group_id: string
	type: string
	status: string
	created_at: string
}

interface TenantGroupCurrentJoinRequestDto {
	id: string
	group_id: string
	requester_user_id: string
	source: 'DIRECT_REQUEST' | 'GROUP_INVITATION'
	status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
	created_at: string
	updated_at: string
}

interface TenantGroupJoinVoteDto {
  request_id: string
  voter_user_id: string
  voter_name: string
  decision: 'APPROVE' | 'REJECT'
  created_at: string
  updated_at: string
}

interface TenantGroupJoinRequestDto {
  id: string
  group_id: string
  requester_user_id: string
  source: 'DIRECT_REQUEST' | 'GROUP_INVITATION'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  created_at: string
  updated_at: string
  requester: TenantGroupCandidateDto
  votes: TenantGroupJoinVoteDto[]
}

interface TenantGroupProfileDto {
  user_id: string
  name: string
  email: string
  avatar_url: string
  age: number
  sex: string
  situation: string
  university?: string
  degree: string
  profession: string
  budget_max: number
  preferred_area: string
  pets: boolean
  smoking: boolean
  socialization_level: string
  nightlife_level: string
}

interface TenantRoommateProfileDto extends TenantGroupProfileDto {
  compatibility: number
}

interface TenantGroupMemberDto extends TenantGroupProfileDto {
  role: 'owner' | 'member'
  status: 'ACCEPTED' | 'LEFT'
  has_accepted: boolean
  is_current_user: boolean
}

type TenantGroupCandidateDto = TenantGroupProfileDto 

interface TenantGroupInvitationDto {
  id: string
  group_id: string
  invited_by: string
  invited_user_id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  created_at: string
  responded_at: string
  user: TenantGroupCandidateDto
}

interface TenantGroupsResponseDto {
  groups?: TenantGroupDto[]
  error?: string
}

interface TenantGroupResponseDto {
  group?: TenantGroupDto
  error?: string
}

interface TenantGroupCandidatesResponseDto {
  candidates?: TenantGroupCandidateDto[]
  error?: string
}

interface TenantRoommateProfilesResponseDto {
  profiles?: TenantRoommateProfileDto[]
  error?: string
}

interface CreateTenantGroupResponseDto {
  message?: string
  group_id?: string
  error?: string
}

interface TenantGroupMessageResponseDto {
  message?: string
  request_id?: string
  application_id?: string
  status?: string
  created?: boolean
  error?: string
}

interface TenantGroupJoinRequestsResponseDto {
  requests?: TenantGroupJoinRequestDto[]
  error?: string
}

export interface TenantApartmentListFilters {
  query?: string
  area?: string
  priceMin?: number
  priceMax?: number
  totalRoomsMin?: number
  totalRoomsMax?: number
  availableRoomsMin?: number
  availableRoomsMax?: number
  availability?: string
  sortBy?: string
  lat?: number
  lng?: number
  radius?: number
}

export interface TenantGroupListFilters {
  search?: string
  status?: 'all' | 'request_sent' | 'accepted' | 'rejected' | 'closed'
  hasApartment?: string
  members?: number
  sort?: string
}

export interface TenantGroupCandidateFilters {
  search?: string
  groupId?: string
}

export interface CreateTenantGroupInput {
  name: string
  description: string
  apartmentId: string | null
  invitedUserIds: string[]
}

function resolveTenantErrorMessage(response: Response, fallbackMessage: string, apiMessage?: string) {
  if (apiMessage?.trim()) {
    return apiMessage
  }

  if (response.status === 401) {
    return 'Tu sesion ha caducado. Inicia sesion de nuevo para continuar.'
  }

  if (response.status === 403) {
    return 'No tienes permisos para ver este piso con la cuenta actual.'
  }

  return fallbackMessage
}

function toBoolean(value: boolean | string | number | null | undefined, defaultValue: boolean) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true' || normalized === '1' || normalized === 't') {
      return true
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'f' || normalized === '') {
      return false
    }
  }

  return defaultValue
}

function tenantApartmentStatusFromDto(dto: TenantApartmentDto): PropertyAvailability {
  if (dto.available_spots <= 0 || dto.status === 'FULL') {
    return 'full'
  }
  return 'available'
}

function tenantApartmentFromDto(dto: TenantApartmentDto): TenantProperty {
  const imageUrls = dto.image_urls?.length ? dto.image_urls : dto.image_url ? [dto.image_url] : []
  return {
    id: dto.id,
    titleKey: dto.title,
    description: dto.description ?? '',
    ownerName: dto.owner_name ?? '',
    addressKey: dto.address,
    areaKey: dto.area,
    availableRooms: dto.available_spots,
    totalRooms: dto.total_spots,
    rent: dto.base_rent,
    compatibilityScore: dto.compatibility_score ?? 0,
    status: tenantApartmentStatusFromDto(dto),
    images: imageUrls,
    createdAt: dto.created_at,
    latitude: dto.latitude,
    longitude: dto.longitude,
    bathrooms: dto.bathrooms ?? 0,
    surfaceM2: dto.surface_m2 ?? 0,
    floor: dto.floor ?? 0,
    isCurrentTenantHome: dto.is_current_tenant_home === true,
  }
}

function tenantPropertyRulesFromApartmentDto(dto: TenantApartmentDto | undefined): TenantPropertyRules {
  return {
    smokingAllowed: dto?.smoking_allowed ?? null,
    petsAllowed: dto?.pets_allowed ?? null,
    studentsAllowed: dto?.students_allowed ?? null,
    notes: dto?.notes ?? '',
  }
}

function interestedTenantFromDto(dto: InterestedTenantDto): InterestedTenant {
  return {
    userId: dto.user_id,
    name: dto.name,
    age: dto.age,
    studies: dto.studies,
    avatarUrl: dto.avatar_url,
    compatibility: dto.compatibility,
  }
}

function tenantRoommateProfileFromDto(dto: TenantRoommateProfileDto): TenantRoommateProfile {
  return {
    ...tenantGroupProfileFromDto(dto),
    compatibility: dto.compatibility,
  }
}

function tenantApplicationFromDto(dto: TenantApplicationDto): TenantApplication {
  return {
    id: dto.id,
    propertyId: dto.apartment_id,
    propertyTitle: dto.property_title,
    ownerName: dto.owner_name,
    address: dto.address,
    image: dto.image_url,
    places: dto.places,
    size: dto.size,
    bathrooms: dto.bathrooms,
    status: dto.status,
    createdAt: dto.created_at,
    dateLabel: dto.date_label,
    compatibility: dto.compatibility,
    requestType: dto.request_type,
    statusMessage: dto.status_message,
    applicationType: dto.application_type === 'group' ? 'group' : 'individual',
    isGroupApplication: dto.is_group_application ?? dto.application_type === 'group',
    groupId: dto.group_id ?? '',
    groupName: dto.group_name ?? '',
    submittedByUserId: dto.submitted_by_user_id ?? '',
    submittedByName: dto.submitted_by_name ?? '',
    groupMembers: (dto.group_members ?? []).map((member) => ({
      userId: member.user_id,
      name: member.name,
      email: member.email,
      avatarUrl: member.avatar_url,
    })),
    canCancel: dto.can_cancel ?? dto.application_type !== 'group',
  }
}

function tenantGroupApartmentFromDto(dto: TenantGroupApartmentDto): TenantGroupApartment {
  return {
    id: dto.id,
    title: dto.title,
    address: dto.address,
    area: dto.area,
    totalSpots: dto.total_spots,
    occupiedSpots: dto.occupied_spots,
    availableSpots: dto.available_spots,
    baseRent: dto.base_rent,
    imageUrl: dto.image_url,
  }
}

function tenantGroupApartmentRequestFromDto(dto: TenantGroupApartmentRequestDto): TenantGroupApartmentRequest {
	return {
		id: dto.id,
		apartmentId: dto.apartment_id,
		groupId: dto.group_id,
		type: dto.type,
		status: dto.status,
		createdAt: dto.created_at,
	}
}

function tenantGroupCurrentJoinRequestFromDto(dto: TenantGroupCurrentJoinRequestDto): TenantGroupCurrentJoinRequest {
	return {
		id: dto.id,
		groupId: dto.group_id,
		requesterUserId: dto.requester_user_id,
		source: dto.source,
		status: dto.status,
		createdAt: dto.created_at,
		updatedAt: dto.updated_at,
	}
}

function tenantGroupProfileFromDto(dto: TenantGroupProfileDto): TenantGroupProfile {
  return {
    userId: dto.user_id,
    name: dto.name,
    email: dto.email,
    avatarUrl: dto.avatar_url,
    age: dto.age,
    sex: dto.sex,
    situation: dto.situation,
    university: dto.university ?? dto.degree ?? '',
    degree: dto.degree,
    profession: dto.profession,
    budgetMax: dto.budget_max,
    preferredArea: dto.preferred_area,
    pets: dto.pets,
    smoking: dto.smoking,
    socializationLevel: dto.socialization_level,
    nightlifeLevel: dto.nightlife_level,
  }
}

function tenantPersonalProfileFromDto(dto: TenantPersonalProfileDto): TenantPersonalProfile {
	return {
		userId: dto.user_id,
		fullName: dto.full_name,
		email: dto.email,
		avatarUrl: dto.avatar_url,
	}
}

function tenantGroupMemberFromDto(dto: TenantGroupMemberDto): TenantGroupAcceptedMember {
  return {
    ...tenantGroupProfileFromDto(dto),
    role: dto.role,
    status: dto.status,
    hasAccepted: dto.has_accepted,
    isCurrentUser: dto.is_current_user,
  }
}

function tenantGroupCandidateFromDto(dto: TenantGroupCandidateDto): TenantGroupCandidate {
  return tenantGroupProfileFromDto(dto)
}

function tenantGroupInvitationFromDto(dto: TenantGroupInvitationDto): TenantGroupInvitation {
  return {
    id: dto.id,
    groupId: dto.group_id,
    invitedBy: dto.invited_by,
    invitedUserId: dto.invited_user_id,
    status: dto.status,
    createdAt: dto.created_at,
    respondedAt: dto.responded_at,
    user: tenantGroupCandidateFromDto(dto.user),
  }
}

function tenantGroupFromDto(dto: TenantGroupDto): TenantGroupListItem {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    status: dto.status,
    createdBy: dto.created_by,
    createdAt: dto.created_at,
    userRelation: dto.user_relation,
    invitationId: dto.invitation_id,
    acceptedMembersCount: dto.accepted_members_count,
    pendingInvitationsCount: dto.pending_invitations_count,
    isFullyAccepted: dto.is_fully_accepted,
    averageBudgetMin: dto.average_budget_min ?? 0,
    averageBudgetMax: dto.average_budget_max,
    apartment: dto.apartment ? tenantGroupApartmentFromDto(dto.apartment) : null,
	currentApartmentRequest: dto.current_apartment_request ? tenantGroupApartmentRequestFromDto(dto.current_apartment_request) : null,
	currentJoinRequest: dto.current_join_request ? tenantGroupCurrentJoinRequestFromDto(dto.current_join_request) : null,
  }
}

function tenantGroupJoinVoteFromDto(dto: TenantGroupJoinVoteDto): TenantGroupJoinVote {
  return {
    requestId: dto.request_id,
    voterUserId: dto.voter_user_id,
    voterName: dto.voter_name,
    decision: dto.decision,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}

function tenantGroupJoinRequestFromDto(dto: TenantGroupJoinRequestDto): TenantGroupJoinRequest {
  return {
    id: dto.id,
    groupId: dto.group_id,
    requesterUserId: dto.requester_user_id,
	 source: dto.source,
    status: dto.status,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
    requester: tenantGroupCandidateFromDto(dto.requester),
    votes: (dto.votes ?? []).map(tenantGroupJoinVoteFromDto),
  }
}

function tenantGroupDetailFromDto(dto: TenantGroupDto): TenantGroupDetailItem {
  return {
    ...tenantGroupFromDto(dto),
    members: (dto.members ?? []).map(tenantGroupMemberFromDto),
    pendingInvitations: (dto.pending_invitations ?? []).map(tenantGroupInvitationFromDto),
    joinRequests: (dto.join_requests ?? []).map(tenantGroupJoinRequestFromDto),
  }
}

export async function saveTenantProfile(input: SaveTenantProfileInput) {
  const response = await apiFetch('/api/tenant-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
		budget_max: input.budgetMax,
		preferred_area: input.preferredArea,
		pets: input.pets,
		smoking: input.smoking,
		age: input.age,
		sex: input.sex,
		situation: input.situation,
		degree: input.degree?.trim() || undefined,
		profession: input.profession?.trim() || undefined,
		socialization_level: input.socializationLevel,
		nightlife_level: input.nightlifeLevel,
    }),
  })
  const data = (await response.json()) as TenantProfileResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo guardar el perfil.')
  }
  return data.message
}

export async function getTenantPersonalProfile() {
	const response = await apiFetch('/api/tenant-profile/personal')
	const data = (await response.json()) as TenantPersonalProfileResponseDto
	if (!response.ok) {
		throw new Error(data.error ?? 'No se pudo cargar tu perfil.')
	}
	return tenantPersonalProfileFromDto(data)
}

export async function saveTenantPersonalProfile(input: SaveTenantPersonalProfileInput) {
	const response = await apiFetch('/api/tenant-profile/personal', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			full_name: input.fullName,
		}),
	})
	const data = (await response.json()) as TenantProfileResponseDto
	if (!response.ok) {
		throw new Error(data.error ?? 'No se pudo guardar tu perfil.')
	}
	return data.message
}

export async function uploadTenantAvatar(file: File) {
	const formData = new FormData()
	formData.append('avatar', file)

	const response = await apiFetch('/api/tenant-profile/avatar', {
		method: 'POST',
		body: formData,
	})
	const data = (await response.json()) as TenantAvatarUploadResponseDto
	if (!response.ok || !data.avatar_url) {
		throw new Error(data.error ?? 'No se pudo subir la foto de perfil.')
	}
	return data.avatar_url
}

function buildApartmentsQuery(filters?: TenantApartmentListFilters) {
  const params = new URLSearchParams()
  if (!filters) {
    return ''
  }

  if (filters.query?.trim()) {
    params.set('q', filters.query.trim())
  }
  if (filters.area?.trim()) {
    params.set('area', filters.area.trim())
  }
  if (filters.priceMin !== undefined) {
    params.set('price_min', String(filters.priceMin))
  }
  if (filters.priceMax !== undefined) {
    params.set('price_max', String(filters.priceMax))
  }
  if (filters.totalRoomsMin !== undefined) {
    params.set('total_rooms_min', String(filters.totalRoomsMin))
  }
  if (filters.totalRoomsMax !== undefined) {
    params.set('total_rooms_max', String(filters.totalRoomsMax))
  }
  if (filters.availableRoomsMin !== undefined) {
    params.set('available_rooms_min', String(filters.availableRoomsMin))
  }
  if (filters.availableRoomsMax !== undefined) {
    params.set('available_rooms_max', String(filters.availableRoomsMax))
  }
  if (filters.availability?.trim()) {
    params.set('availability', filters.availability.trim())
  }
  if (filters.sortBy?.trim()) {
    params.set('sort_by', filters.sortBy.trim())
  }
  if (filters.lat !== undefined && filters.lng !== undefined && filters.radius !== undefined) {
    params.set('lat', String(filters.lat))
    params.set('lng', String(filters.lng))
    params.set('radius', String(filters.radius))
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

function buildTenantGroupsQuery(filters?: TenantGroupListFilters) {
  const params = new URLSearchParams()
  if (!filters) {
    return ''
  }

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim())
  }
  if (filters.status?.trim() && filters.status !== 'all') {
    params.set('status', filters.status.trim())
  }
  if (filters.hasApartment?.trim() && filters.hasApartment !== 'all') {
    params.set('has_apartment', filters.hasApartment.trim())
  }
  if (filters.members !== undefined && filters.members > 0) {
    params.set('members', String(filters.members))
  }
  if (filters.sort?.trim()) {
    params.set('sort', filters.sort.trim())
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

function buildTenantGroupCandidatesQuery(filters?: TenantGroupCandidateFilters) {
  const params = new URLSearchParams()
  if (!filters) {
    return ''
  }

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim())
  }

  if (filters.groupId?.trim()) {
    params.set('group_id', filters.groupId.trim())
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function listTenantApartments(filters?: TenantApartmentListFilters) {
  const hasMapParams = filters?.lat !== undefined && filters?.lng !== undefined && filters?.radius !== undefined
  const endpoint = hasMapParams ? '/api/tenant/apartments/map' : '/api/tenant/apartments'
  const query = buildApartmentsQuery(filters)
  const response = await apiFetch(`${endpoint}${query}`)
  const data = (await response.json()) as TenantApartmentsResponseDto
  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudieron cargar los pisos disponibles.', data.error))
  }
  return (data.apartments ?? []).map(tenantApartmentFromDto)
}

export async function listTenantProfiles(): Promise<TenantRoommateProfile[]> {
  const response = await apiFetch('/api/tenant/profiles')
  const data = (await response.json()) as TenantRoommateProfilesResponseDto
  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudieron cargar los perfiles de inquilinos.', data.error))
  }
  return (data.profiles ?? []).map(tenantRoommateProfileFromDto)
}

export async function getTenantApartmentDetail(apartmentID: string): Promise<TenantPropertyDetail> {
  const response = await apiFetch(`/api/apartments/${apartmentID}`)
  const data = (await response.json()) as TenantApartmentDetailResponseDto
  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudo cargar el detalle del piso.', data.error))
  }
  const apartment = data.apartment
  if (!apartment) {
    throw new Error('No se pudo cargar el detalle del piso.')
  }

  return {
    property: tenantApartmentFromDto(apartment),
    compatibilityReasons: data.compatibility_reasons ?? [],
    rules: tenantPropertyRulesFromApartmentDto(apartment),
    currentApplicationId: data.current_application_id ?? '',
    currentApplicationStatus: data.current_application_status ?? '',
    canApply: toBoolean(data.can_apply, true),
    canCancel: toBoolean(data.can_cancel, false),
    canLeave: toBoolean(data.can_leave, false),
  }
}

export async function applyToTenantApartment(apartmentID: string): Promise<string> {
  const response = await apiFetch(`/api/apartments/${apartmentID}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  const data = (await response.json()) as ApplyApartmentResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo crear la solicitud.')
  }
  if (!data.application_id) {
    throw new Error('No se pudo crear la solicitud.')
  }
  return data.application_id
}

export async function listInterestedTenants(apartmentID: string): Promise<InterestedTenant[]> {
  const response = await apiFetch(`/api/apartments/${apartmentID}/interested`)
  const data = (await response.json()) as InterestedTenantsResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar los interesados.')
  }
  return (data.tenants ?? []).map(interestedTenantFromDto)
}

interface ApartmentResidentDto {
  user_id: string
  name: string
  avatar_url: string
  joined_at: string
}

export async function listApartmentResidents(apartmentID: string): Promise<import('@/types/tenant').ApartmentResident[]> {
  const response = await apiFetch(`/api/apartments/${encodeURIComponent(apartmentID)}/tenants`)
  const data = (await response.json()) as { tenants?: ApartmentResidentDto[]; error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar los residentes.')
  }
  return (data.tenants ?? []).map((t) => ({
    userId: t.user_id,
    name: t.name,
    avatarUrl: t.avatar_url,
    joinedAt: t.joined_at,
  }))
}

interface TenantProfileByUserIdResponseDto {
  budget_max?: number
  preferred_area?: string
  pets?: boolean
  smoking?: boolean
  age?: number
  sex?: string
  situation?: string
  degree?: string
  profession?: string
  socialization_level?: string
  nightlife_level?: string
  error?: string
}

export interface TenantPublicProfile {
  budgetMax: number
  preferredArea: string
  pets: boolean
  smoking: boolean
  age: number
  sex: string
  situation: string
  degree: string
  profession: string
  socializationLevel: string
  nightlifeLevel: string
}

export async function getTenantProfileByUserId(userId: string): Promise<TenantPublicProfile> {
  const response = await apiFetch(`/api/tenant-profile/${userId}`)
  const data = (await response.json()) as TenantProfileByUserIdResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar el perfil.')
  }
  return {
    budgetMax: data.budget_max ?? 0,
    preferredArea: data.preferred_area ?? '',
    pets: data.pets ?? false,
    smoking: data.smoking ?? false,
    age: data.age ?? 0,
    sex: data.sex ?? '',
    situation: data.situation ?? '',
    degree: data.degree ?? '',
    profession: data.profession ?? '',
    socializationLevel: data.socialization_level ?? '',
    nightlifeLevel: data.nightlife_level ?? '',
  }
}

export async function getMyTenantProfile(): Promise<TenantPublicProfile> {
  const response = await apiFetch('/api/tenant-profile/me')
  const data = (await response.json()) as TenantProfileByUserIdResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar el perfil.')
  }
  return {
    budgetMax: data.budget_max ?? 0,
    preferredArea: data.preferred_area ?? '',
    pets: data.pets ?? false,
    smoking: data.smoking ?? false,
    age: data.age ?? 0,
    sex: data.sex ?? '',
    situation: data.situation ?? '',
    degree: data.degree ?? '',
    profession: data.profession ?? '',
    socializationLevel: data.socialization_level ?? '',
    nightlifeLevel: data.nightlife_level ?? '',
  }
}

interface UpdateTenantProfileResponseDto {
  message?: string
  error?: string
}

export async function updateTenantProfile(input: SaveTenantProfileInput) {
  const response = await apiFetch('/api/tenant-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      budget_max: input.budgetMax,
      preferred_area: input.preferredArea,
      pets: input.pets,
      smoking: input.smoking,
      age: input.age,
      sex: input.sex,
      situation: input.situation,
      degree: input.degree?.trim() || undefined,
      profession: input.profession?.trim() || undefined,
      socialization_level: input.socializationLevel,
      nightlife_level: input.nightlifeLevel,
    }),
  })
  const data = (await response.json()) as UpdateTenantProfileResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo actualizar el perfil.')
  }
  return data.message
}

export async function cancelTenantApplication(applicationID: string) {
  const response = await apiFetch(`/api/applications/${applicationID}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  const data = (await response.json()) as CancelApplicationResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cancelar la solicitud.')
  }
  return data.message ?? 'application cancelled'
}

export async function leaveAcceptedApartment(applicationID: string) {
  const response = await apiFetch(`/api/applications/${encodeURIComponent(applicationID)}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  const data = (await response.json()) as CancelApplicationResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo salir del piso.')
  }
  return data.message ?? 'apartment left'
}

export async function listTenantApplications() {
  const response = await apiFetch('/api/tenant/applications')
  const data = (await response.json()) as TenantApplicationsResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar tus solicitudes.')
  }
  return (data.applications ?? []).map(tenantApplicationFromDto)
}

export async function listTenantGroups(filters?: TenantGroupListFilters): Promise<TenantGroupListItem[]> {
  const query = buildTenantGroupsQuery(filters)
  const response = await apiFetch(`/api/tenant/groups${query}`)
  const data = (await response.json()) as TenantGroupsResponseDto

  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudieron cargar tus grupos.', data.error))
  }

  return (data.groups ?? []).map(tenantGroupFromDto)
}

export async function getTenantGroup(groupID: string): Promise<TenantGroupDetailItem> {
  const response = await apiFetch(`/api/tenant/groups/${groupID}`)
  const data = (await response.json()) as TenantGroupResponseDto

  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudo cargar el detalle del grupo.', data.error))
  }

  if (!data.group) {
    throw new Error('No se pudo cargar el detalle del grupo.')
  }

  return tenantGroupDetailFromDto(data.group)
}

export async function getMyGroupForApartment(apartmentID: string): Promise<TenantGroupDetailItem | null> {
  const response = await apiFetch(`/api/apartments/${apartmentID}/my-group`)
  if (response.status === 404) return null
  const data = (await response.json()) as TenantGroupResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar tu grupo para este piso.')
  }
  if (!data.group) return null
  return tenantGroupDetailFromDto(data.group)
}

export async function createTenantGroup(input: CreateTenantGroupInput): Promise<string> {
  const response = await apiFetch('/api/tenant/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      apartment_id: input.apartmentId,
      invited_user_ids: input.invitedUserIds,
    }),
  })

  const data = (await response.json()) as CreateTenantGroupResponseDto

  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudo crear el grupo.', data.error))
  }

  if (!data.group_id) {
    throw new Error('No se pudo crear el grupo.')
  }

  return data.group_id
}

export async function listTenantGroupCandidates(
  filters?: TenantGroupCandidateFilters,
): Promise<TenantGroupCandidate[]> {
  const query = buildTenantGroupCandidatesQuery(filters)
  const response = await apiFetch(`/api/tenant/group-candidates${query}`)
  const data = (await response.json()) as TenantGroupCandidatesResponseDto

  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudieron cargar los candidatos.', data.error))
  }

  return (data.candidates ?? []).map(tenantGroupCandidateFromDto)
}

export async function inviteUsersToTenantGroup(groupID: string, invitedUserIDs: string[]): Promise<string> {
	const response = await apiFetch(`/api/tenant/groups/${groupID}/invitations`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			invited_user_ids: invitedUserIDs,
		}),
	})

	const data = (await response.json()) as TenantGroupMessageResponseDto
	if (!response.ok) {
		throw new Error(resolveTenantErrorMessage(response, 'No se pudo invitar a los nuevos miembros.', data.error))
	}

	return data.message ?? 'group invitations created'
}

export async function leaveTenantGroup(groupID: string): Promise<string> {
  const response = await apiFetch(`/api/tenant/groups/${groupID}/leave`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  const data = (await response.json()) as TenantGroupMessageResponseDto
  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudo abandonar el grupo.', data.error))
  }

  return data.message ?? 'You have left the group.'
}

export async function acceptTenantGroupInvitation(invitationID: string): Promise<string> {
  const response = await apiFetch(`/api/tenant/group-invitations/${invitationID}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  const data = (await response.json()) as TenantGroupMessageResponseDto

  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudo aceptar la invitacion.', data.error))
  }

  return data.message ?? 'group invitation accepted'
}

export async function rejectTenantGroupInvitation(invitationID: string): Promise<string> {
  const response = await apiFetch(`/api/tenant/group-invitations/${invitationID}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  const data = (await response.json()) as TenantGroupMessageResponseDto

  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudo rechazar la invitacion.', data.error))
  }

  return data.message ?? 'group invitation rejected'
}

export async function updateTenantGroupApartment(groupID: string, apartmentID: string | null): Promise<string> {
  const response = await apiFetch(`/api/tenant/groups/${groupID}/apartment`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apartment_id: apartmentID,
    }),
  })

  const data = (await response.json()) as TenantGroupMessageResponseDto

  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudo actualizar el piso del grupo.', data.error))
  }

  return data.message ?? 'group apartment updated'
}

export async function acceptTenantGroup(groupID: string): Promise<string> {
  const response = await apiFetch(`/api/tenant/groups/${groupID}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  const data = (await response.json()) as TenantGroupMessageResponseDto

  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudo aceptar el grupo.', data.error))
  }

  return data.message ?? 'group accepted'
}

export async function deleteTenantGroup(groupID: string): Promise<void> {
	const response = await apiFetch(`/api/tenant/groups/${groupID}`, {
		method: 'DELETE',
	})

	if (response.ok) {
		return
	}

	const data = (await response.json()) as TenantGroupMessageResponseDto
	throw new Error(resolveTenantErrorMessage(response, 'No se pudo eliminar el grupo.', data.error))
}

export async function createTenantGroupJoinRequest(groupID: string): Promise<string> {
  const response = await apiFetch(`/api/tenant/groups/${groupID}/join-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  const data = (await response.json()) as TenantGroupMessageResponseDto
  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudo crear la solicitud de union.', data.error))
  }

  return data.request_id ?? ''
}

export interface CreateTenantGroupApartmentApplicationResult {
	applicationId: string
	status: string
	created: boolean
}

export async function createTenantGroupApartmentApplication(groupID: string): Promise<CreateTenantGroupApartmentApplicationResult> {
	const response = await apiFetch(`/api/tenant/groups/${groupID}/applications`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	})

	const data = (await response.json()) as TenantGroupMessageResponseDto
	if (!response.ok) {
		throw new Error(resolveTenantErrorMessage(response, 'No se pudo enviar la solicitud grupal al piso.', data.error))
	}
	if (!data.application_id) {
		throw new Error('No se pudo enviar la solicitud grupal al piso.')
	}

	return {
		applicationId: data.application_id,
		status: data.status ?? '',
		created: data.created ?? false,
	}
}

export async function listTenantGroupJoinRequests(groupID: string): Promise<TenantGroupJoinRequest[]> {
  const response = await apiFetch(`/api/tenant/groups/${groupID}/join-requests`)
  const data = (await response.json()) as TenantGroupJoinRequestsResponseDto

  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudieron cargar las solicitudes de union.', data.error))
  }

  return (data.requests ?? []).map(tenantGroupJoinRequestFromDto)
}

export async function voteTenantGroupJoinRequest(groupID: string, requestID: string, decision: 'APPROVE' | 'REJECT'): Promise<string> {
  const response = await apiFetch(`/api/tenant/groups/${groupID}/join-requests/${requestID}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision }),
  })

  const data = (await response.json()) as TenantGroupMessageResponseDto
  if (!response.ok) {
    throw new Error(resolveTenantErrorMessage(response, 'No se pudo registrar el voto.', data.error))
  }

  return data.message ?? 'join request voted'
}
