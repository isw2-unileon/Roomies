import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  getTenantApartmentDetail,
  getTenantPersonalProfile,
  listTenantApartments,
  saveTenantPersonalProfile,
  uploadTenantAvatar,
} from './tenantService'

describe('tenantService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  test('maps available apartment DTOs to tenant properties', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        apartments: [
          {
            id: 'apt-1',
            title: 'Piso centro',
            address: 'Calle Ancha 12',
            area: 'Centro',
            total_spots: 3,
            available_spots: 2,
            base_rent: 420,
            status: 'AVAILABLE',
            created_at: '2026-05-21T10:00:00Z',
            image_url: 'https://example.test/apt.jpg',
            image_urls: ['https://example.test/apt.jpg', 'https://example.test/apt-room.jpg'],
          },
        ],
      }),
    } as Response)

    await expect(listTenantApartments()).resolves.toEqual([
      {
        id: 'apt-1',
        titleKey: 'Piso centro',
        description: '',
        ownerName: '',
        addressKey: 'Calle Ancha 12',
        areaKey: 'Centro',
        availableRooms: 2,
        totalRooms: 3,
        rent: 420,
        compatibilityScore: 0,
        status: 'available',
        images: ['https://example.test/apt.jpg', 'https://example.test/apt-room.jpg'],
        createdAt: '2026-05-21T10:00:00Z',
      },
    ])

    expect(fetch).toHaveBeenCalledWith('/api/apartments', { credentials: 'include' })
  })

  test('sends search and filter params to apartments endpoint', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ apartments: [] }),
    } as Response)

    await listTenantApartments({
      query: 'centro',
      area: 'centro',
      priceMin: 300,
      priceMax: 500,
      totalRoomsMin: 2,
      totalRoomsMax: 4,
      availableRoomsMin: 1,
      availableRoomsMax: 2,
      availability: 'soon',
      sortBy: 'price_low',
    })

    expect(fetch).toHaveBeenCalledWith(
      '/api/apartments?q=centro&area=centro&price_min=300&price_max=500&total_rooms_min=2&total_rooms_max=4&available_rooms_min=1&available_rooms_max=2&availability=soon&sort_by=price_low',
      { credentials: 'include' },
    )
  })

  test('parses string permission flags from apartment detail safely', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        apartment: {
          id: 'apt-22',
          title: 'Piso norte',
          address: 'Calle Norte 8',
          area: 'Norte',
          total_spots: 4,
          available_spots: 1,
          base_rent: 390,
          status: 'AVAILABLE',
          created_at: '2026-05-21T10:00:00Z',
          image_url: 'https://example.test/apt-22.jpg',
        },
        can_apply: 'false',
        can_cancel: 'false',
      }),
    } as Response)

    await expect(getTenantApartmentDetail('apt-22')).resolves.toMatchObject({
      canApply: false,
      canCancel: false,
    })

    expect(fetch).toHaveBeenCalledWith('/api/apartments/apt-22', { credentials: 'include' })
  })

  test('loads tenant personal profile data', async () => {
	vi.spyOn(global, 'fetch').mockResolvedValue({
	  ok: true,
	  json: async () => ({
		user_id: 'user-1',
		full_name: 'Jairo Test',
		email: 'jairo@example.test',
		avatar_url: 'data:image/png;base64,abc',
	  }),
	} as Response)

	await expect(getTenantPersonalProfile()).resolves.toEqual({
	  userId: 'user-1',
	  fullName: 'Jairo Test',
	  email: 'jairo@example.test',
	  avatarUrl: 'data:image/png;base64,abc',
	})

	expect(fetch).toHaveBeenCalledWith('/api/tenant-profile/personal', { credentials: 'include' })
  })

  test('saves tenant personal profile data', async () => {
	vi.spyOn(global, 'fetch').mockResolvedValue({
	  ok: true,
	  json: async () => ({ message: 'tenant personal profile saved' }),
	} as Response)

	await expect(saveTenantPersonalProfile({
	  fullName: 'Jairo Test',
	  avatarUrl: 'data:image/png;base64,abc',
	})).resolves.toBe('tenant personal profile saved')

	expect(fetch).toHaveBeenCalledWith('/api/tenant-profile/personal', {
	  method: 'PUT',
	  headers: { 'Content-Type': 'application/json' },
	  body: JSON.stringify({
		full_name: 'Jairo Test',
		avatar_url: 'data:image/png;base64,abc',
	  }),
	  credentials: 'include',
	})
  })

  test('uploads tenant avatar as multipart form data', async () => {
	vi.spyOn(global, 'fetch').mockResolvedValue({
	  ok: true,
	  json: async () => ({ avatar_url: 'https://example.test/avatar.png' }),
	} as Response)

	const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
	await expect(uploadTenantAvatar(file)).resolves.toBe('https://example.test/avatar.png')

	expect(fetch).toHaveBeenCalledWith('/api/tenant-profile/avatar', expect.objectContaining({
	  method: 'POST',
	  body: expect.any(FormData),
	  credentials: 'include',
	}))
  })
})
