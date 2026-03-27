import { FormEvent, useMemo, useState } from 'react'

import logo from '@/assets/logo.png'

type NoticeKind = 'idle' | 'error' | 'success'
type UserRole = 'tenant' | 'owner'

interface RegisterApiResponse {
  message?: string
  access_token?: string
  refresh_token?: string
  error?: string
}

interface RegisterPageProps {
  onNavigateToLogin: () => void
}

export default function RegisterPage({ onNavigateToLogin }: RegisterPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('tenant')
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState<{ kind: NoticeKind; message: string }>({
    kind: 'idle',
    message: '',
  })

  const buttonLabel = useMemo(() => {
    if (isLoading) {
      return 'Creating account...'
    }

    return 'Create account'
  }, [isLoading])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice({ kind: 'idle', message: '' })

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

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role }),
      })

      const data = (await response.json()) as RegisterApiResponse

      if (!response.ok) {
        setNotice({
          kind: 'error',
          message: data.error || 'No se pudo crear tu cuenta. Intentalo de nuevo.',
        })
        return
      }

      if (data.access_token) {
        localStorage.setItem('roomies.access_token', data.access_token)
      }

      if (data.refresh_token) {
        localStorage.setItem('roomies.refresh_token', data.refresh_token)
      }

      setNotice({
        kind: 'success',
        message: data.message || 'Cuenta creada correctamente. Ya puedes iniciar sesion.',
      })
    } catch {
      setNotice({
        kind: 'error',
        message: 'No se pudo crear tu cuenta. Intentalo de nuevo.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--rm-border)] bg-white/85 shadow-2xl shadow-emerald-950/10 backdrop-blur-sm">
        <section className="grid min-h-[620px] md:grid-cols-[1.05fr_0.95fr]">
          <aside className="hidden flex-col justify-between border-r border-[var(--rm-border)] bg-gradient-to-br from-emerald-100/90 via-white to-emerald-50 p-10 md:flex">
            <div>
              <img src={logo} alt="Roomies logo" className="h-14 w-auto" />
              <p className="mt-8 max-w-sm text-base leading-relaxed text-[var(--rm-text-soft)]">
                Start your Roomies profile and connect with people that fit your lifestyle and budget.
              </p>
            </div>
            <p className="text-sm font-medium text-[var(--rm-text-soft)]">Create your account. Find your next room.</p>
          </aside>

          <div className="flex items-center justify-center p-6 sm:p-8 md:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center md:text-left">
                <img src={logo} alt="Roomies" className="mx-auto h-16 w-auto md:mx-0 md:hidden" />
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--rm-text-strong)] sm:text-4xl">Create account</h1>
                <p className="mt-3 text-sm text-[var(--rm-text-soft)] sm:text-base">
                  Complete your details to start using Roomies.
                </p>
              </div>

              <form className="space-y-5" noValidate onSubmit={handleSubmit}>
                <div>
                  <p className="mb-2 block text-sm font-semibold text-[var(--rm-text-strong)]">Tipo de usuario</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-900/15 bg-white px-4 py-3 transition hover:border-[var(--rm-primary)]">
                      <input
                        type="radio"
                        name="role"
                        value="tenant"
                        checked={role === 'tenant'}
                        onChange={() => setRole('tenant')}
                        className="mt-1 h-4 w-4 accent-[var(--rm-primary)]"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-[var(--rm-text-strong)]">Tenant</span>
                        <span className="block text-xs text-[var(--rm-text-soft)]">Inquilino que busca vivienda</span>
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-900/15 bg-white px-4 py-3 transition hover:border-[var(--rm-primary)]">
                      <input
                        type="radio"
                        name="role"
                        value="owner"
                        checked={role === 'owner'}
                        onChange={() => setRole('owner')}
                        className="mt-1 h-4 w-4 accent-[var(--rm-primary)]"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-[var(--rm-text-strong)]">Owner</span>
                        <span className="block text-xs text-[var(--rm-text-soft)]">Propietario de vivienda</span>
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[var(--rm-text-strong)]">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-emerald-900/15 bg-white px-4 py-3 text-[var(--rm-text-strong)] outline-none ring-0 transition placeholder:text-slate-400 focus:border-[var(--rm-primary)] focus:shadow-[0_0_0_4px_rgba(31,122,79,0.15)]"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[var(--rm-text-strong)]">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-emerald-900/15 bg-white px-4 py-3 text-[var(--rm-text-strong)] outline-none ring-0 transition placeholder:text-slate-400 focus:border-[var(--rm-primary)] focus:shadow-[0_0_0_4px_rgba(31,122,79,0.15)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-1.5 block text-sm font-semibold text-[var(--rm-text-strong)]"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    placeholder="Repeat your password"
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
                  disabled={isLoading}
                  className="w-full rounded-xl bg-[var(--rm-primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--rm-primary-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {buttonLabel}
                </button>

                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full rounded-xl border border-[var(--rm-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--rm-text-strong)] transition hover:border-emerald-900/30 hover:bg-emerald-50/60"
                >
                  Back to sign in
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
