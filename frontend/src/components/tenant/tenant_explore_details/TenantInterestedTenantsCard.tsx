import { useTranslation } from 'react-i18next'

import styles from '@/styles/TenantExploreDetail.module.css'
import type { InterestedTenant } from '@/types/tenant'

interface TenantInterestedTenantsCardProps {
  tenants: InterestedTenant[]
}

export default function TenantInterestedTenantsCard({ tenants }: TenantInterestedTenantsCardProps) {
  const { t } = useTranslation()

  return (
    <aside className={styles.peopleCard}>
      <h2 className={styles.cardTitle}>{t('tenantDashboard.detail.interested.title')}</h2>
      {tenants.length > 0 ? (
        <div className={styles.interestedList}>
          {tenants.map((tenant) => (
            <div key={tenant.userId} className={styles.interestedItem}>
              <div>
                <p className={styles.interestedName}>{tenant.name}</p>
                <p className={styles.interestedMeta}>{t('tenantDashboard.detail.interested.meta', { age: tenant.age, studies: tenant.studies })}</p>
              </div>
              <p className={styles.interestedScore}>{t('tenantDashboard.detail.interested.compatible', { count: tenant.compatibility })}</p>
            </div>
          ))}
        </div>
      ) : <p className={styles.emptyPeopleText}>{t('tenantDashboard.detail.interested.empty')}</p>}
    </aside>
  )
}
