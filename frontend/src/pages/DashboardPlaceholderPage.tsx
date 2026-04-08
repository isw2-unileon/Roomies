import logo from '@/assets/logo.png'

export default function DashboardPlaceholderPage() {
  const tenantProfile = {
    name: 'Aitor Fernandes',
    email: 'aitor.roomies@mail.com',
    age: 24,
    preferredArea: 'Eras de Renueva',
    budgetRange: '350€ - 500€',
    compatibilityAverage: 78,
    profileCompletion: 82,
  }

  const activeMatches = [
    { id: 'm1', name: 'Lucia Santos', compatibility: 91, status: 'Match mutuo', area: 'Centro' },
    { id: 'm2', name: 'Marcos Vela', compatibility: 87, status: 'Esperando chat', area: 'La Chantria' },
  ]

  const suggestedMatches = [
    {
      id: 's1',
      name: 'Sara Martin',
      age: 25,
      preferredArea: 'Centro',
      budget: '420€',
      compatibility: 93,
      traits: ['Horario: manana', 'Limpieza: alta', 'Ruido: bajo', 'Mascotas: si'],
    },
    {
      id: 's2',
      name: 'Adrian Pardo',
      age: 27,
      preferredArea: 'Eras de Renueva',
      budget: '390€',
      compatibility: 86,
      traits: ['Horario: flexible', 'Limpieza: media', 'Ruido: moderado', 'Mascotas: no'],
    },
    {
      id: 's3',
      name: 'Nerea Alonso',
      age: 23,
      preferredArea: 'La Chantria',
      budget: '450€',
      compatibility: 82,
      traits: ['Horario: noche', 'Limpieza: alta', 'Ruido: bajo', 'Mascotas: si'],
    },
    {
      id: 's4',
      name: 'Javier Cea',
      age: 29,
      preferredArea: 'Campus Vegazana',
      budget: '500€',
      compatibility: 79,
      traits: ['Horario: manana', 'Limpieza: media', 'Ruido: moderado', 'Mascotas: no'],
    },
  ]

  return (
    <main className="relative min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[290px_1fr] lg:gap-6">
        <aside className="rounded-3xl border border-[var(--rm-border)] bg-white/90 p-6 shadow-xl shadow-emerald-950/10 backdrop-blur-sm lg:sticky lg:top-8 lg:h-fit">
          <img src={logo} alt="Roomies" className="h-12 w-auto" />
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--rm-text-soft)]">Resumen personal</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--rm-text-strong)]">Hola, {tenantProfile.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-[var(--rm-text-soft)]">{tenantProfile.email}</p>

          <div className="mt-6 rounded-2xl border border-emerald-900/15 bg-emerald-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Compatibilidad media</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-900">{tenantProfile.compatibilityAverage}%</p>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-700 transition-all duration-700"
                style={{ width: `${tenantProfile.compatibilityAverage}%` }}
              />
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-900/15 bg-white p-4">
            <p className="text-sm font-semibold text-[var(--rm-text-strong)]">Perfil {tenantProfile.profileCompletion}% completo</p>
            <p className="mt-1 text-xs text-[var(--rm-text-soft)]">
              Cuanto mas preciso sea tu perfil, mejores recomendaciones y matches mutuos obtendras.
            </p>
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-[var(--rm-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--rm-primary-strong)]"
            >
              Mejorar mi perfil
            </button>
          </div>

          <nav className="mt-6 grid gap-2 text-sm">
            <a href="#matches-activos" className="rounded-xl border border-[var(--rm-border)] px-3 py-2 font-semibold text-[var(--rm-text-strong)]">
              Matches activos
            </a>
            <a href="#feed-matches" className="rounded-xl border border-[var(--rm-border)] px-3 py-2 font-semibold text-[var(--rm-text-strong)]">
              Feed de matches
            </a>
            <a href="#resumen" className="rounded-xl border border-[var(--rm-border)] px-3 py-2 font-semibold text-[var(--rm-text-strong)]">
              Resumen y progreso
            </a>
          </nav>
        </aside>

        <section className="space-y-4 sm:space-y-6">
          <div
            id="matches-activos"
            className="rounded-3xl border border-[var(--rm-border)] bg-white/90 p-5 shadow-xl shadow-emerald-950/10 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--rm-text-soft)]">Prioridad</p>
                <h2 className="text-xl font-bold text-[var(--rm-text-strong)]">Tus matches activos</h2>
              </div>
              <span className="rounded-full border border-emerald-700/30 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                {activeMatches.length} activos
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {activeMatches.map((match) => (
                <article key={match.id} className="rounded-2xl border border-emerald-900/15 bg-emerald-50/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-[var(--rm-text-strong)]">{match.name}</h3>
                      <p className="text-xs text-[var(--rm-text-soft)]">{match.area}</p>
                    </div>
                    <span className="rounded-full bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white">
                      {match.compatibility}%
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-emerald-800">{match.status}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="flex-1 rounded-xl bg-[var(--rm-primary)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--rm-primary-strong)]"
                    >
                      Ir al chat
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-xl border border-[var(--rm-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--rm-text-strong)] transition hover:bg-emerald-50"
                    >
                      Ver perfil
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div
            id="feed-matches"
            className="rounded-3xl border border-[var(--rm-border)] bg-white/90 p-5 shadow-xl shadow-emerald-950/10 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--rm-text-soft)]">Explorar</p>
                <h2 className="text-xl font-bold text-[var(--rm-text-strong)]">Feed de matches sugeridos</h2>
              </div>
              <p className="text-xs text-[var(--rm-text-soft)]">Actua rapido: Pasar o Me interesa</p>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {suggestedMatches.map((candidate, index) => (
                <article
                  key={candidate.id}
                  className="rounded-2xl border border-[var(--rm-border)] bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ animation: `fadeInUp 350ms ease ${index * 70}ms both` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-base font-bold text-emerald-800">
                        {candidate.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[var(--rm-text-strong)]">{candidate.name}</h3>
                        <p className="text-xs text-[var(--rm-text-soft)]">
                          {candidate.age} anos · {candidate.preferredArea}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold text-white">{candidate.compatibility}%</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {candidate.traits.slice(0, 4).map((trait) => (
                      <span key={trait} className="rounded-full border border-emerald-900/15 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-900">
                        {trait}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-emerald-50/65 p-2 text-center text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[var(--rm-text-soft)]">Presupuesto</p>
                      <p className="font-semibold text-[var(--rm-text-strong)]">{candidate.budget}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[var(--rm-text-soft)]">Tu zona</p>
                      <p className="font-semibold text-[var(--rm-text-strong)]">{tenantProfile.preferredArea}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-[var(--rm-text-soft)]">Rango</p>
                      <p className="font-semibold text-[var(--rm-text-strong)]">{tenantProfile.budgetRange}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Pasar
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-[var(--rm-primary)] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--rm-primary-strong)]"
                    >
                      Me interesa
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div id="resumen" className="rounded-3xl border border-[var(--rm-border)] bg-white/90 p-5 shadow-xl shadow-emerald-950/10">
            <h2 className="text-xl font-bold text-[var(--rm-text-strong)]">Estado rapido de tu cuenta</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--rm-border)] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--rm-text-soft)]">Sugerencias hoy</p>
                <p className="mt-1 text-2xl font-bold text-[var(--rm-text-strong)]">{suggestedMatches.length}</p>
              </div>
              <div className="rounded-2xl border border-[var(--rm-border)] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--rm-text-soft)]">Matches mutuos</p>
                <p className="mt-1 text-2xl font-bold text-[var(--rm-text-strong)]">{activeMatches.length}</p>
              </div>
              <div className="rounded-2xl border border-[var(--rm-border)] bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--rm-text-soft)]">Compatibilidad media</p>
                <p className="mt-1 text-2xl font-bold text-[var(--rm-text-strong)]">{tenantProfile.compatibilityAverage}%</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </main>
  )
}
