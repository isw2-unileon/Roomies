import { render, screen, waitFor } from '@testing-library/react'
import LoginPage from './LoginPage'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.removeItem('roomies.access_token')
    localStorage.removeItem('roomies.refresh_token')
  })
  test('renders login form fields and actions', () => {
    render(
      <LoginPage
        onNavigateToRegister={() => {}}
        onLoginSuccess={() => {}}
      />
    )
    expect(screen.getByRole('heading', { name: /bienvenido de nuevo/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electr[oó]nico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^contrase(?:n|ñ)a$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesi[oó]n/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /he olvidado mi contrase(?:n|ñ)a/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /crear una cuenta/i })).toBeInTheDocument()
  })

  test('calls onNavigateToRegister when clicking "Crear una cuenta"', async () => {
    const user = userEvent.setup()
    const onNavigateToRegister = vi.fn()
    render(
      <LoginPage
        onNavigateToRegister={onNavigateToRegister}
        onLoginSuccess={() => {}}
      />
    )
    const registerButton = screen.getByRole('button', { name: /crear una cuenta/i })
    await user.click(registerButton)
    expect(onNavigateToRegister).toHaveBeenCalledTimes(1)
  })

  test('shows error if user tries to recover password without email', async () => {
    const user = userEvent.setup()
    render(
      <LoginPage
        onNavigateToRegister={() => {}}
        onLoginSuccess={() => {}}
      />
    )
    const forgotPasswordButton = screen.getByRole('button', { name: /he olvidado mi contrase(?:n|ñ)a/i })
    await user.click(forgotPasswordButton)
    expect(screen.getByText(/introduce tu correo para recuperar la contrase(?:n|ñ)a/i)).toBeInTheDocument()
  })

  test('logs in successfully and calls onLoginSuccess', async () => {
    const user = userEvent.setup()
    const onLoginSuccess = vi.fn()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Login correcto. Ya puedes continuar en la app.',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        role: 'tenant',
        needs_onboarding: true,
      }),
    } as Response)
    
    render(
      <LoginPage
        onNavigateToRegister={() => {}}
        onLoginSuccess={onLoginSuccess}
      />
    )
    await user.type(screen.getByLabelText(/correo electr[oó]nico/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^contrase(?:n|ñ)a$/i), '123456')
    await user.click(screen.getByRole('button', { name: /iniciar sesi[oó]n/i }))
    expect(fetch).toHaveBeenCalled()
    await waitFor(() => {
    expect(localStorage.getItem('roomies.access_token')).toBe('access-token')
    expect(localStorage.getItem('roomies.refresh_token')).toBe('refresh-token')
    expect(onLoginSuccess).toHaveBeenCalledWith({ role: 'tenant', needsOnboarding: true })
  })
    expect(await screen.findByText(/login correcto/i)).toBeInTheDocument()
  })

  test('shows error message when login fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Credenciales incorrectas',
      }),
    } as Response)
    render(
      <LoginPage
        onNavigateToRegister={() => {}}
        onLoginSuccess={() => {}}
      />
    )
    await user.type(screen.getByLabelText(/correo electr[oó]nico/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^contrase(?:n|ñ)a$/i), '123456')
    await user.click(screen.getByRole('button', { name: /iniciar sesi[oó]n/i }))
    expect(await screen.findByText(/credenciales incorrectas/i)).toBeInTheDocument()
  })

  test('sends forgot password request successfully', async () => {
    const user = userEvent.setup()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Correo enviado correctamente',
      }),
    } as Response)
    render(
      <LoginPage
        onNavigateToRegister={() => {}}
        onLoginSuccess={() => {}}
      />
    )
    await user.type(screen.getByLabelText(/correo electr[oó]nico/i), 'test@test.com')
    await user.click(screen.getByRole('button', { name: /he olvidado mi contrase(?:n|ñ)a/i }))
    expect(fetch).toHaveBeenCalledWith('/api/auth/forgot-password', expect.objectContaining({ method: 'POST' }))
    expect(await screen.findByText(/correo enviado correctamente/i)).toBeInTheDocument()
  })

  test('shows error if forgot password request fails', async () => {
    const user = userEvent.setup()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Error al enviar correo',
      }),
    } as Response)
    render(
      <LoginPage
        onNavigateToRegister={() => {}}
        onLoginSuccess={() => {}}
      />
    )
    await user.type(screen.getByLabelText(/correo electr[oó]nico/i), 'test@test.com')
    await user.click(screen.getByRole('button', { name: /he olvidado mi contrase(?:n|ñ)a/i }))
    expect(await screen.findByText(/error al enviar correo/i)).toBeInTheDocument()
  })
})
