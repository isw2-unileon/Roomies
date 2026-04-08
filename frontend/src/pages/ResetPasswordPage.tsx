import { FormEvent, useMemo, useState } from 'react'

import logo from '@/assets/logo.png'

type NoticeKind = 'idle' | 'error' | 'success'

interface ResetPasswordPageProps {
  onNavigateToLogin: () => void
}

function getRecoveryDataFromUrl() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const queryParams = new URLSearchParams(window.location.search)

  const accessToken = hashParams.get('access_token') || queryParams.get('access_token') || ''
  const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token') || ''

  return {
    accessToken: accessToken.trim(),
    refreshToken: refreshToken.trim(),
  }
}

export default function ResetPasswordPage({ onNavigateToLogin }: ResetPasswordPageProps) {
  const recovery = getRecoveryDataFromUrl()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState<{ kind: NoticeKind; message: string }>({
    kind: 'idle',
    message: '',
  })

  const buttonLabel = useMemo(() => {
    if (isSubmitting) {
      return 'Guardando nueva contrasena...'
    }

    return 'Guardar nueva contrasena'
  }, [isSubmitting])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice({ kind: 'idle', message: '' })

    if (!recovery.accessToken) {
      setNotice({
        kind: 'error',
        message: 'El enlace no es valido o ya expiro. Solicita uno nuevo desde inicio de sesion.',
      })
      return
    }

    if (password.length < 6) {
      setNotice({
        kind: 'error',
        message: 'La contrasena debe tener al menos 6 caracteres.',
      })
      return
    }

    if (password !== confirmPassword) {
      setNotice({
        kind: 'error',
        message: 'Las contrasenas no coinciden.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${recovery.accessToken}`,
        },
        body: JSON.stringify({ password }),
      })

      const data = (await response.json()) as { message?: string; error?: string }

      if (!response.ok) {
        setNotice({
          kind: 'error',
          message: data.error || 'No se pudo actualizar la contrasena. Solicita un nuevo enlace.',
        })
        return
      }

      localStorage.removeItem('roomies.access_token')
      localStorage.removeItem('roomies.refresh_token')

      if (recovery.refreshToken) {
        window.history.replaceState({}, '', '/reset-password')
      }

      setNotice({
        kind: 'success',
        message: data.message || 'Contrasena actualizada correctamente. Ya puedes iniciar sesion.',
      })
      setPassword('')
      setConfirmPassword('')
    } catch {
      setNotice({
        kind: 'error',
        message: 'No se pudo actualizar la contrasena. Solicita un nuevo enlace.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--rm-border)] bg-white/85 shadow-2xl shadow-emerald-950/10 backdrop-blur-sm">
        <section className="grid min-h-[560px] md:grid-cols-[1.05fr_0.95fr]">
          <aside className="hidden flex-col justify-between border-r border-[var(--rm-border)] bg-gradient-to-br from-emerald-100/90 via-white to-emerald-50 p-10 md:flex">
            <div>
              <img src={logo} alt="Roomies logo" className="h-14 w-auto" />
              <p className="mt-8 max-w-sm text-base leading-relaxed text-[var(--rm-text-soft)]">
                Establece una nueva contrasena para volver a acceder a tu cuenta de Roomies.
              </p>
            </div>
            <p className="text-sm font-medium text-[var(--rm-text-soft)]">Recuperacion de acceso segura.</p>
          </aside>

          <div className="flex items-center justify-center p-6 sm:p-8 md:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center md:text-left">
                <img src={logo} alt="Roomies" className="mx-auto h-16 w-auto md:mx-0 md:hidden" />
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--rm-text-strong)] sm:text-4xl">
                  Restablecer contrasena
                </h1>
                <p className="mt-3 text-sm text-[var(--rm-text-soft)] sm:text-base">
                  Introduce tu nueva contrasena dos veces para confirmar el cambio.
                </p>
              </div>

              <form className="space-y-5" noValidate onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="new-password" className="mb-1.5 block text-sm font-semibold text-[var(--rm-text-strong)]">
                    Nueva contrasena
                  </label>
                  <input
                    id="new-password"
                    name="new-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Minimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-emerald-900/15 bg-white px-4 py-3 text-[var(--rm-text-strong)] outline-none ring-0 transition placeholder:text-slate-400 focus:border-[var(--rm-primary)] focus:shadow-[0_0_0_4px_rgba(31,122,79,0.15)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-new-password"
                    className="mb-1.5 block text-sm font-semibold text-[var(--rm-text-strong)]"
                  >
                    Confirmar nueva contrasena
                  </label>
                  <input
                    id="confirm-new-password"
                    name="confirm-new-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Repite la nueva contrasena"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-emerald-900/15 bg-white px-4 py-3 text-[var(--rm-text-strong)] outline-none ring-0 transition placeholder:text-slate-400 focus:border-[var(--rm-primary)] focus:shadow-[0_0_0_4px_rgba(31,122,79,0.15)]"
                  />
                </div>

                {notice.kind !== 'idle' && (
                  <p
                    role="status"
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      notice.kind === 'error'
                        ? 'border-rose-200 bg-rose-50 text-rose-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {notice.message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-[var(--rm-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--rm-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {buttonLabel}
                </button>

                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full rounded-xl border border-[var(--rm-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--rm-text-strong)] transition hover:border-emerald-900/30 hover:bg-emerald-50/60"
                >
                  Volver al inicio de sesion
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
