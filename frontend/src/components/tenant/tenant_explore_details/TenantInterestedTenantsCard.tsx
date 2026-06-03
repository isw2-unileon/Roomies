import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import styles from '@/styles/TenantExploreDetail.module.css'
import type { InterestedTenant } from '@/types/tenant'

interface TenantInterestedTenantsCardProps {
  tenants: InterestedTenant[]
  propertyId: string
}

export default function TenantInterestedTenantsCard({ tenants, propertyId }: TenantInterestedTenantsCardProps) {
  const { t } = useTranslation()

  return (
    <aside className={styles.peopleCard}>
      <div className={styles.peopleCardHeader}>
        <h2 className={styles.cardTitle}>{t('tenantDashboard.detail.interested.title')}</h2>
        {tenants.length > 0 && (
          <Link
            to={`/tenant/explore/${propertyId}/interested`}
            state={{ tenants }}
            className={styles.viewAllLink}
          >
            {t('tenantDashboard.detail.interested.viewAll')}
          </Link>
        )}
      </div>
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
