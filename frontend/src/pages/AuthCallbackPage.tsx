import { useEffect, useMemo, useState } from 'react'

import logo from '@/assets/logo.png'

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

const DEFAULT_ERROR_MESSAGE = 'No se pudo confirmar tu cuenta. Intenta iniciar sesion manualmente.'

function getAuthDataFromUrl() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const queryParams = new URLSearchParams(window.location.search)

  const accessToken = hashParams.get('access_token') || queryParams.get('access_token') || ''
  const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token') || ''
  const error = hashParams.get('error_description') || hashParams.get('error') || queryParams.get('error') || ''

  return {
    accessToken: accessToken.trim(),
    refreshToken: refreshToken.trim(),
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

      if (!authData.accessToken) {
        if (!cancelled) {
          setNotice({ kind: 'error', message: DEFAULT_ERROR_MESSAGE })
        }
        return
      }

      localStorage.setItem('roomies.access_token', authData.accessToken)
      if (authData.refreshToken) {
        localStorage.setItem('roomies.refresh_token', authData.refreshToken)
      }

      window.history.replaceState({}, '', '/auth/callback')

      try {
        const response = await fetch('/api/profile/status', {
          headers: {
            Authorization: `Bearer ${authData.accessToken}`,
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
    <main className="relative flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--rm-border)] bg-white/85 shadow-2xl shadow-emerald-950/10 backdrop-blur-sm">
        <section className="grid min-h-[560px] md:grid-cols-[1.05fr_0.95fr]">
          <aside className="hidden flex-col justify-between border-r border-[var(--rm-border)] bg-gradient-to-br from-emerald-100/90 via-white to-emerald-50 p-10 md:flex">
            <div>
              <img src={logo} alt="Roomies logo" className="h-14 w-auto" />
              <p className="mt-8 max-w-sm text-base leading-relaxed text-[var(--rm-text-soft)]">
                Estamos validando tu enlace de confirmacion para activar tu cuenta en Roomies.
              </p>
            </div>
            <p className="text-sm font-medium text-[var(--rm-text-soft)]">Confirmacion de cuenta en curso.</p>
          </aside>

          <div className="flex items-center justify-center p-6 sm:p-8 md:p-10">
            <div className="w-full max-w-md text-center md:text-left">
              <img src={logo} alt="Roomies" className="mx-auto h-16 w-auto md:mx-0 md:hidden" />
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--rm-text-strong)] sm:text-4xl">Confirmar cuenta</h1>
              <p className="mt-3 text-sm text-[var(--rm-text-soft)] sm:text-base">{notice.message}</p>

              {notice.kind === 'error' ? (
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[var(--rm-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/50"
                >
                  {buttonLabel}
                </button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
