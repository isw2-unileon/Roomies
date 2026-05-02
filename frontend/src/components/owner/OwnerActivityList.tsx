import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerActivityItem } from '@/types/owner'

interface OwnerActivityListProps {
  items: OwnerActivityItem[]
}

export default function OwnerActivityList({ items }: OwnerActivityListProps) {
  return (
    <section className={styles.ownerSectionCard}>
      <header className={styles.ownerSectionHeader}>
        <h2 className={styles.ownerSectionTitle}>Actividad reciente</h2>
      </header>
      <div className={styles.ownerActivityList}>
        {items.map((activity) => (
          <article key={activity.id} className={styles.ownerActivityItem}>
            <p className={styles.ownerActivityTitle}>{activity.title}</p>
            <p className={styles.ownerActivityMeta}>{activity.meta}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
