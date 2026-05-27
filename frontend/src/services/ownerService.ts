import { apiFetch } from '@/api'
import { getAuthorizationHeader } from '@/session/authSession'
import type { OwnerDashboardProperty } from '@/types/owner'

interface OwnerApartmentDto {
  id: string
  title: string
  address: string
  area: string
  total_spots: number
  occupied_spots: number
  base_rent: number
  status: string
  created_at: string
  image_url: string
}

interface OwnerApartmentsResponseDto {
  apartments?: OwnerApartmentDto[]
  error?: string
}

interface CreateApartmentResponseDto {
  message?: string
  apartment_id?: string
  images_stored?: number
  error?: string
}

export interface CreateApartmentInput {
  title: string
  description: string
  address: string
  area: string
  totalSpots: number
  bathrooms: number
  baseRent: number
  availableFrom: string
  imageUrls: string[]
  latitude?: number
  longitude?: number
}

export interface CreateApartmentResult {
  message?: string
  apartmentId?: string
  imagesStored?: number
}

function ownerApartmentFromDto(dto: OwnerApartmentDto): OwnerDashboardProperty {
  return {
    id: dto.id,
    title: dto.title,
    address: dto.address,
    area: dto.area,
    totalSpots: dto.total_spots,
    occupiedSpots: dto.occupied_spots,
    rent: dto.base_rent,
    status: dto.status,
    createdAt: dto.created_at,
    image: dto.image_url,
  }
}

export async function listOwnerApartments() {
  const response = await apiFetch('/api/owner/apartments', {
    headers: getAuthorizationHeader(),
  })
  const data = (await response.json()) as OwnerApartmentsResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar tus pisos publicados.')
  }
  return (data.apartments ?? []).map(ownerApartmentFromDto)
}

export async function createApartment(input: CreateApartmentInput): Promise<CreateApartmentResult> {
  const response = await apiFetch('/api/apartments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    body: JSON.stringify({
      title: input.title,
      description: input.description,
      address: input.address,
      area: input.area,
      total_spots: input.totalSpots,
      bathrooms: input.bathrooms,
      base_rent: input.baseRent,
      available_from: input.availableFrom,
      image_urls: input.imageUrls,
      latitude: input.latitude,
      longitude: input.longitude,
    }),
  })
  const data = (await response.json()) as CreateApartmentResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo publicar el piso. Intentalo de nuevo.')
  }
  return {
    message: data.message,
    apartmentId: data.apartment_id,
    imagesStored: data.images_stored,
  }
}
