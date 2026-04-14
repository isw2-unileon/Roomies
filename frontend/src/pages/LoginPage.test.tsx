import { render, screen } from '@testing-library/react'
import LoginPage from './LoginPage'
import { describe, test, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'

describe('LoginPage', () => {
  test('renders login form fields and actions', () => {
    render(
      <LoginPage
        onNavigateToRegister={() => {}}
        onLoginSuccess={() => {}}
      />
    )
    expect(screen.getByRole('heading', { name: /bienvenido de nuevo/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electronico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^contrasena$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesion/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /he olvidado mi contrasena/i })).toBeInTheDocument()
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
    const forgotPasswordButton = screen.getByRole('button', { name: /he olvidado mi contrasena/i })
    await user.click(forgotPasswordButton)
    expect(screen.getByText(/introduce tu correo para recuperar la contrasena/i)).toBeInTheDocument()
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
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    render(
      <LoginPage
        onNavigateToRegister={() => {}}
        onLoginSuccess={onLoginSuccess}
      />
    )
    await user.type(screen.getByLabelText(/correo electronico/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^contrasena$/i), '123456')
    await user.click(screen.getByRole('button', { name: /iniciar sesion/i }))
    expect(fetch).toHaveBeenCalled()
    expect(setItemSpy).toHaveBeenCalledWith('roomies.access_token', 'access-token')
    expect(setItemSpy).toHaveBeenCalledWith('roomies.refresh_token', 'refresh-token')
    expect(onLoginSuccess).toHaveBeenCalledWith({role: 'tenant', needsOnboarding: true})
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
    await user.type(screen.getByLabelText(/correo electronico/i), 'test@test.com')
    await user.type(screen.getByLabelText(/^contrasena$/i), '123456')
    await user.click(screen.getByRole('button', { name: /iniciar sesion/i }))
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
    await user.type(screen.getByLabelText(/correo electronico/i), 'test@test.com')
    await user.click(screen.getByRole('button', { name: /he olvidado mi contrasena/i }))
    expect(fetch).toHaveBeenCalledWith('/api/auth/forgot-password', expect.objectContaining({method: 'POST'}))
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
    await user.type(screen.getByLabelText(/correo electronico/i), 'test@test.com')
    await user.click(screen.getByRole('button', { name: /he olvidado mi contrasena/i }))
    expect(await screen.findByText(/error al enviar correo/i)).toBeInTheDocument()
  })
})


