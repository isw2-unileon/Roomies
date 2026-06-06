import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import TenantLayout from '@/components/tenant/TenantLayout'
import TenantFilters, { DEFAULT_FILTER_VALUES, type FilterValues } from '@/components/tenant/tenants_explore/TenantFilters'
import TenantMapFilter, { type MapFilterValues } from '@/components/tenant/tenants_explore/TenantMapFilter'
import TenantPropertyGrid from '@/components/tenant/tenants_explore/TenantPropertyGrid'
import TenantRoommateDiscoveryPanel from '@/components/tenant/tenants_explore/TenantRoommateDiscoveryPanel'
import TenantSearchBar from '@/components/tenant/tenants_explore/TenantSearchBar'
//import { mockTenantProfile } from '@/mocks/tenantData'
import { paths } from '@/routes/paths'
import { listTenantApartments } from '@/services/tenantService'
import type { TenantProperty } from '@/types/tenant'
import styles from '@/styles/TenantDashboard.module.css'

type ExploreMenu = 'apartments' | 'roommates'

export default function TenantExplorePage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    //const profile = mockTenantProfile
    const [properties, setProperties] = useState<TenantProperty[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilters, setActiveFilters] = useState<FilterValues>(DEFAULT_FILTER_VALUES)
    const [mapFilters, setMapFilters] = useState<MapFilterValues | null>(null)
    const [activeMenu, setActiveMenu] = useState<ExploreMenu>('apartments')

    useEffect(() => {
        let ignoreResult = false

        async function loadApartments() {
            setIsLoading(true)
            setError('')

            try {
                const apartments = await listTenantApartments({
                    query: searchQuery,
                    area: activeFilters.area,
                    priceMin: activeFilters.priceMin,
                    priceMax: activeFilters.priceMax,
                    totalRoomsMin: activeFilters.totalRoomsMin,
                    totalRoomsMax: activeFilters.totalRoomsMax,
                    availableRoomsMin: activeFilters.availableRoomsMin,
                    availableRoomsMax: activeFilters.availableRoomsMax,
                    availability: activeFilters.availability,
                    sortBy: activeFilters.sortBy,
                    ...(mapFilters && {
                        lat: mapFilters.lat,
                        lng: mapFilters.lng,
                        radius: mapFilters.radius,
                    }),
                })
                if (!ignoreResult) {
                    setProperties(apartments)
                }
            } catch (loadError) {
                if (!ignoreResult) {
                    setError(loadError instanceof Error ? loadError.message : t('tenantDashboard.loadError'))
                }
            } finally {
                if (!ignoreResult) {
                    setIsLoading(false)
                }
            }
        }

        void loadApartments()

        return () => {
            ignoreResult = true
        }
    }, [activeFilters, searchQuery, mapFilters, t])

    function handlePropertyClick(property: TenantProperty) {
        navigate(paths.tenantExploreDetail.replace(':propertyId', property.id), {
            state: { property },
        })
    }

    function handleMapFilterChange(filters: MapFilterValues | null) {
        setMapFilters(filters)
    }

    function handleResetSearchAndFilters() {
        setSearchQuery('')
        setActiveFilters(DEFAULT_FILTER_VALUES)
        setMapFilters(null)
    }

    const filteredProperties = useMemo(() => properties, [properties])

    return (
         <TenantLayout>
            <div className={styles.content}>
            <section className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        {t('tenantDashboard.header.title')}
                    </h1>
                    <p className={styles.subtitle}>
                        {t('tenantDashboard.header.subtitle')}
                    </p>
                </div>
            </section>
            <div className={styles.exploreTabs} role="tablist" aria-label={t('tenantDashboard.exploreTabs.label')}>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeMenu === 'apartments'}
                    className={`${styles.exploreTab} ${activeMenu === 'apartments' ? styles.exploreTabActive : ''}`}
                    onClick={() => setActiveMenu('apartments')}
                >
                    {t('tenantDashboard.exploreTabs.apartments')}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={activeMenu === 'roommates'}
                    className={`${styles.exploreTab} ${activeMenu === 'roommates' ? styles.exploreTabActive : ''}`}
                    onClick={() => setActiveMenu('roommates')}
                >
                    {t('tenantDashboard.exploreTabs.roommates')}
                </button>
            </div>
            {activeMenu === 'apartments' ? (
                <>
                    <TenantSearchBar
                        onSearch={setSearchQuery}
                        onReset={handleResetSearchAndFilters}
                    />
                    <TenantFilters
                        onFilterChange={setActiveFilters}
                    />
                    <TenantMapFilter
                        onMapFilterChange={handleMapFilterChange}
                        properties={filteredProperties}
                    />
                    <div className={styles.resultsRow}>
                        <p className={styles.resultsText}>
                            {t('tenantDashboard.resultsFound', { count: filteredProperties.length })}
                        </p>
                    </div>
                    {error ? <p role="alert" className={styles.errorText}>{error}</p> : null}
                    {isLoading ? (
                        <p role="status" className={styles.loadingText}>{t('tenantDashboard.loading')}</p>
                    ) : (
                        <TenantPropertyGrid
                            properties={filteredProperties}
                            onPropertyClick={handlePropertyClick}
                        />
                    )}
                </>
            ) : (
                <TenantRoommateDiscoveryPanel />
            )}
            </div>
        </TenantLayout>
    )
}
