import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import RegisterPage from './RegisterPage'

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('renders register form fields and actions', () => {
    render(
      <RegisterPage
        onNavigateToLogin={() => {}}
        onRegisterSuccess={() => {}}
      />
    )
    expect(screen.getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument()
    expect(screen.getByText(/tipo de usuario/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electronico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^contrasena$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirmar contrasena/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^crear cuenta$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /volver al inicio de sesion/i })).toBeInTheDocument()
  })

  test('calls onNavigateToLogin when clicking "Volver al inicio de sesion"', async () => {
    const user = userEvent.setup()
    const onNavigateToLogin = vi.fn()
    render(
      <RegisterPage
        onNavigateToLogin={onNavigateToLogin}
        onRegisterSuccess={() => {}}
      />
    )
    await user.click(screen.getByRole('button', { name: /volver al inicio de sesion/i }))
    expect(onNavigateToLogin).toHaveBeenCalledTimes(1)
  })

  test('shows error if passwords do not match', async () => {
    const user = userEvent.setup()
    render(
      <RegisterPage
        onNavigateToLogin={() => {}}
        onRegisterSuccess={() => {}}
      />
    )
    await user.type(screen.getByLabelText(/nombre completo/i), 'Jairo')
    await user.type(screen.getByLabelText(/correo electronico/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^contrasena$/i), '123456')
    await user.type(screen.getByLabelText(/confirmar contrasena/i), '654321')
    await user.click(screen.getByRole('button', { name: /^crear cuenta$/i }))
    expect(screen.getByText(/las contrasenas no coinciden/i)).toBeInTheDocument()
  })

  test('registers successfully and calls onRegisterSuccess when backend returns a session', async () => {
    const user = userEvent.setup()
    const onRegisterSuccess = vi.fn()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Cuenta creada correctamente. Ya puedes iniciar sesion.',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        role: 'tenant',
        needs_onboarding: true,
      }),
    } as Response)
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    render(
      <RegisterPage
        onNavigateToLogin={() => {}}
        onRegisterSuccess={onRegisterSuccess}
      />
    )
    await user.type(screen.getByLabelText(/nombre completo/i), 'Jairo Ugidos')
    await user.type(screen.getByLabelText(/correo electronico/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^contrasena$/i), '123456')
    await user.type(screen.getByLabelText(/confirmar contrasena/i), '123456')
    await user.click(screen.getByRole('button', { name: /^crear cuenta$/i }))
    expect(fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({method: 'POST'}))
    expect(setItemSpy).toHaveBeenCalledWith('roomies.access_token', 'access-token')
    expect(setItemSpy).toHaveBeenCalledWith('roomies.refresh_token', 'refresh-token')
    expect(onRegisterSuccess).toHaveBeenCalledWith({role: 'tenant', needsOnboarding: true})
    expect(await screen.findByText(/cuenta creada correctamente/i)).toBeInTheDocument()
  })

  test('shows error message when register fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'No se pudo crear tu cuenta.',
      }),
    } as Response)
    render(
      <RegisterPage
        onNavigateToLogin={() => {}}
        onRegisterSuccess={() => {}}
      />
    )
    await user.type(screen.getByLabelText(/nombre completo/i), 'Jairo Ugidos')
    await user.type(screen.getByLabelText(/correo electronico/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^contrasena$/i), '123456')
    await user.type(screen.getByLabelText(/confirmar contrasena/i), '123456')
    await user.click(screen.getByRole('button', { name: /^crear cuenta$/i }))
    expect(await screen.findByText(/no se pudo crear tu cuenta/i)).toBeInTheDocument()
  })
})