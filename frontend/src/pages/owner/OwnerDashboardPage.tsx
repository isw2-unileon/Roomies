import { PlusIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useNotice } from '@/hooks/useNotice'
import AuthNotice from '@/components/auth/AuthNotice'
import OwnerLayout from '@/components/owner/OwnerLayout'
import OwnerPropertyGrid from '@/components/owner/owner_properties/OwnerPropertyGrid'
import OwnerSummaryCard from '@/components/owner/owner_properties/OwnerSummaryCard'
import styles from '@/styles/OwnerDashboard.module.css'
import { paths } from '@/routes/paths'
import { getProfileStatus } from '@/services/authService'
import { closeApartment, reopenApartment, listOwnerApartments } from '@/services/ownerService'
import type { OwnerDashboardProperty } from '@/types/owner'

export default function OwnerDashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [ownerProperties, setOwnerProperties] = useState<OwnerDashboardProperty[]>([])
  const [isLoadingProperties, setIsLoadingProperties] = useState(false)
  const [closingPropertyId, setClosingPropertyId] = useState<string | null>(null)
  const [reopeningPropertyId, setReopeningPropertyId] = useState<string | null>(null)
  const { notice, showError, showSuccess, clearNotice } = useNotice()

  const occupancy = useMemo(() => {
    const total = ownerProperties.reduce((acc, property) => acc + property.totalSpots, 0)
    const occupied = ownerProperties.reduce((acc, property) => acc + property.occupiedSpots, 0)
    const free = total - occupied
    const percent = total > 0 ? Math.round((occupied / total) * 100) : 0
    return { total, occupied, free, percent }
  }, [ownerProperties])

  useEffect(() => {
    let ignoreResult = false

    async function loadOwnerProperties() {
      setIsLoadingProperties(true)
      clearNotice()

      try {
        const profileStatus = await getProfileStatus()
        if (ignoreResult) {
          return
        }
        if (profileStatus.role !== 'owner') {
          setOwnerProperties([])
          showError(t('ownerDashboard.properties.ownerOnly'))
          return
        }

        const apartments = await listOwnerApartments()
        if (!ignoreResult) {
          setOwnerProperties(apartments)
        }
      } catch (error) {
        if (!ignoreResult) {
          setOwnerProperties([])
          showError(error instanceof Error ? error.message : t('ownerDashboard.properties.loadError'))
        }
      } finally {
        if (!ignoreResult) {
          setIsLoadingProperties(false)
        }
      }
    }

    void loadOwnerProperties()

    return () => {
      ignoreResult = true
    }
  }, [clearNotice, showError, t])

  function handleEditProperty(property: OwnerDashboardProperty) {
    navigate(paths.ownerPublishProperty, { state: { propertyId: property.id } })
  }

  const handleCloseProperty = useCallback(async (property: OwnerDashboardProperty) => {
    setClosingPropertyId(property.id)
    try {
      await closeApartment(property.id)
      setOwnerProperties((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, status: 'CLOSED' } : p)),
      )
      showSuccess(t('ownerDashboard.propertyCard.closeSuccess'))
    } catch (error) {
      showError(error instanceof Error ? error.message : t('ownerDashboard.propertyCard.closeError'))
    } finally {
      setClosingPropertyId(null)
    }
  }, [showSuccess, showError, t])

  const handleReopenProperty = useCallback(async (property: OwnerDashboardProperty) => {
    setReopeningPropertyId(property.id)
    try {
      await reopenApartment(property.id)
      setOwnerProperties((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, status: 'AVAILABLE' } : p)),
      )
      showSuccess(t('ownerDashboard.propertyCard.reopenSuccess'))
    } catch (error) {
      showError(error instanceof Error ? error.message : t('ownerDashboard.propertyCard.reopenError'))
    } finally {
      setReopeningPropertyId(null)
    }
  }, [showSuccess, showError, t])

  const handleTenantRemoved = useCallback((propertyId: string) => {
    setOwnerProperties((prev) => prev.map((property) => {
      if (property.id !== propertyId) {
        return property
      }
      const occupiedSpots = Math.max(property.occupiedSpots - 1, 0)
      const status = property.status === 'FULL'
        ? occupiedSpots === 0 ? 'AVAILABLE' : 'PARTIALLY_OCCUPIED'
        : property.status
      return { ...property, occupiedSpots, status }
    }))
  }, [])

  return (
    <OwnerLayout>
      <div className={styles.ownerMainGrid}>
        <div className={styles.ownerPrimaryColumn}>
          <section className={styles.ownerSectionCard}>
            <header className={styles.ownerSectionHeader}>
              <h1 className={styles.ownerSectionTitle}>{t('ownerDashboard.properties.title')}</h1>
              <button
                type="button"
                className={styles.ownerPublishButton}
                onClick={() => navigate(paths.ownerPublishProperty)}
              >
                <PlusIcon className={styles.ownerIconSmall} aria-hidden="true" />
                {t('ownerDashboard.properties.publish')}
              </button>
            </header>
            <AuthNotice kind={notice.kind} message={notice.message} />
            {isLoadingProperties ? (
              <p className={styles.ownerPropertyEmpty}>{t('ownerDashboard.properties.loading')}</p>
            ) : (
              <OwnerPropertyGrid properties={ownerProperties} onEdit={handleEditProperty} onClose={handleCloseProperty} onReopen={handleReopenProperty} closingPropertyId={closingPropertyId} reopeningPropertyId={reopeningPropertyId} onTenantRemoved={handleTenantRemoved} />
            )}
          </section>
        </div>

        <aside className={styles.ownerSideColumn}>
          <OwnerSummaryCard
            occupied={occupancy.occupied}
            total={occupancy.total}
            free={occupancy.free}
            percent={occupancy.percent}
          />
        </aside>
      </div>
    </OwnerLayout>
  )
}
