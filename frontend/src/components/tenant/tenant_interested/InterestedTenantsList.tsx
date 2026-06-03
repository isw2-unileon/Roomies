import { useTranslation } from 'react-i18next'

import styles from '@/styles/TenantInterestedTenants.module.css'
import type { InterestedTenant, TenantGroupDetailItem } from '@/types/tenant'

import InterestedTenantCard from './InterestedTenantCard'

interface InterestedTenantsListProps {
  tenants: InterestedTenant[]
  propertyId: string
  myGroup: TenantGroupDetailItem | null
}

export default function InterestedTenantsList({ tenants, propertyId, myGroup }: InterestedTenantsListProps) {
  const { t } = useTranslation()

  if (tenants.length === 0) {
    return <p className={styles.empty}>{t('tenantDashboard.detail.interested.empty')}</p>
  }

  return (
    <div className={styles.grid}>
      {tenants.map((tenant) => (
        <InterestedTenantCard key={tenant.userId} tenant={tenant} propertyId={propertyId} myGroup={myGroup} />
      ))}
    </div>
  )
}
