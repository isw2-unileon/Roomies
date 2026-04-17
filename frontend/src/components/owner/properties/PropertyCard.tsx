import type { OwnerProperty } from '@/types/owner'
interface PropertyCardProps {
    // Recibe un inmueble concreto para mostrarlo en tarjeta
    item: OwnerProperty
}
// Mapa de texto visible para el estado (en vez de mostrar "open", etc.)
const statusLabel: Record<OwnerProperty['status'], string> = {
    open: 'Abierto',
    closed: 'Cerrado',
    full: 'Completo',
}

export default function PropertyCard({ item }: PropertyCardProps) {
    return (
        <article className="rounded-2xl border border-[var(--rm-border)] bg-white p-4">
            {/* Cabecera: titulo + etiqueta de estado */}
            <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold text-[var(--rm-text-strong)]">{item.title}</h3>
                <span className="rounded-full border border-emerald-900/20 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    {statusLabel[item.status]}
                </span>
            </div>
            {/* Datos secundarios */}
            <p className="mt-2 text-sm text-[var(--rm-text-soft)]">
                {item.area} · {item.address}
            </p>
            {/* Datos clave */}
            <p className="mt-2 text-sm text-[var(--rm-text-strong)]">
                {item.availableRooms} hab. libres · {item.rent}€/mes
            </p>
            {/* Fecha de creacion (mock) */}
            <p className="mt-1 text-xs text-[var(--rm-text-soft)]">Publicado: {item.createdAt}</p>
        </article>
    )
}