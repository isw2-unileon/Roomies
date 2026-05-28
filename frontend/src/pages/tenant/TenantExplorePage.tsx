import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import TenantLayout from '@/components/tenant/TenantLayout'
import TenantFilters, { DEFAULT_FILTER_VALUES, type FilterValues } from '@/components/tenant/tenants_explore/TenantFilters'
import TenantPropertyGrid from '@/components/tenant/tenants_explore/TenantPropertyGrid'
import TenantSearchBar from '@/components/tenant/tenants_explore/TenantSearchBar'
import { mockTenantProfile } from '@/mocks/tenantData'
import { paths } from '@/routes/paths'
import { listTenantApartments } from '@/services/tenantService'
import type { TenantProperty } from '@/types/tenant'
import styles from '@/styles/TenantDashboard.module.css'

export default function TenantExplorePage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const profile = mockTenantProfile
    const [properties, setProperties] = useState<TenantProperty[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilters, setActiveFilters] = useState<FilterValues>(DEFAULT_FILTER_VALUES)

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
    }, [activeFilters, searchQuery, t])

    function handlePropertyClick(property: TenantProperty) {
        navigate(paths.tenantExploreDetail.replace(':propertyId', property.id), {
            state: { property },
        })
    }

    function handleResetSearchAndFilters() {
        setSearchQuery('')
        setActiveFilters(DEFAULT_FILTER_VALUES)
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

            <TenantSearchBar
                onSearch={setSearchQuery}
                onReset={handleResetSearchAndFilters}
            />

            <TenantFilters
                onFilterChange={setActiveFilters}
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
            </div>
        </TenantLayout>
    )
}
