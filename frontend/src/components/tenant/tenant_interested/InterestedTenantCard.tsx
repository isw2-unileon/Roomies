import { useTranslation } from 'react-i18next'

import styles from '@/styles/TenantInterestedTenants.module.css'
import type { InterestedTenant } from '@/types/tenant'

interface InterestedTenantCardProps {
  tenant: InterestedTenant
}

export default function InterestedTenantCard({ tenant }: InterestedTenantCardProps) {
  const { t } = useTranslation()

  const initials = tenant.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        {tenant.avatarUrl ? (
          <img src={tenant.avatarUrl} alt={tenant.name} className={styles.avatar} />
        ) : (
          <div className={styles.avatarFallback}>{initials}</div>
        )}
        <div className={styles.cardInfo}>
          <p className={styles.name}>{tenant.name}</p>
          <p className={styles.meta}>
            {t('tenantDashboard.detail.interested.meta', { age: tenant.age, studies: tenant.studies })}
          </p>
        </div>
      </div>

      <div className={styles.compatibilityRow}>
        <div className={styles.ring} style={{ '--compatibility': tenant.compatibility } as React.CSSProperties}>
          <span className={styles.ringValue}>{tenant.compatibility}%</span>
        </div>
        <span className={styles.compatibleLabel}>
          {t('tenantDashboard.detail.interested.compatible', { count: tenant.compatibility })}
        </span>
      </div>
    </article>
  )
}
