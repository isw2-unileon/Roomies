import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AuthHeader from '@/components/auth/AuthHeader'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthNotice from '@/components/auth/AuthNotice'
import FormField from '@/components/auth/FormField'
import { useNotice } from '@/hooks/useNotice'
import { forgotPassword, login } from '@/services/authService'
import { saveAuthSession } from '@/session/authSession'
import styles from '@/styles/auth.module.css'

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
      const result = await login({ email, password })
      saveAuthSession({ accessToken: result.accessToken, refreshToken: result.refreshToken })

      onLoginSuccess({ role: result.role, needsOnboarding: result.needsOnboarding })
      showSuccess(result.message ?? t('auth.login.successDefault'))
    } catch (error) {
      showError(error instanceof Error ? error.message : t('auth.login.errors.default'))
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
      const message = await forgotPassword(email)
      showSuccess(message ?? t('auth.login.forgotSuccessDefault'))
    } catch (error) {
      showError(error instanceof Error ? error.message : t('auth.login.errors.forgotDefault'))
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
