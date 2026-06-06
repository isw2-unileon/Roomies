import { apiFetch } from '@/api'
import type { OwnerDashboardProperty, OwnerDashboardRequest, OwnerProfile } from '@/types/owner'

interface OwnerApartmentDto {
  id: string
  title: string
  description?: string
  address: string
  area: string
  total_spots: number
  occupied_spots: number
  base_rent: number
  status: string
  created_at: string
  image_url?: string | null
  image_urls?: string[] | null
  image_paths?: string[] | null
  latitude?: number
  longitude?: number
  bathrooms?: number
  surface_m2?: number
  floor?: number
  smoking_allowed?: boolean | null
  pets_allowed?: boolean | null
  students_allowed?: boolean | null
  notes?: string
}

interface OwnerApartmentsResponseDto {
  apartments?: OwnerApartmentDto[]
  apartment?: OwnerApartmentDto
  error?: string
}

interface CreateApartmentResponseDto {
  message?: string
  apartment_id?: string
  images_stored?: number
  error?: string
}

interface OwnerApplicationApplicantDto {
	user_id: string
	name: string
	email: string
	avatar_url: string
}

interface OwnerApplicationGroupMemberDto {
	user_id: string
	name: string
	email: string
	avatar_url: string
	compatibility_score?: number
}

interface OwnerApplicationGroupDto {
	group_id: string
	name: string
	creator: OwnerApplicationApplicantDto
	members: OwnerApplicationGroupMemberDto[]
}

interface OwnerApplicationDto {
	id: string
	apartment_id: string
	property_title: string
	address: string
	type: 'individual' | 'group'
	status: string
	created_at: string
	tenant?: OwnerApplicationApplicantDto
	group?: OwnerApplicationGroupDto
	compatibility_score?: number
}

interface OwnerApplicationsResponseDto {
	applications?: OwnerApplicationDto[]
	application?: OwnerApplicationDto
	message?: string
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
  imagePaths: string[]
  latitude?: number
  longitude?: number
  surfaceM2?: number
  floor?: number
  smokingAllowed?: boolean | null
  petsAllowed?: boolean | null
  studentsAllowed?: boolean | null
  notes?: string
}

export interface CreateApartmentResult {
  message?: string
  apartmentId?: string
  imagesStored?: number
}

function ownerApartmentFromDto(dto: OwnerApartmentDto): OwnerDashboardProperty {
  const imageUrls = dto.image_urls?.length ? dto.image_urls : dto.image_url ? [dto.image_url] : []
  const property: OwnerDashboardProperty = {
    id: dto.id,
    title: dto.title,
    address: dto.address,
    area: dto.area,
    totalSpots: dto.total_spots,
    occupiedSpots: dto.occupied_spots,
    rent: dto.base_rent,
    status: dto.status,
    createdAt: dto.created_at,
    image: imageUrls[0] ?? '',
  }
  if (dto.description !== undefined) {
    property.description = dto.description
  }
  if (imageUrls.length > 0) {
    property.imageUrls = imageUrls
  }
  if (dto.image_paths != null) {
    property.imagePaths = dto.image_paths
  }
  if (dto.latitude !== undefined) {
    property.latitude = dto.latitude
  }
  if (dto.longitude !== undefined) {
    property.longitude = dto.longitude
  }
  if (dto.bathrooms !== undefined) {
    property.bathrooms = dto.bathrooms
  }
  if (dto.surface_m2 !== undefined) {
    property.surfaceM2 = dto.surface_m2
  }
  if (dto.floor !== undefined) {
    property.floor = dto.floor
  }
  if (dto.smoking_allowed !== undefined) {
    property.smokingAllowed = dto.smoking_allowed
  }
  if (dto.pets_allowed !== undefined) {
    property.petsAllowed = dto.pets_allowed
  }
  if (dto.students_allowed !== undefined) {
    property.studentsAllowed = dto.students_allowed
  }
  if (dto.notes !== undefined) {
    property.notes = dto.notes
  }
  return property
}

function ownerApplicationApplicantFromDto(dto: OwnerApplicationApplicantDto) {
	return {
		userId: dto.user_id,
		name: dto.name,
		email: dto.email,
		avatarUrl: dto.avatar_url,
	}
}

function ownerApplicationFromDto(dto: OwnerApplicationDto): OwnerDashboardRequest {
	return {
		id: dto.id,
		apartmentId: dto.apartment_id,
		propertyTitle: dto.property_title,
		address: dto.address,
		type: dto.type,
		status: dto.status,
		createdAt: dto.created_at,
		tenant: dto.tenant ? ownerApplicationApplicantFromDto(dto.tenant) : undefined,
		group: dto.group ? {
			groupId: dto.group.group_id,
			name: dto.group.name,
			creator: ownerApplicationApplicantFromDto(dto.group.creator),
			members: (dto.group.members ?? []).map((m) => ({
				userId: m.user_id,
				name: m.name,
				email: m.email,
				avatarUrl: m.avatar_url,
				compatibilityScore: m.compatibility_score,
			})),
		} : undefined,
		compatibilityScore: dto.compatibility_score,
	}
}

function apartmentPayload(input: CreateApartmentInput) {
  return {
    title: input.title,
    description: input.description,
    address: input.address,
    area: input.area,
    total_spots: input.totalSpots,
    bathrooms: input.bathrooms,
    base_rent: input.baseRent,
    image_paths: input.imagePaths,
    latitude: input.latitude,
    longitude: input.longitude,
    surface_m2: input.surfaceM2 ?? 0,
    floor: input.floor ?? 0,
    smoking_allowed: input.smokingAllowed ?? null,
    pets_allowed: input.petsAllowed ?? null,
    students_allowed: input.studentsAllowed ?? null,
    notes: input.notes ?? '',
  }
}

