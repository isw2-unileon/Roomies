import type { OwnerProperty } from '@/types/owner'
import NewPropertyForm from './NewPropertyForm'
import PropertyCard from './PropertyCard'
interface PropertiesSectionProps {
    // Lista de inmuebles que viene del padre
    items: OwnerProperty[]
    // Handler para crear inmueble (el padre actualiza estado)
    onCreate: (input: Omit<OwnerProperty, 'id' | 'createdAt'>) => void
}
export default function PropertiesSection({ items, onCreate }: PropertiesSectionProps) {
    return (
        <section className="space-y-4 rounded-3xl border border-[var(--rm-border)] bg-white/90 p-5 shadow-xl shadow-emerald-950/10">
            {/* Titulo de bloque */}
            <div>
                <h2 className="text-xl font-bold text-[var(--rm-text-strong)]">Mis inmuebles</h2>
                <p className="text-sm text-[var(--rm-text-soft)]">Crea y visualiza tus anuncios desde aqui.</p>
            </div>
            {/* Formulario de alta */}
            <NewPropertyForm onCreate={onCreate} />
            {/* Grid de tarjetas */}
            <div className="grid gap-3 md:grid-cols-2">
                {items.map((item) => (
                    <PropertyCard key={item.id} item={item} />
                ))}
            </div>
            {/* Estado vacio opcional (si no hay inmuebles) */}
            {items.length === 0 && (
                <p className="rounded-xl border border-dashed border-[var(--rm-border)] p-4 text-sm text-[var(--rm-text-soft)]">
                    Aun no tienes inmuebles. Crea el primero con el formulario de arriba.
                </p>
            )}
        </section>
    )
}