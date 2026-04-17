import type { MatchStatus, PropertyLike } from '@/types/owner'
interface LikeCardProps {
    // Like individual
    item: PropertyLike
    // Funcion para cambiar estado del like (pending/approved/rejected)
    onStatusChange: (id: string, status: MatchStatus) => void
}
export default function LikeCard({ item, onStatusChange }: LikeCardProps) {
    return (
        <article className="rounded-xl border border-[var(--rm-border)] bg-white p-3">
            {/* Informacion del interesado */}
            <p className="text-sm font-semibold text-[var(--rm-text-strong)]">{item.tenantName}</p>
            <p className="text-xs text-[var(--rm-text-soft)]">{item.tenantEmail}</p>
            {/* Informacion de contexto: inmueble y fecha */}
            <p className="mt-2 text-xs text-[var(--rm-text-soft)]">Inmueble: {item.propertyTitle}</p>
            <p className="text-xs text-[var(--rm-text-soft)]">Fecha: {item.createdAt}</p>
            {/* Acciones directas.
          Aunque este en approved/rejected, dejamos botones para poder "rectificar". */}
            <div className="mt-3 flex gap-2">
                <button
                    type="button"
                    onClick={() => onStatusChange(item.id, 'approved')}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                    Aceptar
                </button>
                <button
                    type="button"
                    onClick={() => onStatusChange(item.id, 'rejected')}
                    className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                >
                    Rechazar
                </button>
            </div>
        </article>
    )
}