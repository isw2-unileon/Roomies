import logo from '@/assets/logo.png'

export default function DashboardPlaceholderPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-[var(--rm-border)] bg-white/85 shadow-2xl shadow-emerald-950/10 backdrop-blur-sm">
        <section className="grid min-h-[420px] items-center gap-8 p-8 sm:p-12">
          <div className="text-center">
            <img src={logo} alt="Roomies" className="mx-auto h-14 w-auto" />
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-[var(--rm-text-strong)] sm:text-4xl">Ya estas dentro</h1>
            <p className="mt-4 text-sm leading-relaxed text-[var(--rm-text-soft)] sm:text-base">
              La autenticacion y el onboarding han funcionado correctamente. Esta pagina temporal se sustituira pronto por
              el dashboard.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
