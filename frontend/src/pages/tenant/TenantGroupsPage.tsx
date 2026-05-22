import { useMemo, useState } from 'react'
import {
    FunnelIcon,
    MagnifyingGlassIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline'

import TenantLayout from '@/components/tenant/TenantLayout'
import TenantGroupCard from '@/components/tenant/tenant_groups/TenantGroupCard'
import TenantGroupDetail from '@/components/tenant/tenant_groups/TenantGroupDetail'
import TenantGroupFilters from '@/components/tenant/tenant_groups/TenantGroupFilters'
import { mockTenantGroups } from '@/mocks/tenantData'
import styles from '@/styles/TenantGroups.module.css'
import type { TenantGroup } from '@/types/tenant'

export default function TenantGroupsPage() {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [selectedMembers, setSelectedMembers] = useState('4')

    const selectedGroup = mockTenantGroups.find((group) => group.id === selectedGroupId) ?? null

    const filteredGroups = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()

        if (!normalizedSearch) {
            return mockTenantGroups
        }

        return mockTenantGroups.filter((group) => (
            group.title.toLowerCase().includes(normalizedSearch)
            || group.location.toLowerCase().includes(normalizedSearch)
            || group.university.toLowerCase().includes(normalizedSearch)
        ))
    }, [search])

    function handleViewGroup(group: TenantGroup) {
        setSelectedGroupId(group.id)
    }

    return (
        <TenantLayout>
            {selectedGroup ? (
                <TenantGroupDetail
                    group={selectedGroup}
                    onBack={() => setSelectedGroupId(null)}
                />
            ) : (
                <div className={styles.content}>
                    <section className={styles.header}>
                        <div>
                            <h1 className={styles.title}>Grupos</h1>
                            <p className={styles.subtitle}>
                                Descubre grupos de compañeros buscando piso juntos.
                            </p>
                        </div>
                    </section>

                    <div className={styles.pageGrid}>
                        <section className={styles.mainColumn}>
                            <div className={styles.toolbar}>
                                <label className={styles.searchBox}>
                                    <MagnifyingGlassIcon
                                        className={styles.iconSmall}
                                        aria-hidden="true"
                                    />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Buscar grupos por nombre, ubicación o universidad..."
                                        aria-label="Buscar grupos"
                                    />
                                </label>

                                <div className={styles.toolbarActions}>
                                    <button type="button" className={styles.filterButton}>
                                        <FunnelIcon
                                            className={styles.iconSmall}
                                            aria-hidden="true"
                                        />
                                        Filtros
                                    </button>

                                    <button type="button" className={styles.createButton}>
                                        <UserGroupIcon
                                            className={styles.iconSmall}
                                            aria-hidden="true"
                                        />
                                        Crear grupo
                                    </button>
                                </div>
                            </div>

                            <div className={styles.resultsBar}>
                                <span>{filteredGroups.length} grupos encontrados</span>

                                <label className={styles.sortControl}>
                                    Ordenar por:
                                    <select className={styles.sortSelect} defaultValue="recent">
                                        <option value="recent">Más recientes</option>
                                        <option value="compatibility">Mayor compatibilidad</option>
                                        <option value="members">Número de miembros</option>
                                    </select>
                                </label>
                            </div>

                            <div className={styles.groupList}>
                                {filteredGroups.length > 0 ? (
                                    filteredGroups.map((group) => (
                                        <TenantGroupCard
                                            key={group.id}
                                            group={group}
                                            onViewGroup={handleViewGroup}
                                        />
                                    ))
                                ) : (
                                    <div className={styles.empty}>
                                        <div>
                                            <p className={styles.emptyTitle}>
                                                No se han encontrado grupos
                                            </p>
                                            <p className={styles.emptySubtitle}>
                                                Prueba con otra búsqueda o ajusta los filtros laterales.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.pagination} aria-label="Paginación de grupos">
                                <button
                                    type="button"
                                    className={styles.pageButton}
                                    aria-label="Página anterior"
                                >
                                    ‹
                                </button>

                                <button
                                    type="button"
                                    className={`${styles.pageButton} ${styles.pageButtonActive}`}
                                >
                                    1
                                </button>

                                <button type="button" className={styles.pageButton}>
                                    2
                                </button>

                                <button type="button" className={styles.pageButton}>
                                    3
                                </button>

                                <span className={styles.pageDots}>...</span>

                                <button type="button" className={styles.pageButton}>
                                    7
                                </button>

                                <button
                                    type="button"
                                    className={styles.pageButton}
                                    aria-label="Página siguiente"
                                >
                                    ›
                                </button>
                            </div>
                        </section>

                        <TenantGroupFilters
                            selectedMembers={selectedMembers}
                            onSelectedMembersChange={setSelectedMembers}
                        />
                    </div>
                </div>
            )}
        </TenantLayout>
    )
}