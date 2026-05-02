import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import TenantSidebar from '@/components/tenant/TenantSidebar'
import TenantTopBar from '@/components/tenant/TenantTopBar'
import TenantSearchBar from '@/components/tenant/TenantSearchBar'
import TenantFilters from '@/components/tenant/TenantFilters'
import TenantPropertyGrid from '@/components/tenant/TenantPropertyGrid'
import { mockTenantProfile, mockTenantProperties } from '@/mocks/tenantData'
import type { TenantProperty } from '@/types/tenant'
import styles from '@/styles/TenantDashboard.module.css'

type SidebarTab = 'explore' | 'applications' | 'groups' | 'messages' | 'notifications' | 'profile'

export default function TenantDashboardPage() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<SidebarTab>('explore')
    const profile = mockTenantProfile
    const properties = mockTenantProperties
    const unreadMessages = 2
    const unreadNotifications = 1

    function handlePropertyClick(property: TenantProperty) {
        console.log('property details:', property.id)
    }

    return (
        <main className={styles.page}>
            <div className={styles.layout}>
                <div className={styles.desktopSidebar}>
                    <TenantSidebar
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        unreadMessages={unreadMessages}
                        unreadNotifications={unreadNotifications}
                    />
                </div>

                <div className={styles.mainColumn}>
                    <TenantTopBar
                        profile={profile}
                        unreadMessages={unreadMessages}
                        unreadNotifications={unreadNotifications}
                    />

                    <div className={styles.content}>
                        <div className={styles.mobileSidebar}>
                            <TenantSidebar
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                unreadMessages={unreadMessages}
                                unreadNotifications={unreadNotifications}
                            />
                        </div>

                        <section className={styles.header}>
                            <h1 className={styles.title}>
                                {t('tenantDashboard.header.title')}
                            </h1>
                            <p className={styles.subtitle}>
                                {t('tenantDashboard.header.subtitle')}
                            </p>
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
                </div>
            </div>

        </main>
    )
}
