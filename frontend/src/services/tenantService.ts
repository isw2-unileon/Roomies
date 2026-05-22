import { apiFetch } from '@/api'
import { getAuthorizationHeader } from '@/session/authSession'

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
