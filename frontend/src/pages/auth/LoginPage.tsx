import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AuthHeader from '@/components/auth/AuthHeader'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthNotice from '@/components/auth/AuthNotice'
import FormField from '@/components/auth/FormField'
import { useNotice } from '@/hooks/useNotice'
import { apiFetch } from '@/api'
import styles from '@/styles/auth.module.css'

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
  const { t } = useTranslation()
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
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = (await response.json()) as LoginApiResponse

      if (!response.ok) {
        showError(data.error ?? t('auth.login.errors.default'))
        return
      }

      if (data.access_token) localStorage.setItem('roomies.access_token', data.access_token)
      if (data.refresh_token) localStorage.setItem('roomies.refresh_token', data.refresh_token)

      onLoginSuccess({ role: data.role, needsOnboarding: data.needs_onboarding })
      showSuccess(data.message ?? t('auth.login.successDefault'))
    } catch {
      showError(t('auth.login.errors.default'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleForgotPassword() {
    clearNotice()

    if (!email.trim()) {
      showError(t('auth.login.errors.forgotWithoutEmail'))
      return
    }

    setIsRecovering(true)

    try {
      const response = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = (await response.json()) as ForgotPasswordApiResponse

      if (!response.ok) {
        showError(data.error ?? t('auth.login.errors.forgotDefault'))
        return
      }

      showSuccess(data.message ?? t('auth.login.forgotSuccessDefault'))
    } catch {
      showError(t('auth.login.errors.forgotDefault'))
    } finally {
      setIsRecovering(false)
    }
  }

  const isAnyLoading = isLoading || isRecovering

  return (
    <AuthLayout
      sidebarDescription={t('auth.login.sidebarDescription')}
      sidebarTagline={t('auth.login.sidebarTagline')}
    >
      <AuthHeader
        title={t('auth.login.title')}
        subtitle={t('auth.login.subtitle')}
      />

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <FormField
          id="email"
          label={t('auth.login.emailLabel')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder={t('auth.login.emailPlaceholder')}
          required
        />

        <FormField
          id="password"
          label={t('auth.login.passwordLabel')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder={t('auth.login.passwordPlaceholder')}
          required
          minLength={6}
        />

        <AuthNotice kind={notice.kind} message={notice.message} />

        <button type="submit" disabled={isAnyLoading} className={styles.btnPrimary}>
          {isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>

        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={isAnyLoading}
          className={styles.btnSecondary}
        >
          {isRecovering ? t('auth.login.forgotPasswordSending') : t('auth.login.forgotPassword')}
        </button>

        <button type="button" onClick={onNavigateToRegister} className={styles.btnGhost}>
          {t('auth.login.goToRegister')}
        </button>
      </form>
    </AuthLayout>
  )
}
