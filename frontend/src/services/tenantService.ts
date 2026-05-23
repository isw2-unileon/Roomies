import { apiFetch } from '@/api'
import { getAuthorizationHeader } from '@/session/authSession'
import type { PropertyAvailability, TenantProperty } from '@/types/tenant'

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
}

interface TenantApartmentsResponseDto {
  apartments?: TenantApartmentDto[]
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
    addressKey: dto.address,
    areaKey: dto.area,
    availableRooms: dto.available_spots,
    totalRooms: dto.total_spots,
    rent: dto.base_rent,
    compatibilityScore: 0,
    status: tenantApartmentStatusFromDto(dto),
    images: dto.image_url ? [dto.image_url] : [],
    createdAt: dto.created_at,
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
