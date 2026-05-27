import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import styles from '@/styles/OwnerDashboard.module.css'

interface OwnerSummaryCardProps {
  occupied: number
  total: number
  free: number
  percent: number
}

export default function OwnerSummaryCard({ occupied, total, free, percent }: OwnerSummaryCardProps) {
  const { t } = useTranslation()

  return (
    <section className={styles.ownerSectionCard}>
      <header className={styles.ownerSectionHeader}>
        <h2 className={styles.ownerSectionTitle}>{t('ownerDashboard.summary.title')}</h2>
      </header>
      <div className={styles.ownerDonutWrap}>
        <div className={styles.ownerDonut} style={{ ['--owner-occupied' as string]: percent }}>
          <div className={styles.ownerDonutInner}>
            <strong>
              {occupied} / {total}
            </strong>
            <span>{t('ownerDashboard.summary.occupiedSpots')}</span>
          </div>
        </div>
        <div className={styles.ownerLegend}>
          <span>
            <i className={styles.ownerDotBusy} /> {t('ownerDashboard.summary.occupied', { count: occupied })}
          </span>
          <span>
            <i className={styles.ownerDotFree} /> {t('ownerDashboard.summary.free', { count: free })}
          </span>
        </div>
      </div>
      <div className={styles.ownerHintCard}>
        <ExclamationTriangleIcon className={styles.ownerIconSmall} aria-hidden="true" />
        <p>{t('ownerDashboard.summary.hint', { percent })}</p>
      </div>
    </section>
  )
}
