import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { getProfileStatus } from '@/services/authService'
import { listOwnerApartments } from '@/services/ownerService'

import OwnerDashboardPage from './OwnerDashboardPage'

vi.mock('@/services/authService', () => ({
  getProfileStatus: vi.fn(),
}))

vi.mock('@/services/ownerService', () => ({
  listOwnerApartments: vi.fn(),
}))

const mockedGetProfileStatus = vi.mocked(getProfileStatus)
const mockedListOwnerApartments = vi.mocked(listOwnerApartments)

function renderOwnerDashboard() {
  render(
    <MemoryRouter>
      <OwnerDashboardPage />
    </MemoryRouter>,
  )
}

describe('OwnerDashboardPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  test('does not keep mock properties when loading owner apartments fails', async () => {
    localStorage.setItem('roomies.access_token', 'access-token')
    mockedGetProfileStatus.mockResolvedValue({ role: 'owner', needsOnboarding: false })
    mockedListOwnerApartments.mockRejectedValue(new Error('apartments are only available for owner users'))

    renderOwnerDashboard()

    await screen.findByText('apartments are only available for owner users')

    expect(screen.queryByRole('img', { name: 'Piso en el centro' })).not.toBeInTheDocument()
    expect(screen.getByText('Todavia no tienes pisos publicados.')).toBeInTheDocument()
  })

  test('does not request owner apartments when the current session is not owner', async () => {
    localStorage.setItem('roomies.access_token', 'access-token')
    mockedGetProfileStatus.mockResolvedValue({ role: 'tenant', needsOnboarding: false })

    renderOwnerDashboard()

    await screen.findByText('Esta seccion solo esta disponible para propietarios. Inicia sesion con una cuenta owner.')

    expect(mockedListOwnerApartments).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.queryByRole('img', { name: 'Piso en el centro' })).not.toBeInTheDocument()
    })
  })
})
