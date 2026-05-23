import { useMemo, useState } from 'react'

import TenantApplicationCard from '@/components/tenant/tenant_applications/TenantApplicationCard'
import TenantApplicationTabs from '@/components/tenant/tenant_applications/TenantApplicationTabs'
import TenantApplicationsSidebar from '@/components/tenant/tenant_applications/TenantApplicationsSidebar'
import TenantLayout from '@/components/tenant/TenantLayout'
import { mockTenantApplications } from '@/mocks/tenantData'
import styles from '@/styles/TenantApplications.module.css'
import type { ApplicationFilter } from '@/types/tenant'

type ApplicationSort = 'recent' | 'compatibility'

const filters: { id: ApplicationFilter; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'approved', label: 'Aceptadas' },
    { id: 'rejected', label: 'Rechazadas' },
    { id: 'cancelled', label: 'Canceladas' },
]

export default function TenantApplicationsPage() {
    const [activeFilter, setActiveFilter] = useState<ApplicationFilter>('all')
    const [sort, setSort] = useState<ApplicationSort>('recent')

    const applicationCounts = useMemo(() => {
        return filters.reduce<Record<ApplicationFilter, number>>((counts, filter) => {
            counts[filter.id] = filter.id === 'all'
                ? mockTenantApplications.length
                : mockTenantApplications.filter((application) => application.status === filter.id).length

            return counts
        }, {
            all: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            cancelled: 0,
        })
    }, [])

    const filteredApplications = useMemo(() => {
        const applications = activeFilter === 'all'
            ? mockTenantApplications
            : mockTenantApplications.filter((application) => application.status === activeFilter)

        if (sort === 'compatibility') {
            return [...applications].sort((a, b) => b.compatibility - a.compatibility)
        }

        return [...applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }, [activeFilter, sort])

    function getApplicationCount(filter: ApplicationFilter) {
        return applicationCounts[filter]
    }

    function handleSortChange(value: string) {
        setSort(value === 'compatibility' ? 'compatibility' : 'recent')
    }

    return (
        <TenantLayout>
            <div className={styles.content}>
                <section className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Mis solicitudes</h1>
                        <p className={styles.subtitle}>
                            Consulta el estado de tus solicitudes y confirma las plazas aceptadas.
                        </p>
                    </div>

                    <label className={styles.sortControl}>
                        Ordenar por:
                        <select
                            className={styles.sortSelect}
                            value={sort}
                            onChange={(event) => handleSortChange(event.target.value)}
                        >
                            <option value="recent">Más recientes</option>
                            <option value="compatibility">Mayor compatibilidad</option>
                        </select>
                    </label>
                </section>

                <TenantApplicationTabs
                    filters={filters}
                    activeFilter={activeFilter}
                    getCount={getApplicationCount}
                    onFilterChange={setActiveFilter}
                />

                <div className={styles.layout}>
                    <section className={styles.list} aria-label="Listado de solicitudes">
                        {filteredApplications.length > 0 ? (
                            filteredApplications.map((application) => (
                                <TenantApplicationCard
                                    key={application.id}
                                    application={application}
                                />
                            ))
                        ) : (
                            <div className={styles.empty}>
                                <div>
                                    <p className={styles.emptyTitle}>No hay solicitudes en este estado</p>
                                    <p className={styles.emptySubtitle}>
                                        Cuando tengas nuevas solicitudes aparecerán aquí con su estado actualizado.
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>

                    <TenantApplicationsSidebar
                        filters={filters}
                        getCount={getApplicationCount}
                    />
                </div>
            </div>
        </TenantLayout>
    )
}