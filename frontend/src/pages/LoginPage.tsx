import { FormEvent, useState } from 'react'

import AuthHeader from '@/components/auth/AuthHeader'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthNotice from '@/components/auth/AuthNotice'
import FormField from '@/components/auth/FormField'
import { useNotice } from '@/hooks/useNotice'
import styles from '@/styles/auth.module.css'

const DEFAULT_ERROR_MESSAGE = 'No se pudo iniciar sesión ahora mismo. Inténtalo de nuevo.'

interface LoginApiResponse {
  message?: string
  access_token?: string
  refresh_token?: string
  user_id?: string
  role?: 'tenant' | 'owner'
  needs_onboarding?: boolean
  error?: string
}

interface ForgotPasswordApiResponse {
  message?: string
  error?: string
}

interface LoginPageProps {
  onNavigateToRegister: () => void
  onLoginSuccess: (payload: { role?: 'tenant' | 'owner'; needsOnboarding?: boolean }) => void
}

export default function LoginPage({ onNavigateToRegister, onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecovering, setIsRecovering] = useState(false)
  const { notice, showError, showSuccess, clearNotice } = useNotice()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearNotice()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = (await response.json()) as LoginApiResponse

      if (!response.ok) {
        showError(data.error ?? DEFAULT_ERROR_MESSAGE)
        return
      }

      if (data.access_token) localStorage.setItem('roomies.access_token', data.access_token)
      if (data.refresh_token) localStorage.setItem('roomies.refresh_token', data.refresh_token)

      onLoginSuccess({ role: data.role, needsOnboarding: data.needs_onboarding })
      showSuccess(data.message ?? 'Login correcto. Ya puedes continuar en la app.')
    } catch {
      showError(DEFAULT_ERROR_MESSAGE)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleForgotPassword() {
    clearNotice()

    if (!email.trim()) {
      showError('Introduce tu correo para recuperar la contraseña.')
      return
    }

    setIsRecovering(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = (await response.json()) as ForgotPasswordApiResponse

      if (!response.ok) {
        showError(data.error ?? 'No se pudo enviar el correo de recuperación.')
        return
      }

      showSuccess(data.message ?? 'Te hemos enviado un correo para restablecer la contraseña.')
    } catch {
      showError('No se pudo enviar el correo de recuperación.')
    } finally {
      setIsRecovering(false)
    }
  }

  const isAnyLoading = isLoading || isRecovering

  return (
    <AuthLayout
      sidebarDescription="Encuentra tu próximo hogar con personas que encajen con tu estilo de vida, presupuesto y forma de vivir."
      sidebarTagline="Matching simple. Mejor convivencia."
    >
      <AuthHeader
        title="Bienvenido de nuevo"
        subtitle="Inicia sesión con tu correo y contraseña para acceder a tu cuenta."
      />

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <FormField
          id="email"
          label="Correo electrónico"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="tu@ejemplo.com"
          required
        />

        <FormField
          id="password"
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Introduce tu contraseña"
          required
          minLength={6}
        />

        <AuthNotice kind={notice.kind} message={notice.message} />

        <button type="submit" disabled={isAnyLoading} className={styles.btnPrimary}>
          {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>

        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={isAnyLoading}
          className={styles.btnSecondary}
        >
          {isRecovering ? 'Enviando correo...' : 'He olvidado mi contraseña'}
        </button>

        <button type="button" onClick={onNavigateToRegister} className={styles.btnGhost}>
          Crear una cuenta
        </button>
      </form>
    </AuthLayout>
  )
}