export async function listOwnerApartments() {
  const response = await apiFetch('/api/owner/apartments')
  const data = (await response.json()) as OwnerApartmentsResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron cargar tus pisos publicados.')
  }
  return (data.apartments ?? []).map(ownerApartmentFromDto)
}

export async function getOwnerApartment(propertyId: string) {
  const response = await apiFetch(`/api/owner/apartments/${encodeURIComponent(propertyId)}`)
  const data = (await response.json()) as OwnerApartmentsResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar el piso publicado.')
  }
  if (!data.apartment) {
    throw new Error('No se pudo cargar el piso publicado.')
  }
  return ownerApartmentFromDto(data.apartment)
}

export async function createApartment(input: CreateApartmentInput): Promise<CreateApartmentResult> {
  const response = await apiFetch('/api/apartments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apartmentPayload(input)),
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

export async function listOwnerApplications() {
	const response = await apiFetch('/api/owner/applications')
	const data = (await response.json()) as OwnerApplicationsResponseDto
	if (!response.ok) {
		throw new Error(data.error ?? 'No se pudieron cargar las solicitudes recibidas.')
	}
	return (data.applications ?? []).map(ownerApplicationFromDto)
}

export async function getOwnerApplication(applicationID: string) {
	const response = await apiFetch(`/api/owner/applications/${encodeURIComponent(applicationID)}`)
	const data = (await response.json()) as OwnerApplicationsResponseDto
	if (!response.ok) {
		throw new Error(data.error ?? 'No se pudo cargar el detalle de la solicitud.')
	}
	if (!data.application) {
		throw new Error('No se pudo cargar el detalle de la solicitud.')
	}
	return ownerApplicationFromDto(data.application)
}

export async function approveOwnerApplication(applicationID: string) {
	const response = await apiFetch(`/api/owner/applications/${encodeURIComponent(applicationID)}/approve`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	})
	const data = (await response.json()) as OwnerApplicationsResponseDto
	if (!response.ok) {
		throw new Error(data.error ?? 'No se pudo aprobar la solicitud.')
	}
	return data.message ?? 'application approved'
}

export async function rejectOwnerApplication(applicationID: string) {
	const response = await apiFetch(`/api/owner/applications/${encodeURIComponent(applicationID)}/reject`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({}),
	})
	const data = (await response.json()) as OwnerApplicationsResponseDto
	if (!response.ok) {
		throw new Error(data.error ?? 'No se pudo rechazar la solicitud.')
	}
	return data.message ?? 'application rejected'
}

export async function updateOwnerApartment(propertyId: string, input: CreateApartmentInput): Promise<CreateApartmentResult> {
  const response = await apiFetch(`/api/owner/apartments/${encodeURIComponent(propertyId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apartmentPayload(input)),
  })
  const data = (await response.json()) as CreateApartmentResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo actualizar el piso. Intentalo de nuevo.')
  }
  return {
    message: data.message,
    apartmentId: data.apartment_id,
    imagesStored: data.images_stored,
  }
}

interface OwnerProfileDto {
  user_id: string
  full_name: string
  email: string
  avatar_url: string
  display_name: string
  phone: string
  error?: string
}

interface OwnerProfileResponseDto {
  message?: string
  avatar_url?: string
  error?: string
}

export interface UpdateOwnerProfileInput {
  fullName: string
  displayName: string
  phone: string
}

export async function getOwnerProfile(): Promise<OwnerProfile> {
  const response = await apiFetch('/api/owner-profile/me')
  const data = (await response.json()) as OwnerProfileDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo cargar el perfil.')
  }
  return {
    userId: data.user_id,
    fullName: data.full_name,
    email: data.email,
    avatarUrl: data.avatar_url,
    displayName: data.display_name,
    phone: data.phone,
  }
}

export async function updateOwnerProfile(input: UpdateOwnerProfileInput) {
  const response = await apiFetch('/api/owner-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: input.fullName,
      display_name: input.displayName,
      phone: input.phone,
    }),
  })
  const data = (await response.json()) as OwnerProfileResponseDto
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudo guardar el perfil.')
  }
  return data.message
}

export async function uploadOwnerAvatar(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('avatar', file)
  const response = await apiFetch('/api/owner-profile/avatar', {
    method: 'POST',
    body: formData,
  })
  const data = (await response.json()) as OwnerProfileResponseDto
  if (!response.ok || !data.avatar_url) {
    throw new Error(data.error ?? 'No se pudo subir la foto de perfil.')
  }
  return data.avatar_url
}

export interface UploadedPhoto {
  path: string
  signed_url: string
}

export async function uploadApartmentPhotos(files: File[], apartmentId?: string, apartmentName?: string): Promise<UploadedPhoto[]> {
  const formData = new FormData()
  for (const file of files) {
    formData.append('photos', file)
  }
  if (apartmentId) {
    formData.append('apartment_id', apartmentId)
  }
  if (apartmentName) {
    formData.append('apartment_name', apartmentName)
  }
  const response = await apiFetch('/api/owner/apartment-photos', {
    method: 'POST',
    body: formData,
  })
  const data = (await response.json()) as { photos?: UploadedPhoto[]; error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? 'No se pudieron subir las fotos.')
  }
  return data.photos ?? []
}

