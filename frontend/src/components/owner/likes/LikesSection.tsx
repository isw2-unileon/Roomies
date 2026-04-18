import type { MatchStatus, PropertyLike } from '@/types/owner'
import LikesColumn from './LikeColumn'
interface LikesSectionProps {
    // Lista completa de likes (todos los estados)
    items: PropertyLike[]
    // Funcion para cambiar estado de un like
    onStatusChange: (id: string, status: MatchStatus) => void
}
export default function LikesSection({ items, onStatusChange }: LikesSectionProps) {
    // Separamos en 3 arrays para mostrar "todos" pero ordenados por estado.
    // Esto hace la lectura visual mucho mas clara para el owner.
    const pending = items.filter((x) => x.status === 'pending')
    const approved = items.filter((x) => x.status === 'approved')
    const rejected = items.filter((x) => x.status === 'rejected')
    return (
        <section className="space-y-4 rounded-3xl border border-[var(--rm-border)] bg-white/90 p-5 shadow-xl shadow-emerald-950/10">
            {/* Cabecera de la seccion */}
            <div>
                <h2 className="text-xl font-bold text-[var(--rm-text-strong)]">Likes recibidos</h2>
                <p className="text-sm text-[var(--rm-text-soft)]">
                    Visualiza todos: pendientes, aceptados y rechazados.
                </p>
            </div>
            {/* Layout de 3 columnas en desktop, apilado en movil */}
            <div className="grid gap-4 lg:grid-cols-3">
                <LikesColumn title="Pendientes" items={pending} onStatusChange={onStatusChange} />
                <LikesColumn title="Aceptados" items={approved} onStatusChange={onStatusChange} />
                <LikesColumn title="Rechazados" items={rejected} onStatusChange={onStatusChange} />
            </div>
        </section>
    )
}