import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import placeholderAvatar from '@/assets/placeholder-avatar.png'
import TenantProfileView from '@/components/owner/TenantProfileView'
import { listApartmentTenants } from '@/services/ownerService'
import type { ApartmentTenant } from '@/services/ownerService'
import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerDashboardProperty } from '@/types/owner'

interface OwnerPropertyGridProps {
  properties: OwnerDashboardProperty[]
  onEdit?: (property: OwnerDashboardProperty) => void
  onClose?: (property: OwnerDashboardProperty) => void
  onReopen?: (property: OwnerDashboardProperty) => void
  closingPropertyId?: string | null
  reopeningPropertyId?: string | null
}

export default function OwnerPropertyGrid({ properties, onEdit, onClose, onReopen, closingPropertyId, reopeningPropertyId }: OwnerPropertyGridProps) {
  const { t } = useTranslation()
  const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null)
  const [tenantsModalProperty, setTenantsModalProperty] = useState<OwnerDashboardProperty | null>(null)
  const [tenants, setTenants] = useState<ApartmentTenant[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)
  const [tenantsError, setTenantsError] = useState('')
  const [viewingTenantProfile, setViewingTenantProfile] = useState<ApartmentTenant | null>(null)

  async function handleViewTenants(property: OwnerDashboardProperty) {
    setTenantsModalProperty(property)
    setViewingTenantProfile(null)
    setLoadingTenants(true)
    setTenantsError('')
    try {
      const result = await listApartmentTenants(property.id)
      setTenants(result)
    } catch {
      setTenantsError(t('ownerDashboard.propertyCard.tenantsLoadError'))
    } finally {
      setLoadingTenants(false)
    }
  }

  function closeTenantsModal() {
    setTenantsModalProperty(null)
    setTenants([])
    setTenantsError('')
    setViewingTenantProfile(null)
  }

  if (properties.length === 0) {
    return <p className={styles.ownerPropertyEmpty}>{t('ownerDashboard.propertyCard.empty')}</p>
  }

  return (
    <div className={styles.ownerPropertyGrid}>
      {properties.map((property) => {
        const isClosed = property.status === 'CLOSED'
        const percent = property.totalSpots > 0 ? Math.round((property.occupiedSpots / property.totalSpots) * 100) : 0
        const freeSpots = Math.max(property.totalSpots - property.occupiedSpots, 0)
        const statusLabel = property.status ? property.status.replaceAll('_', ' ').toLowerCase() : ''
        const statusText = statusLabel ? statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1) : ''

        return (
          <article key={property.id} className={`${styles.ownerPropertyCard} ${isClosed ? styles.ownerPropertyCardClosed : ''}`}>
            {isClosed && (
              <span className={styles.ownerPropertyClosedBadge}>
                {t('ownerDashboard.propertyCard.statusClosed')}
              </span>
            )}
            {property.image ? (
              <img src={property.image} alt={property.title} className={styles.ownerPropertyImage} loading="lazy" />
            ) : (
              <div className={styles.ownerPropertyImageFallback}>{t('ownerDashboard.propertyCard.noImage')}</div>
            )}
            <div className={styles.ownerPropertyBody}>
              <h3 className={styles.ownerPropertyTitle}>{property.title}</h3>
              <p className={styles.ownerPropertyAddress}>{property.address}</p>
              <div className={styles.ownerPropertyMeta}>
                <span>{t('ownerDashboard.propertyCard.totalSpots', { count: property.totalSpots })}</span>
                <span>{t('ownerDashboard.propertyCard.occupiedSpots', { count: property.occupiedSpots })}</span>
                <span>{t('ownerDashboard.propertyCard.freeSpots', { count: freeSpots })}</span>
                {property.area ? <span>{t('ownerDashboard.propertyCard.area', { area: property.area })}</span> : null}
                {property.rent != null ? <span>{t('ownerDashboard.propertyCard.basePrice', { price: property.rent })}</span> : null}
                {statusText ? <span>{t('ownerDashboard.propertyCard.status', { status: statusText })}</span> : null}
              </div>
              <div className={styles.ownerProgressRow}>
                <div className={styles.ownerProgressTrack}>
                  <div className={styles.ownerProgressBar} style={{ width: `${percent}%` }} />
                </div>
                <span className={styles.ownerProgressLabel}>{t('ownerDashboard.propertyCard.percentOccupied', { percent })}</span>
              </div>
              <div className={styles.ownerPropertyActions}>
                {property.occupiedSpots > 0 ? (
                  <button
                    type="button"
                    className={styles.ownerPropertyViewTenantsButton}
                    onClick={() => handleViewTenants(property)}
                    aria-label={t('ownerDashboard.propertyCard.viewTenantsAria', { title: property.title })}
                  >
                    {t('ownerDashboard.propertyCard.viewTenants')}
                  </button>
                ) : null}
                {onEdit && !isClosed ? (
                  <button
                    type="button"
                    className={styles.ownerPropertyEditButton}
                    onClick={() => onEdit(property)}
                    aria-label={t('ownerDashboard.propertyCard.editAria', { title: property.title })}
                  >
                    {t('ownerDashboard.propertyCard.edit')}
                  </button>
                ) : null}
                {onClose && !isClosed ? (
                  <button
                    type="button"
                    className={styles.ownerPropertyCloseButton}
                    onClick={() => setConfirmCloseId(property.id)}
                    disabled={closingPropertyId === property.id}
                    aria-label={t('ownerDashboard.propertyCard.closeAria', { title: property.title })}
                  >
                    {closingPropertyId === property.id ? '...' : t('ownerDashboard.propertyCard.close')}
                  </button>
                ) : null}
                {onReopen && isClosed ? (
                  <button
                    type="button"
                    className={styles.ownerPropertyReopenButton}
                    onClick={() => onReopen(property)}
                    disabled={reopeningPropertyId === property.id}
                    aria-label={t('ownerDashboard.propertyCard.reopenAria', { title: property.title })}
                  >
                    {reopeningPropertyId === property.id ? '...' : t('ownerDashboard.propertyCard.reopen')}
                  </button>
                ) : null}
              </div>
            </div>

            {confirmCloseId === property.id && (
              <div className={styles.ownerPropertyCloseOverlay}>
                <div className={styles.ownerPropertyCloseModal}>
                  <h4 className={styles.ownerPropertyCloseModalTitle}>
                    {t('ownerDashboard.propertyCard.closeConfirmTitle')}
                  </h4>
                  <p className={styles.ownerPropertyCloseModalText}>
                    {t('ownerDashboard.propertyCard.closeConfirmMessage')}
                  </p>
                  <div className={styles.ownerPropertyCloseModalActions}>
                    <button
                      type="button"
                      className={styles.ownerPropertyCloseModalCancel}
                      onClick={() => setConfirmCloseId(null)}
                    >
                      {t('ownerDashboard.propertyCard.closeCancelButton')}
                    </button>
                    <button
                      type="button"
                      className={styles.ownerPropertyCloseModalConfirm}
                      onClick={() => {
                        setConfirmCloseId(null)
                        onClose?.(property)
                      }}
                    >
                      {t('ownerDashboard.propertyCard.closeConfirmButton')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </article>
        )
      })}

      {tenantsModalProperty && (
        <div className={styles.ownerModalOverlay} onClick={closeTenantsModal} role="dialog" aria-modal="true">
          <div className={styles.ownerModalCard} onClick={(e) => e.stopPropagation()}>
            <button className={styles.ownerModalClose} onClick={closeTenantsModal} aria-label="close">✕</button>

            {viewingTenantProfile ? (
              <TenantProfileView person={viewingTenantProfile} onBack={() => setViewingTenantProfile(null)} />
            ) : (
              <>
                <h4 className={styles.ownerRequestDetailTitle}>
                  {t('ownerDashboard.propertyCard.tenantsTitle')}
                </h4>
                <p className={styles.ownerRequestDetailMeta}>
                  {tenantsModalProperty.title} — {t('ownerDashboard.propertyCard.tenantsSpots', { occupied: tenantsModalProperty.occupiedSpots, total: tenantsModalProperty.totalSpots })}
                </p>
                <p className={styles.ownerPropertyTenantsFree}>
                  {t('ownerDashboard.propertyCard.tenantsFreeSpots', { count: Math.max(tenantsModalProperty.totalSpots - tenantsModalProperty.occupiedSpots, 0) })}
                </p>

                {loadingTenants ? (
                  <p className={styles.ownerPropertyTenantsLoading}>...</p>
                ) : tenantsError ? (
                  <p className={styles.ownerPropertyTenantsError}>{tenantsError}</p>
                ) : tenants.length === 0 ? (
                  <p className={styles.ownerPropertyTenantsEmpty}>{t('ownerDashboard.propertyCard.tenantsEmpty')}</p>
                ) : (
                  <ul className={styles.ownerPropertyTenantsList}>
                    {tenants.map((tenant) => (
                      <li key={tenant.userId} className={styles.ownerPropertyTenantItem}>
                        <img
                          src={tenant.avatarUrl || placeholderAvatar}
                          alt={tenant.name}
                          className={styles.ownerPropertyTenantAvatar}
                          onError={(e) => { (e.target as HTMLImageElement).src = placeholderAvatar }}
                        />
                        <div className={styles.ownerPropertyTenantInfo}>
                          <span className={styles.ownerPropertyTenantName}>{tenant.name}</span>
                          <span className={styles.ownerPropertyTenantEmail}>{tenant.email}</span>
                          {tenant.joinedAt ? (
                            <span className={styles.ownerPropertyTenantDate}>
                              {t('ownerDashboard.propertyCard.tenantsSince', { date: tenant.joinedAt })}
                            </span>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className={styles.ownerProfileViewButton}
                          onClick={() => setViewingTenantProfile(tenant)}
                        >
                          {t('ownerDashboard.propertyCard.tenantsViewProfile')}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
