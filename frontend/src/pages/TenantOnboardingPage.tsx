import { FormEvent, useMemo, useState } from 'react'

import logo from '@/assets/logo.png'

type NoticeKind = 'idle' | 'error' | 'success'
type Schedule = 'morning' | 'night' | 'flexible'
type NoiseLevel = 'quiet' | 'moderate' | 'loud'
type Cleanliness = 'very_clean' | 'normal' | 'relaxed'

interface TenantOnboardingPageProps {
  onCompleted: () => void
}

interface TenantProfileResponse {
  message?: string
  onboarding_complete?: boolean
  error?: string
}

const DEFAULT_ERROR_MESSAGE = 'No se pudo guardar tu perfil de inquilino. Intentalo de nuevo.'

export default function TenantOnboardingPage({ onCompleted }: TenantOnboardingPageProps) {
  const [budgetMin, setBudgetMin] = useState('400')
  const [budgetMax, setBudgetMax] = useState('900')
  const [preferredArea, setPreferredArea] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [schedule, setSchedule] = useState<Schedule>('flexible')
  const [pets, setPets] = useState(false)
  const [smoker, setSmoker] = useState(false)
  const [noiseLevel, setNoiseLevel] = useState<NoiseLevel>('moderate')
  const [cleanliness, setCleanliness] = useState<Cleanliness>('normal')
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState<{ kind: NoticeKind; message: string }>({ kind: 'idle', message: '' })

  const buttonLabel = useMemo(() => (isLoading ? 'Guardando perfil...' : 'Guardar y continuar'), [isLoading])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice({ kind: 'idle', message: '' })

    const parsedBudgetMin = Number.parseInt(budgetMin, 10)
    const parsedBudgetMax = Number.parseInt(budgetMax, 10)

    if (!Number.isFinite(parsedBudgetMin) || !Number.isFinite(parsedBudgetMax)) {
      setNotice({ kind: 'error', message: 'Los presupuestos deben ser numeros validos.' })
      return
    }

    if (parsedBudgetMin <= 0 || parsedBudgetMax <= 0 || parsedBudgetMin > parsedBudgetMax) {
      setNotice({ kind: 'error', message: 'El rango de presupuesto no es valido.' })
      return
    }

    if (preferredArea.trim().length < 2) {
      setNotice({ kind: 'error', message: 'La zona preferida debe tener al menos 2 caracteres.' })
      return
    }

    if (!moveInDate) {
      setNotice({ kind: 'error', message: 'La fecha de entrada es obligatoria.' })
      return
    }

    const token = localStorage.getItem('roomies.access_token')
    if (!token) {
      setNotice({ kind: 'error', message: 'Tu sesion ha caducado. Inicia sesion otra vez.' })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/tenant-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          budget_min: parsedBudgetMin,
          budget_max: parsedBudgetMax,
          preferred_area: preferredArea.trim(),
          move_in_date: moveInDate,
          schedule,
          pets,
          smoker,
          noise_level: noiseLevel,
          cleanliness,
        }),
      })

      const data = (await response.json()) as TenantProfileResponse
      if (!response.ok) {
        setNotice({ kind: 'error', message: data.error || DEFAULT_ERROR_MESSAGE })
        return
      }

      setNotice({ kind: 'success', message: data.message || 'Perfil guardado correctamente.' })
      onCompleted()
    } catch {
      setNotice({ kind: 'error', message: DEFAULT_ERROR_MESSAGE })
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
                Buen comienzo. Completa tu perfil de inquilino para que Roomies recomiende mejores viviendas y mejores
                coincidencias.
              </p>
            </div>
            <p className="text-sm font-medium text-[var(--rm-text-soft)]">Onboarding de inquilino: ultimo paso.</p>
          </aside>

          <div className="flex items-center justify-center p-6 sm:p-8 md:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center md:text-left">
                <img src={logo} alt="Roomies" className="mx-auto h-16 w-auto md:mx-0 md:hidden" />
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--rm-text-strong)] sm:text-4xl">
                  Tenant profile
                </h1>
                <p className="mt-3 text-sm text-[var(--rm-text-soft)] sm:text-base">
                  Cuentanos tu presupuesto y tus preferencias de convivencia.
                </p>
              </div>

              <form className="space-y-4" noValidate onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="budget-min" className="mb-1.5 block text-sm font-semibold text-[var(--rm-text-strong)]">
                      Presupuesto minimo
                    </label>
                    <input
                      id="budget-min"
                      type="number"
                      min={1}
                      value={budgetMin}
                      onChange={(event) => setBudgetMin(event.target.value)}
                      required
                      className="w-full rounded-xl border border-emerald-900/15 bg-white px-4 py-3 text-[var(--rm-text-strong)] outline-none transition focus:border-[var(--rm-primary)] focus:shadow-[0_0_0_4px_rgba(31,122,79,0.15)]"
                    />
                  </div>
                  <div>
                    <label htmlFor="budget-max" className="mb-1.5 block text-sm font-semibold text-[var(--rm-text-strong)]">
                      Presupuesto maximo
                    </label>
                    <input
                      id="budget-max"
                      type="number"
                      min={1}
                      value={budgetMax}
                      onChange={(event) => setBudgetMax(event.target.value)}
                      required
                      className="w-full rounded-xl border border-emerald-900/15 bg-white px-4 py-3 text-[var(--rm-text-strong)] outline-none transition focus:border-[var(--rm-primary)] focus:shadow-[0_0_0_4px_rgba(31,122,79,0.15)]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="preferred-area" className="mb-1.5 block text-sm font-semibold text-[var(--rm-text-strong)]">
                    Zona preferida
                  </label>
                  <input
                    id="preferred-area"
                    type="text"
                    value={preferredArea}
                    onChange={(event) => setPreferredArea(event.target.value)}
                    placeholder="Centro, zona universitaria..."
                    required
                    className="w-full rounded-xl border border-emerald-900/15 bg-white px-4 py-3 text-[var(--rm-text-strong)] outline-none transition placeholder:text-slate-400 focus:border-[var(--rm-primary)] focus:shadow-[0_0_0_4px_rgba(31,122,79,0.15)]"
                  />
                </div>

                <div>
                  <label htmlFor="move-in-date" className="mb-1.5 block text-sm font-semibold text-[var(--rm-text-strong)]">
                    Fecha de entrada
                  </label>
                  <input
                    id="move-in-date"
                    type="date"
                    value={moveInDate}
                    onChange={(event) => setMoveInDate(event.target.value)}
                    required
                    className="w-full rounded-xl border border-emerald-900/15 bg-white px-4 py-3 text-[var(--rm-text-strong)] outline-none transition focus:border-[var(--rm-primary)] focus:shadow-[0_0_0_4px_rgba(31,122,79,0.15)]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="schedule" className="mb-1.5 block text-sm font-semibold text-[var(--rm-text-strong)]">
                      Horario
                    </label>
                    <select
                      id="schedule"
                      value={schedule}
                      onChange={(event) => setSchedule(event.target.value as Schedule)}
                      className="w-full rounded-xl border border-emerald-900/15 bg-white px-4 py-3 text-[var(--rm-text-strong)] outline-none transition focus:border-[var(--rm-primary)] focus:shadow-[0_0_0_4px_rgba(31,122,79,0.15)]"
                    >
                      <option value="morning">Manana</option>
                      <option value="night">Noche</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="noise-level" className="mb-1.5 block text-sm font-semibold text-[var(--rm-text-strong)]">
                      Nivel de ruido
                    </label>
                    <select
                      id="noise-level"
                      value={noiseLevel}
                      onChange={(event) => setNoiseLevel(event.target.value as NoiseLevel)}
                      className="w-full rounded-xl border border-emerald-900/15 bg-white px-4 py-3 text-[var(--rm-text-strong)] outline-none transition focus:border-[var(--rm-primary)] focus:shadow-[0_0_0_4px_rgba(31,122,79,0.15)]"
                    >
                      <option value="quiet">Bajo</option>
                      <option value="moderate">Moderado</option>
                      <option value="loud">Alto</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="cleanliness" className="mb-1.5 block text-sm font-semibold text-[var(--rm-text-strong)]">
                    Limpieza
                  </label>
                  <select
                    id="cleanliness"
                    value={cleanliness}
                    onChange={(event) => setCleanliness(event.target.value as Cleanliness)}
                    className="w-full rounded-xl border border-emerald-900/15 bg-white px-4 py-3 text-[var(--rm-text-strong)] outline-none transition focus:border-[var(--rm-primary)] focus:shadow-[0_0_0_4px_rgba(31,122,79,0.15)]"
                  >
                    <option value="very_clean">Muy limpia</option>
                    <option value="normal">Normal</option>
                    <option value="relaxed">Relajada</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-xl border border-emerald-900/15 bg-white px-4 py-3 text-sm text-[var(--rm-text-strong)]">
                    <input
                      type="checkbox"
                      checked={pets}
                      onChange={(event) => setPets(event.target.checked)}
                      className="h-4 w-4 accent-[var(--rm-primary)]"
                    />
                    Acepta mascotas
                  </label>

                  <label className="flex items-center gap-3 rounded-xl border border-emerald-900/15 bg-white px-4 py-3 text-sm text-[var(--rm-text-strong)]">
                    <input
                      type="checkbox"
                      checked={smoker}
                      onChange={(event) => setSmoker(event.target.checked)}
                      className="h-4 w-4 accent-[var(--rm-primary)]"
                    />
                    Fumador
                  </label>
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
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
