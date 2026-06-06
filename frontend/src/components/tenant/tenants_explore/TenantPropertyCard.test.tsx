import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'

import type { TenantProperty } from '@/types/tenant'

import TenantPropertyCard from './TenantPropertyCard'

const property: TenantProperty = {
  id: 'apt-1',
  titleKey: 'Piso centro',
  addressKey: 'Calle Ancha 12',
  areaKey: 'Centro',
  availableRooms: 0,
  totalRooms: 3,
  rent: 420,
  compatibilityScore: 0,
  status: 'full',
  images: [],
  createdAt: '2026-05-21T10:00:00Z',
  latitude: 42.6,
  longitude: -5.57,
  bathrooms: 1,
  surfaceM2: 80,
  floor: 2,
  isCurrentTenantHome: true,
}

describe('TenantPropertyCard', () => {
  test('shows current tenant home badge', () => {
    render(<TenantPropertyCard property={property} />)

    expect(screen.getByText('TU PISO')).toBeInTheDocument()
  })
})
