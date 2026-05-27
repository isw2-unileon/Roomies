import { useTranslation } from 'react-i18next'
import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerDashboardProperty } from '@/types/owner'

interface OwnerPropertyGridProps {
  properties: OwnerDashboardProperty[]
}

export default function OwnerPropertyGrid({ properties }: OwnerPropertyGridProps) {
  const { t } = useTranslation()

  if (properties.length === 0) {
    return <p className={styles.ownerPropertyEmpty}>{t('ownerDashboard.propertyCard.empty')}</p>
  }

  return (
    <div className={styles.ownerPropertyGrid}>
      {properties.map((property) => {
        const percent = property.totalSpots > 0 ? Math.round((property.occupiedSpots / property.totalSpots) * 100) : 0
        const freeSpots = Math.max(property.totalSpots - property.occupiedSpots, 0)
        const statusLabel = property.status ? property.status.replaceAll('_', ' ').toLowerCase() : ''
        const statusText = statusLabel ? statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1) : ''

        return (
          <article key={property.id} className={styles.ownerPropertyCard}>
            {property.image ? (
              <img src={property.image} alt={property.title} className={styles.ownerPropertyImage} loading="lazy" />
            ) : (
              <div className={styles.ownerPropertyImageFallback}>{t('ownerDashboard.propertyCard.noImage')}</div>
            )}
            <div className={styles.ownerPropertyBody}>
              <h3 className={styles.ownerPropertyTitle}>{property.title}</h3>
              <p className={styles.ownerPropertyAddress}>{property.address}</p>
              <div className={styles.ownerPropertyMeta}>
                <span>{t('ownerDashboard.propertyCard.totalSpots', { count: property.totalSpots })}</span>
                <span>{t('ownerDashboard.propertyCard.occupiedSpots', { count: property.occupiedSpots })}</span>
                <span>{t('ownerDashboard.propertyCard.freeSpots', { count: freeSpots })}</span>
                {property.area ? <span>{t('ownerDashboard.propertyCard.area', { area: property.area })}</span> : null}
                {property.rent != null ? <span>{t('ownerDashboard.propertyCard.basePrice', { price: property.rent })}</span> : null}
                {statusText ? <span>{t('ownerDashboard.propertyCard.status', { status: statusText })}</span> : null}
              </div>
              <div className={styles.ownerProgressRow}>
                <div className={styles.ownerProgressTrack}>
                  <div className={styles.ownerProgressBar} style={{ width: `${percent}%` }} />
                </div>
                <span className={styles.ownerProgressLabel}>{t('ownerDashboard.propertyCard.percentOccupied', { percent })}</span>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
