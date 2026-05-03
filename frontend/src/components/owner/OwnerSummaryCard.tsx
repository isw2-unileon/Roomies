import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import styles from '@/styles/OwnerDashboard.module.css'

interface OwnerSummaryCardProps {
  occupied: number
  total: number
  free: number
  percent: number
}

export default function OwnerSummaryCard({ occupied, total, free, percent }: OwnerSummaryCardProps) {
  return (
    <section className={styles.ownerSectionCard}>
      <header className={styles.ownerSectionHeader}>
        <h2 className={styles.ownerSectionTitle}>Resumen de ocupacion</h2>
      </header>
      <div className={styles.ownerDonutWrap}>
        <div className={styles.ownerDonut} style={{ ['--owner-occupied' as string]: percent }}>
          <div className={styles.ownerDonutInner}>
            <strong>
              {occupied} / {total}
            </strong>
            <span>plazas ocupadas</span>
          </div>
        </div>
        <div className={styles.ownerLegend}>
          <span>
            <i className={styles.ownerDotBusy} /> Ocupadas {occupied}
          </span>
          <span>
            <i className={styles.ownerDotFree} /> Libres {free}
          </span>
        </div>
      </div>
      <div className={styles.ownerHintCard}>
        <ExclamationTriangleIcon className={styles.ownerIconSmall} aria-hidden="true" />
        <p>Buen trabajo! Tienes un {percent}% de ocupacion global.</p>
      </div>
    </section>
  )
}
