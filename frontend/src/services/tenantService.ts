import { apiFetch } from '@/api'
import { getAuthorizationHeader } from '@/session/authSession'
import type {
  InterestedTenant,
  PropertyAvailability,
  TenantApplication,
  TenantProperty,
  TenantPropertyDetail,
  TenantPropertyRules,
} from '@/types/tenant'

export interface SaveTenantProfileInput {
  budgetMin: number
  budgetMax: number
  preferredArea: string
  moveInDate: string
  workSchedule: string
  pets: boolean
  smoking: boolean
  noiseLevel: string
  cleanliness: string
}

interface TenantProfileResponseDto {
  message?: string
  onboarding_complete?: boolean
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
  image_url: string
  description?: string
  owner_name?: string
  compatibility_score?: number
}

interface TenantApartmentRulesDto {
  smoking_allowed: boolean | null
  pets_allowed: boolean | null
  max_noise_level: string
  cleanliness_expectation: string
  preferred_schedule: string
}

interface TenantApartmentDetailResponseDto {
  apartment?: TenantApartmentDto
  compatibility_reasons?: string[]
  rules?: TenantApartmentRulesDto
  current_application_id?: string
  current_application_status?: string
  can_apply?: boolean
  can_cancel?: boolean
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
}

interface TenantApplicationsResponseDto {
  applications?: TenantApplicationDto[]
  error?: string
}

function tenantApartmentStatusFromDto(dto: TenantApartmentDto): PropertyAvailability {
  if (dto.available_spots <= 0 || dto.status === 'FULL') {
    return 'full'
  }
  return 'available'
}

function tenantApartmentFromDto(dto: TenantApartmentDto): TenantProperty {
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
    images: dto.image_url ? [dto.image_url] : [],
    createdAt: dto.created_at,
  }
}

function tenantPropertyRulesFromDto(dto: TenantApartmentRulesDto | undefined): TenantPropertyRules {
  return {
    smokingAllowed: dto?.smoking_allowed ?? null,
    petsAllowed: dto?.pets_allowed ?? null,
    maxNoiseLevel: dto?.max_noise_level ?? '',
    cleanlinessExpectation: dto?.cleanliness_expectation ?? '',
    preferredSchedule: dto?.preferred_schedule ?? '',
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
  }
}

export async function saveTenantProfile(input: SaveTenantProfileInput) {
  const response = await apiFetch('/api/tenant-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    body: JSON.stringify({
      budget_min: input.budgetMin,
      budget_max: input.budgetMax,
      preferred_area: input.preferredArea,
      move_in_date: input.moveInDate,
      work_schedule: input.workSchedule,
      pets: input.pets,
      smoking: input.smoking,
      noise_level: input.noiseLevel,
      cleanliness: input.cleanliness,
    }),
  })
  const data = (await response.json()) as TenantProfileResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo guardar el perfil.')
  }
  return data.message
}

export async function listTenantApartments() {
  const response = await apiFetch('/api/apartments')
  const data = (await response.json()) as TenantApartmentsResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar los pisos disponibles.')
  }
  return (data.apartments ?? []).map(tenantApartmentFromDto)
}

export async function getTenantApartmentDetail(apartmentID: string): Promise<TenantPropertyDetail> {
  const response = await apiFetch(`/api/apartments/${apartmentID}`, {
    headers: {
      ...getAuthorizationHeader(),
    },
  })
  const data = (await response.json()) as TenantApartmentDetailResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar el detalle del piso.')
  }
  const apartment = data.apartment
  if (!apartment) {
    throw new Error('No se pudo cargar el detalle del piso.')
  }

  return {
    property: tenantApartmentFromDto(apartment),
    compatibilityReasons: data.compatibility_reasons ?? [],
    rules: tenantPropertyRulesFromDto(data.rules),
    currentApplicationId: data.current_application_id ?? '',
    currentApplicationStatus: data.current_application_status ?? '',
    canApply: data.can_apply ?? true,
    canCancel: data.can_cancel ?? false,
  }
}

export async function applyToTenantApartment(apartmentID: string): Promise<string> {
  const response = await apiFetch(`/api/apartments/${apartmentID}/applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
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

export async function cancelTenantApplication(applicationID: string) {
  const response = await apiFetch(`/api/applications/${applicationID}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    body: JSON.stringify({}),
  })
  const data = (await response.json()) as CancelApplicationResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cancelar la solicitud.')
  }
  return data.message ?? 'application cancelled'
}

export async function listTenantApplications() {
  const response = await apiFetch('/api/tenant/applications', {
    headers: {
      ...getAuthorizationHeader(),
    },
  })
  const data = (await response.json()) as TenantApplicationsResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar tus solicitudes.')
  }
  return (data.applications ?? []).map(tenantApplicationFromDto)
}
