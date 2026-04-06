import { FormEvent, useMemo, useState } from 'react'

import logo from '@/assets/logo.png'

type NoticeKind = 'idle' | 'error' | 'success'

const DEFAULT_ERROR_MESSAGE = 'No se pudo iniciar sesion ahora mismo. Intentalo de nuevo.'

interface LoginApiResponse {
  message?: string
  access_token?: string
  refresh_token?: string
  error?: string
}

interface LoginPageProps {
  onNavigateToRegister: () => void
}

export default function LoginPage({ onNavigateToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState<{ kind: NoticeKind; message: string }>({
    kind: 'idle',
    message: '',
  })

  const buttonLabel = useMemo(() => {
    if (isLoading) {
      return 'Signing in...'
    }
    return 'Sign in'
  }, [isLoading])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice({ kind: 'idle', message: '' })

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = (await response.json()) as LoginApiResponse

      if (!response.ok) {
        setNotice({
          kind: 'error',
          message: data.error || DEFAULT_ERROR_MESSAGE,
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
        message: data.message || 'Login correcto. Ya puedes continuar en la app.',
      })
    } catch {
      setNotice({
        kind: 'error',
        message: DEFAULT_ERROR_MESSAGE,
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
                Find your next home with people that match your lifestyle, budget, and vibe.
              </p>
            </div>
            <p className="text-sm font-medium text-[var(--rm-text-soft)]">Simple matching. Better room sharing.</p>
          </aside>

          <div className="flex items-center justify-center p-6 sm:p-8 md:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center md:text-left">
                <img src={logo} alt="Roomies" className="mx-auto h-16 w-auto md:mx-0 md:hidden" />
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--rm-text-strong)] sm:text-4xl">Welcome back</h1>
                <p className="mt-3 text-sm text-[var(--rm-text-soft)] sm:text-base">
                  Sign in with your email and password to access your account.
                </p>
              </div>

              <form className="space-y-5" noValidate onSubmit={handleSubmit}>
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
                    autoComplete="current-password"
                    placeholder="Enter your password"
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
                  onClick={onNavigateToRegister}
                  className="w-full rounded-xl border border-[var(--rm-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--rm-text-strong)] transition hover:border-emerald-900/30 hover:bg-emerald-50/60"
                >
                  Create an account
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
