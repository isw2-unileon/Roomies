import { useTranslation } from 'react-i18next'

import styles from '@/styles/TenantExploreDetail.module.css'
import type { TenantProperty } from '@/types/tenant'

interface TenantPropertyDetailsCardProps {
  property: TenantProperty
}

export default function TenantPropertyDetailsCard({ property }: TenantPropertyDetailsCardProps) {
  const { t } = useTranslation()
  const details = [
    { label: t('tenantDashboard.detail.details.pricePerSpot'), value: t('tenantDashboard.detail.details.rentPerMonth', { rent: property.rent }) },
    { label: t('tenantDashboard.detail.details.rooms'), value: property.totalRooms },
    { label: t('tenantDashboard.detail.details.available'), value: t('tenantDashboard.detail.details.availableSpots', { count: property.availableRooms }) },
    { label: t('tenantDashboard.detail.details.area'), value: t(property.areaKey) },
  ]

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
      <p className={styles.description}>
        {t('tenantDashboard.detail.details.description', {
          area: t(property.areaKey),
          rooms: property.totalRooms,
          available: property.availableRooms,
        })}
      </p>
    </section>
  )
}
