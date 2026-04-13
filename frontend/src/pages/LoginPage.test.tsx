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
    const onNavigateToRegister = vi.fn();
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

})


