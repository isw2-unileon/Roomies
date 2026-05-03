import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerDashboardProperty } from '@/types/owner'

interface OwnerPropertyGridProps {
  properties: OwnerDashboardProperty[]
}

export default function OwnerPropertyGrid({ properties }: OwnerPropertyGridProps) {
  return (
    <div className={styles.ownerPropertyGrid}>
      {properties.map((property) => {
        const percent = Math.round((property.occupiedSpots / property.totalSpots) * 100)

        return (
          <article key={property.id} className={styles.ownerPropertyCard}>
            <img src={property.image} alt={property.title} className={styles.ownerPropertyImage} loading="lazy" />
            <div className={styles.ownerPropertyBody}>
              <h3 className={styles.ownerPropertyTitle}>{property.title}</h3>
              <p className={styles.ownerPropertyAddress}>{property.address}</p>
              <div className={styles.ownerPropertyMeta}>
                <span>{property.totalSpots} plazas totales</span>
                <span>{property.occupiedSpots} ocupadas</span>
                <span>Inquilino: {property.tenant}</span>
                <span>Pago: {property.paymentStatus === 'received' ? 'Recibido' : 'Pendiente'}</span>
                <span>Proximo pago: {property.nextDueDate}</span>
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
