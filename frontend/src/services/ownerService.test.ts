import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createApartment, listOwnerApartments } from './ownerService'

describe('ownerService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  test('maps owner apartment DTOs to frontend owner properties', async () => {
    localStorage.setItem('roomies.access_token', 'access-token')
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        apartments: [
          {
            id: 'apt-1',
            title: 'Centro',
            address: 'Calle Ancha',
            area: 'Centro',
            total_spots: 3,
            occupied_spots: 1,
            base_rent: 420,
            status: 'AVAILABLE',
            created_at: '2026-05-21T10:00:00Z',
            image_url: 'https://example.test/apt.jpg',
          },
        ],
      }),
    } as Response)

    await expect(listOwnerApartments()).resolves.toEqual([
      {
        id: 'apt-1',
        title: 'Centro',
        address: 'Calle Ancha',
        area: 'Centro',
        totalSpots: 3,
        occupiedSpots: 1,
        rent: 420,
        status: 'AVAILABLE',
        createdAt: '2026-05-21T10:00:00Z',
        image: 'https://example.test/apt.jpg',
      },
    ])

    expect(fetch).toHaveBeenCalledWith('/api/owner/apartments', {
      headers: { Authorization: 'Bearer access-token' },
    })
  })

  test('posts apartment creation payload with backend field names', async () => {
    localStorage.setItem('roomies.access_token', 'access-token')
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'created', apartment_id: 'apt-1', images_stored: 2 }),
    } as Response)

    await expect(createApartment({
      title: 'Centro',
      description: 'Nice',
      address: 'Calle Ancha',
      area: 'Centro',
      totalSpots: 3,
      bathrooms: 1,
      baseRent: 420,
      availableFrom: '2026-06-01',
      imageUrls: ['https://example.test/1.jpg', 'https://example.test/2.jpg'],
    })).resolves.toEqual({ message: 'created', apartmentId: 'apt-1', imagesStored: 2 })

    expect(fetch).toHaveBeenCalledWith('/api/apartments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer access-token',
      },
      body: JSON.stringify({
        title: 'Centro',
        description: 'Nice',
        address: 'Calle Ancha',
        area: 'Centro',
        total_spots: 3,
        bathrooms: 1,
        base_rent: 420,
        available_from: '2026-06-01',
        image_urls: ['https://example.test/1.jpg', 'https://example.test/2.jpg'],
      }),
    })
  })
})
