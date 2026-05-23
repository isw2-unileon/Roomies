import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerDashboardProperty } from '@/types/owner'

interface OwnerPropertyGridProps {
  properties: OwnerDashboardProperty[]
}

export default function OwnerPropertyGrid({ properties }: OwnerPropertyGridProps) {
  if (properties.length === 0) {
    return <p className={styles.ownerPropertyEmpty}>Todavia no tienes pisos publicados.</p>
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
              <div className={styles.ownerPropertyImageFallback}>Sin imagen</div>
            )}
            <div className={styles.ownerPropertyBody}>
              <h3 className={styles.ownerPropertyTitle}>{property.title}</h3>
              <p className={styles.ownerPropertyAddress}>{property.address}</p>
              <div className={styles.ownerPropertyMeta}>
                <span>{property.totalSpots} plazas totales</span>
                <span>{property.occupiedSpots} ocupadas</span>
                <span>{freeSpots} libres</span>
                {property.area ? <span>Zona: {property.area}</span> : null}
                {property.rent != null ? <span>Precio base: {property.rent} EUR</span> : null}
                {statusText ? <span>Estado: {statusText}</span> : null}
              </div>
              <div className={styles.ownerProgressRow}>
                <div className={styles.ownerProgressTrack}>
                  <div className={styles.ownerProgressBar} style={{ width: `${percent}%` }} />
                </div>
                <span className={styles.ownerProgressLabel}>{percent}% ocupado</span>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
