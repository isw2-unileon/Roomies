import { FormEvent, useState } from 'react'

import AuthHeader from '@/components/auth/AuthHeader'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthNotice from '@/components/auth/AuthNotice'
import FormField from '@/components/auth/FormField'
import { useNotice } from '@/hooks/useNotice'
import styles from '@/styles/auth.module.css'

type UserRole = 'tenant' | 'owner'

interface RegisterApiResponse {
  message?: string
  access_token?: string
  refresh_token?: string
  user_id?: string
  role?: UserRole
  needs_onboarding?: boolean
  error?: string
}

interface RegisterPageProps {
  onNavigateToLogin: () => void
  onRegisterSuccess: (payload: { role?: UserRole; needsOnboarding?: boolean }) => void
}

export default function RegisterPage({ onNavigateToLogin, onRegisterSuccess }: RegisterPageProps) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('tenant')
  const [isLoading, setIsLoading] = useState(false)
  const { notice, showError, showSuccess, clearNotice } = useNotice()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearNotice()

    if (fullName.trim().length < 2) {
      showError('El nombre completo debe tener al menos 2 caracteres.')
      return
    }

    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName.trim(), role }),
      })

      const data = (await response.json()) as RegisterApiResponse

      if (!response.ok) {
        showError(data.error ?? 'No se pudo crear tu cuenta. Inténtalo de nuevo.')
        return
      }

      const accessToken = data.access_token?.trim() ?? ''
      const refreshToken = data.refresh_token?.trim() ?? ''

      if (accessToken) {
        localStorage.setItem('roomies.access_token', accessToken)
        if (refreshToken) localStorage.setItem('roomies.refresh_token', refreshToken)

        onRegisterSuccess({ role: data.role, needsOnboarding: data.needs_onboarding })
        showSuccess(data.message ?? 'Cuenta creada correctamente. Ya puedes iniciar sesión.')
        return
      }

      showSuccess(
        'Cuenta creada. Revisa tu correo y confirma tu cuenta antes de iniciar sesión y completar tu perfil.',
      )
    } catch {
      showError('No se pudo crear tu cuenta. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      sidebarDescription="Crea tu perfil en Roomies y conecta con personas que encajen con tu estilo de vida y presupuesto."
      sidebarTagline="Crea tu cuenta. Encuentra tu próxima habitación."
    >
      <AuthHeader
        title="Crear cuenta"
        subtitle="Completa tus datos para empezar a usar Roomies."
      />

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        {/* Selector de rol */}
        <div>
          <p className={styles.roleLabel}>Tipo de usuario</p>
          <div className={styles.roleGrid}>
            {ROLE_OPTIONS.map(({ value, label, description }) => (
              <label key={value} className={styles.roleOption}>
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={role === value}
                  onChange={() => setRole(value)}
                  className={styles.roleRadio}
                />
                <span>
                  <span className={styles.roleTitle}>{label}</span>
                  <span className={styles.roleDescription}>{description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <FormField
          id="full-name"
          label="Nombre completo"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          placeholder="Tu nombre completo"
          required
          minLength={2}
        />

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
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
          required
          minLength={6}
        />

        <FormField
          id="confirm-password"
          label="Confirmar contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          required
          minLength={6}
        />

        <AuthNotice kind={notice.kind} message={notice.message} />

        <button type="submit" disabled={isLoading} className={styles.btnPrimary}>
          {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <button type="button" onClick={onNavigateToLogin} className={styles.btnGhost}>
          Volver al inicio de sesión
        </button>
      </form>
    </AuthLayout>
  )
}

//Constants

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'tenant', label: 'Tenant', description: 'Inquilino que busca vivienda' },
  { value: 'owner', label: 'Owner', description: 'Propietario de vivienda' },
]