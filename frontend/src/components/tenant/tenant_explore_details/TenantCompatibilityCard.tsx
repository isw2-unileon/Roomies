import { type CSSProperties } from 'react'
import { CheckIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import styles from '@/styles/TenantExploreDetail.module.css'

interface TenantCompatibilityCardProps {
  compatibility: number
  reasons: string[]
}

export default function TenantCompatibilityCard({ compatibility, reasons }: TenantCompatibilityCardProps) {
  const { t } = useTranslation()
  const compatibilityReasons = reasons.length > 0 ? reasons : [t('tenantDashboard.detail.compatibility.fallbackReason')]

  return (
    <aside className={styles.compatibilityCard}>
      <h2 className={styles.cardTitle}>{t('tenantDashboard.detail.compatibility.title')}</h2>
      <div className={styles.compatibilityRow}>
        <div className={styles.ringWrap}>
          <div
            className={styles.ring}
            style={{ '--compatibility': `${compatibility}` } as CSSProperties}
          >
            <div className={styles.ringContent}>
              <span className={styles.ringValue}>{compatibility}%</span>
              <span className={styles.ringLabel}>{t('tenantDashboard.detail.compatibility.compatibleLabel')}</span>
            </div>
          </div>
        </div>

        <div className={styles.reasonList}>
          <p className={styles.reasonTitle}>{t('tenantDashboard.detail.compatibility.reasonsTitle')}</p>
          {compatibilityReasons.map((reason) => (
            <p key={reason} className={styles.reasonItem}>
              <CheckIcon className={styles.iconTiny} aria-hidden="true" />
              {reason}
            </p>
          ))}
        </div>
      </div>

      <div className={styles.tipBox}>
        <p className={styles.tipTitle}>{t('tenantDashboard.detail.compatibility.tipTitle')}</p>
        <p className={styles.tipText}>{t('tenantDashboard.detail.compatibility.tipText')}</p>
      </div>
    </aside>
  )
}
