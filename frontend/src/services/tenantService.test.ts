import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getTenantApartmentDetail, listTenantApartments } from './tenantService'

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
        images: ['https://example.test/apt.jpg'],
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

  test('sends map filter params to /api/apartments/map endpoint', async () => {
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
            latitude: 42.6,
            longitude: -5.57,
          },
        ],
      }),
    } as Response)

    const result = await listTenantApartments({ lat: 42.6, lng: -5.57, radius: 2 })

    expect(fetch).toHaveBeenCalledWith(
      '/api/apartments/map?lat=42.6&lng=-5.57&radius=2',
      { credentials: 'include' },
    )
    expect(result[0].latitude).toBe(42.6)
    expect(result[0].longitude).toBe(-5.57)
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
})
