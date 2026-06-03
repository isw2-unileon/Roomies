import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router-dom'

import InterestedTenantsList from '@/components/tenant/tenant_interested/InterestedTenantsList'
import TenantMyGroupPanel from '@/components/tenant/tenant_interested/TenantMyGroupPanel'
import TenantLayout from '@/components/tenant/TenantLayout'
import { paths } from '@/routes/paths'
import { getMyGroupForApartment, listInterestedTenants } from '@/services/tenantService'
import styles from '@/styles/TenantInterestedTenants.module.css'
import type { InterestedTenant, TenantGroupDetailItem } from '@/types/tenant'

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
  const [myGroup, setMyGroup] = useState<TenantGroupDetailItem | null>(null)
  const [groupLoading, setGroupLoading] = useState(true)

  useEffect(() => {
    if (locationState?.tenants) return
    let ignore = false
    async function load() {
      setIsLoading(true)
      try {
        const data = await listInterestedTenants(propertyId)
        if (!ignore) setTenants(data)
      } finally {
        if (!ignore) setIsLoading(false)
      }
    }
    void load()
    return () => { ignore = true }
  }, [propertyId, locationState?.tenants])

  useEffect(() => {
    if (!propertyId) return
    let ignore = false
    async function loadGroup() {
      setGroupLoading(true)
      try {
        const g = await getMyGroupForApartment(propertyId)
        if (!ignore) setMyGroup(g)
      } catch {
        if (!ignore) setMyGroup(null)
      } finally {
        if (!ignore) setGroupLoading(false)
      }
    }
    void loadGroup()
    return () => { ignore = true }
  }, [propertyId])

  const detailPath = paths.tenantExploreDetail.replace(':propertyId', propertyId)

  return (
    <TenantLayout>
      <div className={styles.pageLayout}>
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
            : <InterestedTenantsList tenants={tenants} propertyId={propertyId} myGroup={myGroup} />
          }
        </div>

        <TenantMyGroupPanel group={myGroup} propertyId={propertyId} loading={groupLoading} />
      </div>
    </TenantLayout>
  )
}
