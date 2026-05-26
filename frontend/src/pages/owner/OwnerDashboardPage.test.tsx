import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { paths } from '@/routes/paths'
import { getProfileStatus, logout } from '@/services/authService'
import { listOwnerApartments } from '@/services/ownerService'

import OwnerDashboardPage from './OwnerDashboardPage'

vi.mock('@/services/authService', () => ({
  getProfileStatus: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('@/services/ownerService', () => ({
  listOwnerApartments: vi.fn(),
}))

const mockedGetProfileStatus = vi.mocked(getProfileStatus)
const mockedLogout = vi.mocked(logout)
const mockedListOwnerApartments = vi.mocked(listOwnerApartments)

function renderOwnerDashboard() {
  render(
    <MemoryRouter initialEntries={[paths.ownerDashboard]}>
      <Routes>
        <Route path="/" element={<p>Login page</p>} />
        <Route path="*" element={<OwnerDashboardPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OwnerDashboardPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  test('does not keep mock properties when loading owner apartments fails', async () => {
    mockedGetProfileStatus.mockResolvedValue({ role: 'owner', needsOnboarding: false })
    mockedListOwnerApartments.mockRejectedValue(new Error('apartments are only available for owner users'))

    renderOwnerDashboard()

    await screen.findByText('apartments are only available for owner users')

    expect(screen.queryByRole('img', { name: 'Piso en el centro' })).not.toBeInTheDocument()
    expect(screen.getByText('Todavia no tienes pisos publicados.')).toBeInTheDocument()
  })

  test('does not request owner apartments when the current session is not owner', async () => {
    mockedGetProfileStatus.mockResolvedValue({ role: 'tenant', needsOnboarding: false })

    renderOwnerDashboard()

    await screen.findByText('Esta seccion solo esta disponible para propietarios. Inicia sesion con una cuenta owner.')

    expect(mockedListOwnerApartments).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.queryByRole('img', { name: 'Piso en el centro' })).not.toBeInTheDocument()
    })
  })

  test('logs out from the owner sidebar and returns to login', async () => {
    const user = userEvent.setup()
    mockedGetProfileStatus.mockResolvedValue({ role: 'owner', needsOnboarding: false })
    mockedListOwnerApartments.mockResolvedValue([])
    mockedLogout.mockResolvedValue(undefined)

    renderOwnerDashboard()

    const logoutButtons = await screen.findAllByRole('button', { name: /cerrar sesion/i })
    await user.click(logoutButtons[0])

    expect(mockedLogout).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })
})
