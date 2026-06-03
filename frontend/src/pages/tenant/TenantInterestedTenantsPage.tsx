import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router-dom'

import InterestedTenantsList from '@/components/tenant/tenant_interested/InterestedTenantsList'
import TenantLayout from '@/components/tenant/TenantLayout'
import { paths } from '@/routes/paths'
import { listInterestedTenants } from '@/services/tenantService'
import styles from '@/styles/TenantInterestedTenants.module.css'
import type { InterestedTenant } from '@/types/tenant'

interface LocationState {
  tenants?: InterestedTenant[]
}

export default function TenantInterestedTenantsPage() {
  const { t } = useTranslation()
  const { propertyId = '' } = useParams()
  const location = useLocation()
  const locationState = location.state as LocationState | null

  const [tenants, setTenants] = useState<InterestedTenant[]>(locationState?.tenants ?? [])
  const [isLoading, setIsLoading] = useState(!locationState?.tenants)

  useEffect(() => {
    if (locationState?.tenants) {
      return
    }

    let ignore = false

    async function load() {
      setIsLoading(true)
      try {
        const data = await listInterestedTenants(propertyId)
        if (!ignore) {
          setTenants(data)
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [propertyId, locationState?.tenants])

  const detailPath = paths.tenantExploreDetail.replace(':propertyId', propertyId)

  return (
    <TenantLayout>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <Link to={detailPath} className={styles.backLink}>
              ← {t('tenantDashboard.detail.interested.backToDetail')}
            </Link>
            <h1 className={styles.title}>{t('tenantDashboard.detail.interested.title')}</h1>
            {!isLoading && (
              <p className={styles.subtitle}>
                {t('tenantDashboard.detail.interested.count', { count: tenants.length })}
              </p>
            )}
          </div>
        </div>

        {isLoading
          ? <p className={styles.loading}>{t('tenantDashboard.detail.loading')}</p>
          : <InterestedTenantsList tenants={tenants} />
        }
      </div>
    </TenantLayout>
  )
}
