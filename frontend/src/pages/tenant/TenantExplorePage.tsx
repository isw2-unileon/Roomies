import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TenantLayout from '@/components/tenant/TenantLayout'
import TenantFilters from '@/components/tenant/tenants_explore/TenantFilters'
import TenantPropertyGrid from '@/components/tenant/tenants_explore/TenantPropertyGrid'
import TenantSearchBar from '@/components/tenant/tenants_explore/TenantSearchBar'
import { mockTenantProfile } from '@/mocks/tenantData'
import { listTenantApartments } from '@/services/tenantService'
import type { TenantProperty } from '@/types/tenant'
import styles from '@/styles/TenantDashboard.module.css'

export default function TenantExplorePage() {
    const { t } = useTranslation()
    const profile = mockTenantProfile
    const [properties, setProperties] = useState<TenantProperty[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let ignoreResult = false

        async function loadApartments() {
            setIsLoading(true)
            setError('')

            try {
                const apartments = await listTenantApartments()
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
    }, [t])

    function handlePropertyClick(property: TenantProperty) {
        console.log('property details:', property.id)
    }

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

                <div className={styles.areaInfo} aria-label={t('tenantDashboard.header.preferredArea')}>
                    <span className={styles.areaLabel}>{t('tenantDashboard.topBar.area')}</span>
                    <span className={styles.areaValue}>{t(profile.preferredAreaKey)}</span>
                </div>
            </section>

            <TenantSearchBar
                onSearch={(query) => console.log('search:', query)}
            />

            <TenantFilters
                onFilterChange={(filters) => console.log('filters:', filters)}
            />

            <div className={styles.resultsRow}>
                <p className={styles.resultsText}>
                    {t('tenantDashboard.resultsFound', { count: properties.length })}
                </p>
            </div>

            {error ? <p role="alert" className={styles.errorText}>{error}</p> : null}

            {isLoading ? (
                <p role="status" className={styles.loadingText}>{t('tenantDashboard.loading')}</p>
            ) : (
                <TenantPropertyGrid
                    properties={properties}
                    onPropertyClick={handlePropertyClick}
                />
            )}
            </div>
        </TenantLayout>
    )
}
