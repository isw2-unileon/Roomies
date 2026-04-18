import type { MatchStatus, PropertyLike } from '@/types/owner'
import LikeCard from './LikeCard'
interface LikesColumnProps {
    // Titulo de la columna (Pendientes/Aceptados/Rechazados)
    title: string
    // Elementos que se pintan en esta columna
    items: PropertyLike[]
    // Handler para actualizar estado de un like
    onStatusChange: (id: string, status: MatchStatus) => void
}
export default function LikesColumn({ title, items, onStatusChange }: LikesColumnProps) {
    return (
        <div className="rounded-2xl border border-[var(--rm-border)] bg-white p-4">
            {/* Cabecera de columna con contador */}
            <h3 className="text-sm font-bold text-[var(--rm-text-strong)]">
                {title} ({items.length})
            </h3>
            <div className="mt-3 space-y-2">
                {/* Pintamos cada like con su card */}
                {items.map((item) => (
                    <LikeCard key={item.id} item={item} onStatusChange={onStatusChange} />
                ))}
                {/* Mensaje vacio si no hay likes en esta categoria */}
                {items.length === 0 && (
                    <p className="rounded-xl border border-dashed border-[var(--rm-border)] p-3 text-xs text-[var(--rm-text-soft)]">
                        Sin resultados
                    </p>
                )}
            </div>
        </div>
    )
}