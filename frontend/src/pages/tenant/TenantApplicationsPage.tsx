import { useEffect, useMemo, useState } from 'react'

import TenantApplicationCard from '@/components/tenant/tenant_applications/TenantApplicationCard'
import TenantApplicationTabs from '@/components/tenant/tenant_applications/TenantApplicationTabs'
import TenantApplicationsSidebar from '@/components/tenant/tenant_applications/TenantApplicationsSidebar'
import TenantLayout from '@/components/tenant/TenantLayout'
import { cancelTenantApplication, listTenantApplications } from '@/services/tenantService'
import styles from '@/styles/TenantApplications.module.css'
import type { ApplicationFilter, TenantApplication } from '@/types/tenant'

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
    const [tenantApplications, setTenantApplications] = useState<TenantApplication[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [cancellingApplicationId, setCancellingApplicationId] = useState('')

    useEffect(() => {
        let ignoreResult = false

        async function loadApplications() {
            setIsLoading(true)
            setError('')
            try {
                const response = await listTenantApplications()
                if (!ignoreResult) {
                    setTenantApplications(response)
                }
            } catch (loadError) {
                if (!ignoreResult) {
                    setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar tus solicitudes.')
                }
            } finally {
                if (!ignoreResult) {
                    setIsLoading(false)
                }
            }
        }

        void loadApplications()

        return () => {
            ignoreResult = true
        }
    }, [])

    const applicationCounts = useMemo(() => {
        return filters.reduce<Record<ApplicationFilter, number>>((counts, filter) => {
            counts[filter.id] = filter.id === 'all'
                ? tenantApplications.length
                : tenantApplications.filter((application) => application.status === filter.id).length

            return counts
        }, {
            all: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            cancelled: 0,
        })
    }, [tenantApplications])

    const filteredApplications = useMemo(() => {
        const applications = activeFilter === 'all'
            ? tenantApplications
            : tenantApplications.filter((application) => application.status === activeFilter)

        if (sort === 'compatibility') {
            return [...applications].sort((a, b) => b.compatibility - a.compatibility)
        }

        return [...applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }, [activeFilter, tenantApplications, sort])

    function getApplicationCount(filter: ApplicationFilter) {
        return applicationCounts[filter]
    }

    function handleSortChange(value: string) {
        setSort(value === 'compatibility' ? 'compatibility' : 'recent')
    }

    async function handleCancelApplication(applicationId: string) {
        setCancellingApplicationId(applicationId)
        setError('')
        try {
            await cancelTenantApplication(applicationId)
            const updatedApplications = await listTenantApplications()
            setTenantApplications(updatedApplications)
        } catch (cancelError) {
            setError(cancelError instanceof Error ? cancelError.message : 'No se pudo anular la solicitud.')
        } finally {
            setCancellingApplicationId('')
        }
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
                        {error ? (
                            <div className={styles.empty}>
                                <div>
                                    <p className={styles.emptyTitle}>No se pudieron cargar tus solicitudes</p>
                                    <p className={styles.emptySubtitle}>{error}</p>
                                </div>
                            </div>
                        ) : isLoading ? (
                            <div className={styles.empty}>
                                <div>
                                    <p className={styles.emptyTitle}>Cargando solicitudes...</p>
                                </div>
                            </div>
                        ) : filteredApplications.length > 0 ? (
                            filteredApplications.map((application) => (
                                <TenantApplicationCard
                                    key={application.id}
                                    application={application}
                                    onCancel={handleCancelApplication}
                                    isCancelling={cancellingApplicationId === application.id}
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
