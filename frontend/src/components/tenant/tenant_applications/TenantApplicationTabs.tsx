import styles from '@/styles/TenantApplications.module.css'
import type { ApplicationFilter } from '@/types/tenant'

interface TenantApplicationTabsProps {
    filters: { id: ApplicationFilter; label: string }[]
    activeFilter: ApplicationFilter
    getCount: (filter: ApplicationFilter) => number
    onFilterChange: (filter: ApplicationFilter) => void
}

export default function TenantApplicationTabs({
    filters,
    activeFilter,
    getCount,
    onFilterChange,
}: TenantApplicationTabsProps) {
    return (
        <nav className={styles.tabs} aria-label="Filtros de solicitudes">
            {filters.map((filter) => (
                <button
                    key={filter.id}
                    type="button"
                    className={`${styles.tab} ${activeFilter === filter.id ? styles.tabActive : ''}`}
                    aria-pressed={activeFilter === filter.id}
                    onClick={() => onFilterChange(filter.id)}
                >
                    {filter.label} ({getCount(filter.id)})
                </button>
            ))}
        </nav>
    )
}