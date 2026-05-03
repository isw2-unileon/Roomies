import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AuthHeader from '@/components/auth/AuthHeader'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthNotice from '@/components/auth/AuthNotice'
import FormField from '@/components/auth/FormField'
import { useNotice } from '@/hooks/useNotice'
import { apiFetch } from '@/api'
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
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('tenant')
  const [isLoading, setIsLoading] = useState(false)
  const { notice, showError, showSuccess, clearNotice } = useNotice()

  const roleOptions: { value: UserRole; label: string; description: string }[] = [
    {
      value: 'tenant',
      label: t('auth.register.role.tenant.label'),
      description: t('auth.register.role.tenant.description'),
    },
    {
      value: 'owner',
      label: t('auth.register.role.owner.label'),
      description: t('auth.register.role.owner.description'),
    },
  ]

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearNotice()

    if (fullName.trim().length < 2) {
      showError(t('auth.register.errors.fullNameMin'))
      return
    }

    if (password.length < 6) {
      showError(t('auth.register.errors.passwordMin'))
      return
    }

    if (password !== confirmPassword) {
      showError(t('auth.register.errors.passwordMismatch'))
      return
    }

    setIsLoading(true)

    try {
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName.trim(), role }),
      })

      const data = (await response.json()) as RegisterApiResponse

      if (!response.ok) {
        showError(data.error ?? t('auth.register.errors.default'))
        return
      }

      const accessToken = data.access_token?.trim() ?? ''
      const refreshToken = data.refresh_token?.trim() ?? ''

      if (accessToken) {
        localStorage.setItem('roomies.access_token', accessToken)
        if (refreshToken) localStorage.setItem('roomies.refresh_token', refreshToken)

        onRegisterSuccess({ role: data.role, needsOnboarding: data.needs_onboarding })
        showSuccess(data.message ?? t('auth.register.successDefault'))
        return
      }

      showSuccess(t('auth.register.successNeedsConfirmation'))
    } catch {
      showError(t('auth.register.errors.default'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      sidebarDescription={t('auth.register.sidebarDescription')}
      sidebarTagline={t('auth.register.sidebarTagline')}
    >
      <AuthHeader
        title={t('auth.register.title')}
        subtitle={t('auth.register.subtitle')}
      />

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        {/* Selector de rol */}
        <div>
          <p className={styles.roleLabel}>{t('auth.register.userType')}</p>
          <div className={styles.roleGrid}>
            {roleOptions.map(({ value, label, description }) => (
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
          label={t('auth.register.fullNameLabel')}
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          placeholder={t('auth.register.fullNamePlaceholder')}
          required
          minLength={2}
        />

        <FormField
          id="email"
          label={t('auth.register.emailLabel')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder={t('auth.register.emailPlaceholder')}
          required
        />

        <FormField
          id="password"
          label={t('auth.register.passwordLabel')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={t('auth.register.passwordPlaceholder')}
          required
          minLength={6}
        />

        <FormField
          id="confirm-password"
          label={t('auth.register.confirmPasswordLabel')}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          placeholder={t('auth.register.confirmPasswordPlaceholder')}
          required
          minLength={6}
        />

        <AuthNotice kind={notice.kind} message={notice.message} />

        <button type="submit" disabled={isLoading} className={styles.btnPrimary}>
          {isLoading ? t('auth.register.submitting') : t('auth.register.submit')}
        </button>

        <button type="button" onClick={onNavigateToLogin} className={styles.btnGhost}>
          {t('auth.register.backToLogin')}
        </button>
      </form>
    </AuthLayout>
  )
}
