//Pestañas disponibles
type Tab = 'properties' | 'likes'

interface OwnerTabsProps {
    activeTab: Tab
    onChange: (tab: Tab) => void
}

export default function OwnerTabs({ activeTab, onChange }: OwnerTabsProps) {
    return (
        // Contenedor visual de las tabs
        <div className="flex gap-2 rounded-2xl border border-[var(--tenant-border-light)] bg-white/90 p-2 shadow-sm shadow-slate-950/5">
            {/* Boton: pestaña de Inmuebles */}
            <button
                type="button"
                onClick={() => onChange('properties')} // avisamos al padre del cambio
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'properties'
                        ? 'bg-[var(--rm-primary)] text-white' // estilo activo
                        : 'text-[var(--rm-text-strong)] hover:bg-[var(--tenant-bg-soft)]' // estilo inactivo
                    }`}
            >
                Inmuebles
            </button>
            {/* Boton: pestaña de Likes */}
            <button
                type="button"
                onClick={() => onChange('likes')}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'likes'
                        ? 'bg-[var(--rm-primary)] text-white'
                        : 'text-[var(--rm-text-strong)] hover:bg-[var(--tenant-bg-soft)]'
                    }`}
            >
                Likes
            </button>
        </div>
    )
}
