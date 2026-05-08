import { useEffect, useMemo, useState } from 'react'

import { apiFetch } from '@/api'
import AuthHeader from '@/components/auth/AuthHeader'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthNotice from '@/components/auth/AuthNotice'
import { paths } from '@/routes/paths'
import styles from '@/styles/auth.module.css'

type NoticeKind = 'idle' | 'error' | 'success'

interface ProfileStatusResponse {
  role?: 'tenant' | 'owner'
  needs_onboarding?: boolean
  error?: string
}

interface AuthCallbackPageProps {
  onResolved: (payload: { role?: 'tenant' | 'owner'; needsOnboarding?: boolean }) => void
  onNavigateToLogin: () => void
}

const DEFAULT_ERROR_MESSAGE = 'No se pudo confirmar tu cuenta. Abre de nuevo el enlace del correo o solicita uno nuevo.'

function getAuthDataFromUrl() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const queryParams = new URLSearchParams(window.location.search)

  const accessToken = hashParams.get('access_token') || queryParams.get('access_token') || ''
  const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token') || ''
  const tokenHash = hashParams.get('token_hash') || queryParams.get('token_hash') || ''
  const token = hashParams.get('token') || queryParams.get('token') || ''
  const email = hashParams.get('email') || queryParams.get('email') || ''
  const verifyType = hashParams.get('type') || queryParams.get('type') || ''
  const error = hashParams.get('error_description') || hashParams.get('error') || queryParams.get('error') || ''

  return {
    accessToken: accessToken.trim(),
    refreshToken: refreshToken.trim(),
    tokenHash: tokenHash.trim(),
    token: token.trim(),
    email: email.trim(),
    verifyType: verifyType.trim(),
    error: error.trim(),
  }
}

export default function AuthCallbackPage({ onResolved, onNavigateToLogin }: AuthCallbackPageProps) {
  const [notice, setNotice] = useState<{ kind: NoticeKind; message: string }>({
    kind: 'idle',
    message: 'Confirmando tu cuenta...'
  })

  const buttonLabel = useMemo(() => {
    if (notice.kind === 'error') {
      return 'Volver al login'
    }

    return 'Ir al login'
  }, [notice.kind])

  useEffect(() => {
    let cancelled = false

    async function resolveVerification() {
      const authData = getAuthDataFromUrl()

      if (authData.error) {
        if (!cancelled) {
          setNotice({ kind: 'error', message: authData.error })
        }
        return
      }

      let accessToken = authData.accessToken
      let refreshToken = authData.refreshToken

      if (!accessToken && !authData.tokenHash && !authData.token) {
        if (!cancelled) {
          setNotice({ kind: 'success', message: 'Cuenta confirmada correctamente. Ya puedes iniciar sesion.' })
        }
        return
      }

      if (!accessToken && (authData.tokenHash || authData.token)) {
        try {
          const confirmResponse = await apiFetch('/api/auth/confirm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token_hash: authData.tokenHash,
              token: authData.token,
              type: authData.verifyType || 'signup',
              email: authData.email,
            }),
          })

          const confirmData = (await confirmResponse.json()) as {
            access_token?: string
            refresh_token?: string
            error?: string
          }

          if (!confirmResponse.ok) {
            throw new Error(confirmData.error || DEFAULT_ERROR_MESSAGE)
          }

          accessToken = (confirmData.access_token || '').trim()
          refreshToken = (confirmData.refresh_token || '').trim()
        } catch (error) {
          if (!cancelled) {
            const message = error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE
            setNotice({ kind: 'error', message })
          }
          return
        }
      }

      if (!accessToken) {
        if (!cancelled) {
          setNotice({ kind: 'error', message: DEFAULT_ERROR_MESSAGE })
        }
        return
      }

      localStorage.setItem('roomies.access_token', accessToken)
      if (refreshToken) {
        localStorage.setItem('roomies.refresh_token', refreshToken)
      }

      window.history.replaceState({}, '', paths.authCallback)

      try {
        const response = await apiFetch('/api/profile/status', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        const data = (await response.json()) as ProfileStatusResponse
        if (!response.ok) {
          throw new Error(data.error || DEFAULT_ERROR_MESSAGE)
        }

        if (!cancelled) {
          setNotice({ kind: 'success', message: 'Cuenta confirmada correctamente. Redirigiendo...' })
          onResolved({
            role: data.role,
            needsOnboarding: data.needs_onboarding,
          })
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE
          setNotice({ kind: 'error', message })
        }
      }
    }

    resolveVerification()

    return () => {
      cancelled = true
    }
  }, [onResolved])

  return (
    <AuthLayout
      sidebarDescription="Estamos validando tu enlace de confirmacion para activar tu cuenta en Roomies."
      sidebarTagline="Confirmacion de cuenta en curso."
    >
      <AuthHeader title="Confirmar cuenta" subtitle={notice.message} />

      <div className={styles.form}>
        <AuthNotice kind={notice.kind} message={notice.message} />

        {notice.kind !== 'idle' ? (
          <button type="button" onClick={onNavigateToLogin} className={styles.btnPrimary}>
            {buttonLabel}
          </button>
        ) : null}
      </div>
    </AuthLayout>
  )
}
