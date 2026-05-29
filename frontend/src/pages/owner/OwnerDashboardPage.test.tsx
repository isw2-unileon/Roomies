import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
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
    <MemoryRouter initialEntries={[paths.ownerProperties]}>
      <Routes>
        <Route path="/" element={<p>Login page</p>} />
        <Route path="*" element={<OwnerDashboardPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function EditStateProbe() {
  const location = useLocation()
  const state = location.state as { propertyId?: string } | null

  return <p>Edit property: {state?.propertyId ?? 'none'}</p>
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
    expect(screen.getByText('Todavía no tienes pisos publicados.')).toBeInTheDocument()
  })

  test('does not request owner apartments when the current session is not owner', async () => {
    mockedGetProfileStatus.mockResolvedValue({ role: 'tenant', needsOnboarding: false })

    renderOwnerDashboard()

    await screen.findByText('Esta sección solo está disponible para propietarios. Inicia sesión con una cuenta owner.')

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

    const logoutButtons = await screen.findAllByRole('button', { name: /cerrar sesión/i })
    const logoutButton = logoutButtons[0]

    if (!logoutButton) {
      throw new Error('Expected logout button')
    }

    await user.click(logoutButton)

    expect(mockedLogout).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })

  test('renders the collapsible owner sidebar without the top bar', async () => {
    const user = userEvent.setup()
    mockedGetProfileStatus.mockResolvedValue({ role: 'owner', needsOnboarding: false })
    mockedListOwnerApartments.mockResolvedValue([])

    renderOwnerDashboard()

    await screen.findByRole('heading', { name: /mis pisos/i })
    expect(screen.queryByRole('textbox', { name: /buscar/i })).not.toBeInTheDocument()

    const toggleButton = screen.getByRole('button', { name: /ocultar menú/i })
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

    await user.click(toggleButton)

    expect(screen.getByRole('button', { name: /mostrar menú/i })).toHaveAttribute('aria-expanded', 'false')
  })

  test('navigates to the publish page with the selected property id when editing', async () => {
    const user = userEvent.setup()
    mockedGetProfileStatus.mockResolvedValue({ role: 'owner', needsOnboarding: false })
    mockedListOwnerApartments.mockResolvedValue([
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
        image: '',
      },
    ])

    render(
      <MemoryRouter initialEntries={[paths.ownerProperties]}>
        <Routes>
          <Route path={paths.ownerProperties} element={<OwnerDashboardPage />} />
          <Route path={paths.ownerPublishProperty} element={<EditStateProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: /editar centro/i }))

    expect(await screen.findByText('Edit property: apt-1')).toBeInTheDocument()
  })
})
