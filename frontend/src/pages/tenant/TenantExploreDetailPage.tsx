import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router-dom'

import TenantLayout from '@/components/tenant/TenantLayout'
import TenantCompatibilityCard from '@/components/tenant/tenant_explore_details/TenantCompatibilityCard'
import TenantContactModal from '@/components/tenant/tenant_explore_details/TenantContactOwnerModal'
import TenantExploreDetailHeader from '@/components/tenant/tenant_explore_details/TenantExploreDetailHeader'
import TenantInterestedTenantsCard from '@/components/tenant/tenant_explore_details/TenantInterestedTenantsCard'
import TenantPropertyDetailsCard from '@/components/tenant/tenant_explore_details/TenantPropertyDetailsCard'
import TenantPropertyGallery from '@/components/tenant/tenant_explore_details/TenantPropertyGallery'
import TenantServicesLocationCard from '@/components/tenant/tenant_explore_details/TenantServicesLocationCard'
import { paths } from '@/routes/paths'
import {
  applyToTenantApartment,
  cancelTenantApplication,
  getTenantApartmentDetail,
  listInterestedTenants,
} from '@/services/tenantService'
import styles from '@/styles/TenantExploreDetail.module.css'
import type { InterestedTenant, TenantProperty, TenantPropertyDetail } from '@/types/tenant'

interface TenantExploreDetailLocationState {
  property?: TenantProperty
}

export default function TenantExploreDetailPage() {
  const { t } = useTranslation()
  const { propertyId = '' } = useParams()
  const location = useLocation()
  const locationState = location.state as TenantExploreDetailLocationState | null

  const [property, setProperty] = useState<TenantProperty | null>(locationState?.property ?? null)
  const [detail, setDetail] = useState<TenantPropertyDetail | null>(null)
  const [interestedTenants, setInterestedTenants] = useState<InterestedTenant[]>([])
  const [isLoading, setIsLoading] = useState(!locationState?.property)
  const [error, setError] = useState('')
  const [applyStatus, setApplyStatus] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  useEffect(() => {
    let ignoreResult = false

    async function loadProperty() {
      setIsLoading(true)
      setError('')

      try {
        const [apartmentDetail, tenants] = await Promise.all([
          getTenantApartmentDetail(propertyId),
          listInterestedTenants(propertyId),
        ])
        if (ignoreResult) {
          return
        }

        setDetail(apartmentDetail)
        setProperty(apartmentDetail.property)
        setInterestedTenants(tenants)
      } catch (loadError) {
        if (!ignoreResult) {
          setError(loadError instanceof Error ? loadError.message : t('tenantDashboard.detail.loadError'))
        }
      } finally {
        if (!ignoreResult) {
          setIsLoading(false)
        }
      }
    }

    void loadProperty()

    return () => {
      ignoreResult = true
    }
  }, [propertyId, t])

  async function handleApplyToApartment() {
    if (!propertyId) {
      return
    }
    setApplyStatus('')
    setIsApplying(true)
    try {
      await applyToTenantApartment(propertyId)
      const apartmentDetail = await getTenantApartmentDetail(propertyId)
      setDetail(apartmentDetail)
      setProperty(apartmentDetail.property)
      setApplyStatus(t('tenantDashboard.detail.applySuccess'))
    } catch (applyError) {
      setApplyStatus(applyError instanceof Error ? applyError.message : t('tenantDashboard.detail.applyError'))
    } finally {
      setIsApplying(false)
    }
  }

  async function handleCancelApplication() {
    if (!propertyId || !detail?.currentApplicationId) {
      return
    }
    setApplyStatus('')
    setIsApplying(true)
    try {
      await cancelTenantApplication(detail.currentApplicationId)
      const apartmentDetail = await getTenantApartmentDetail(propertyId)
      setDetail(apartmentDetail)
      setProperty(apartmentDetail.property)
      setApplyStatus(t('tenantDashboard.detail.cancelSuccess'))
    } catch (cancelError) {
      setApplyStatus(cancelError instanceof Error ? cancelError.message : t('tenantDashboard.detail.cancelError'))
    } finally {
      setIsApplying(false)
    }
  }

  if (isLoading) {
    return (
      <TenantLayout>
        <p role="status" className={styles.statusText}>{t('tenantDashboard.detail.loading')}</p>
      </TenantLayout>
    )
  }

  if (!property) {
    return (
      <TenantLayout>
        <div className={styles.statusBox}>
          <p role="alert" className={styles.statusText}>{error || t('tenantDashboard.detail.notFound')}</p>
          <Link to={paths.tenantExplore} className={styles.backLink}>{t('tenantDashboard.detail.backToExplore')}</Link>
        </div>
      </TenantLayout>
    )
  }

  const compatibility = property.compatibilityScore
  const compatibilityReasons = detail?.compatibilityReasons ?? []
  const rules = detail?.rules
  const applicationId = detail?.currentApplicationId?.trim() ?? ''
  const applicationStatus = detail?.currentApplicationStatus?.trim().toLowerCase() ?? ''
  const hasActiveApplication = applicationId.length > 0 && applicationStatus !== 'cancelled' && applicationStatus !== 'rejected'

  return (
    <TenantLayout>
      <div className={styles.content}>
        <TenantExploreDetailHeader
          property={property}
          canApply={detail?.canApply ?? false}
          canCancel={detail?.canCancel ?? false}
          hasActiveApplication={hasActiveApplication}
          isApplying={isApplying}
          onApply={handleApplyToApartment}
          onCancel={handleCancelApplication}
          onContact={() => setIsContactModalOpen(true)}
        />
        {applyStatus ? <p className={styles.statusText}>{applyStatus}</p> : null}

        <div className={styles.mainGrid}>
          <TenantPropertyGallery property={property} />
          <TenantCompatibilityCard compatibility={compatibility} reasons={compatibilityReasons} />
          <TenantPropertyDetailsCard property={property} />
          <TenantServicesLocationCard rules={rules} />
          <TenantInterestedTenantsCard tenants={interestedTenants} propertyId={propertyId} />
        </div>
      </div>

      {isContactModalOpen && property.ownerId ? (
        <TenantContactModal
          apartmentId={property.id}
          recipientId={property.ownerId}
          recipientName={property.ownerName}
          titleKey="tenantDashboard.detail.contactOwner"
          onClose={() => setIsContactModalOpen(false)}
        />
      ) : null}
    </TenantLayout>
  )
}
