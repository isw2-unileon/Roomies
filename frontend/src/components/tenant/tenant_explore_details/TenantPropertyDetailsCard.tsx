import { useTranslation } from 'react-i18next'

import styles from '@/styles/TenantExploreDetail.module.css'
import type { TenantProperty } from '@/types/tenant'

interface TenantPropertyDetailsCardProps {
  property: TenantProperty
}

export default function TenantPropertyDetailsCard({ property }: TenantPropertyDetailsCardProps) {
  const { t } = useTranslation()
  const occupiedSpots = property.totalRooms - property.availableRooms

  const details = [
    { label: t('tenantDashboard.detail.details.pricePerSpot'), value: t('tenantDashboard.detail.details.rentPerMonth', { rent: property.rent }) },
    { label: t('tenantDashboard.detail.details.rooms'), value: property.totalRooms },
    { label: t('tenantDashboard.detail.details.bathrooms'), value: property.bathrooms || null },
    { label: t('tenantDashboard.detail.details.available'), value: t('tenantDashboard.detail.details.availableSpots', { count: property.availableRooms }) },
    { label: t('tenantDashboard.detail.details.occupied'), value: t('tenantDashboard.detail.details.occupiedSpots', { count: occupiedSpots }) },
    { label: t('tenantDashboard.detail.details.surface'), value: property.surfaceM2 ? t('tenantDashboard.detail.details.surfaceValue', { m2: property.surfaceM2 }) : null },
    { label: t('tenantDashboard.detail.details.floor'), value: property.floor != null ? property.floor : null },
    { label: t('tenantDashboard.detail.details.area'), value: t(property.areaKey) },
    { label: t('tenantDashboard.detail.details.location'), value: t(property.addressKey) },
  ].filter((d) => d.value !== null && d.value !== 0 && d.value !== '')

  return (
    <section className={styles.detailsCard}>
      <h2 className={styles.cardTitle}>{t('tenantDashboard.detail.details.title')}</h2>
      <div className={styles.detailsGrid}>
        {details.map((detail) => (
          <div key={detail.label}>
            <p className={styles.label}>{detail.label}</p>
            <p className={styles.value}>{detail.value}</p>
          </div>
        ))}
      </div>
      {property.description && (
        <p className={styles.description}>{property.description}</p>
      )}
    </section>
  )
}
