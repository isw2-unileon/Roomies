import { render, screen } from '@testing-library/react'
import LoginPage from './LoginPage'
import { describe, test, expect } from 'vitest'

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
})


