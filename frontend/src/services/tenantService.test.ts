import { beforeEach, describe, expect, test, vi } from 'vitest'

import { listTenantApartments } from './tenantService'

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

    expect(fetch).toHaveBeenCalledWith('/api/apartments', undefined)
  })
})
