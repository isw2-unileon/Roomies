import { useTranslation } from 'react-i18next'
import TenantLayout from '@/components/tenant/TenantLayout'
import TenantFilters from '@/components/tenant/tenants_explore/TenantFilters'
import TenantPropertyGrid from '@/components/tenant/tenants_explore/TenantPropertyGrid'
import TenantSearchBar from '@/components/tenant/tenants_explore/TenantSearchBar'
import { mockTenantProfile, mockTenantProperties } from '@/mocks/tenantData'
import type { TenantProperty } from '@/types/tenant'
import styles from '@/styles/TenantDashboard.module.css'

export default function TenantExplorePage() {
    const { t } = useTranslation()
    const profile = mockTenantProfile
    const properties = mockTenantProperties

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

            <TenantPropertyGrid
                properties={properties}
                onPropertyClick={handlePropertyClick}
            />
            </div>
        </TenantLayout>
    )
}
