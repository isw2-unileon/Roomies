import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import placeholderAvatar from '@/assets/placeholder-avatar.png'
import TenantContactModal from '@/components/tenant/tenant_explore_details/TenantContactOwnerModal'
import styles from '@/styles/TenantInterestedTenants.module.css'
import type { InterestedTenant, TenantGroupDetailItem } from '@/types/tenant'
import TenantDetailModal from './TenantDetailModal'

interface InterestedTenantCardProps {
  tenant: InterestedTenant
  propertyId: string
  myGroup: TenantGroupDetailItem | null
}

export default function InterestedTenantCard({ tenant, propertyId, myGroup }: InterestedTenantCardProps) {
  const { t } = useTranslation()
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const avatarSrc = !avatarFailed && tenant.avatarUrl ? tenant.avatarUrl : placeholderAvatar

  return (
    <>
      <article className={styles.card}>
        <div className={styles.cardTop}>
          <img
            src={avatarSrc}
            alt={tenant.name}
            className={styles.avatar}
            onError={() => setAvatarFailed(true)}
          />
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

        <div className={styles.buttonRow}>
          <button className={styles.detailsButton} onClick={() => setShowModal(true)}>
            {t('tenantDashboard.detail.interested.viewDetails')}
          </button>
          <button className={styles.contactButton} onClick={() => setShowContactModal(true)}>
            {t('tenantDashboard.detail.contact')}
          </button>
        </div>
      </article>

      {showModal && <TenantDetailModal tenant={tenant} propertyId={propertyId} myGroup={myGroup} onClose={() => setShowModal(false)} />}
      {showContactModal && (
        <TenantContactModal
          apartmentId={propertyId}
          recipientId={tenant.userId}
          recipientName={tenant.name}
          titleKey="tenantDashboard.detail.contact"
          onClose={() => setShowContactModal(false)}
        />
      )}
    </>
  )
}
