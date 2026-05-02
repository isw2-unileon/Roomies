import { useTranslation } from 'react-i18next'
import type { TenantProperty } from '@/types/tenant'
import TenantPropertyCard from './TenantPropertyCard'
import styles from '@/styles/TenantPropertyGrid.module.css'

interface TenantPropertyGridProps {
    properties: TenantProperty[]
    onPropertyClick?: (property: TenantProperty) => void
}

export default function TenantPropertyGrid({ properties, onPropertyClick = () => {} }: TenantPropertyGridProps) {
    const { t } = useTranslation()

    if (properties.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>{t('tenantDashboard.empty.title')}</p>
                <p className={styles.emptySubtitle}>{t('tenantDashboard.empty.subtitle')}</p>
            </div>
        )
    }

    return (
        <div className={styles.grid}>
            {properties.map((property, index) => (
                <div
                    key={property.id}
                    className={styles.gridItem}
                    style={{ animationDelay: `${Math.min(index * 70, 350)}ms` }}
                >
                    <TenantPropertyCard
                        property={property}
                        onDetails={() => onPropertyClick(property)}
                    />
                </div>
            ))}
        </div>
    )
}
