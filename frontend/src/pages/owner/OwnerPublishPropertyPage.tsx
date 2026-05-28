import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import OwnerLayout from '@/components/owner/OwnerLayout'
import OwnerPropertyPublishForm from '@/components/owner/owner_publish_property/OwnerPropertyPublishForm'
import { paths } from '@/routes/paths'
import { getOwnerApartment } from '@/services/ownerService'
import styles from '@/styles/OwnerPublishProperty.module.css'
import type { OwnerDashboardProperty } from '@/types/owner'

interface OwnerPublishLocationState {
  propertyId?: string
}

export default function OwnerPublishPropertyPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const state = location.state as OwnerPublishLocationState | null
  const propertyId = state?.propertyId
  const [property, setProperty] = useState<OwnerDashboardProperty | undefined>()
  const [loadError, setLoadError] = useState('')
  const [isLoadingProperty, setIsLoadingProperty] = useState(Boolean(propertyId))

  useEffect(() => {
    let ignoreResult = false

    async function loadPropertyForEdit() {
      if (!propertyId) {
        setProperty(undefined)
        setLoadError('')
        setIsLoadingProperty(false)
        return
      }

      setIsLoadingProperty(true)
      setLoadError('')

      try {
        const loadedProperty = await getOwnerApartment(propertyId)
        if (!ignoreResult) {
          setProperty(loadedProperty)
        }
      } catch (error) {
        if (!ignoreResult) {
          setProperty(undefined)
          setLoadError(error instanceof Error ? error.message : t('ownerDashboard.publish.errors.loadEdit'))
        }
      } finally {
        if (!ignoreResult) {
          setIsLoadingProperty(false)
        }
      }
    }

    void loadPropertyForEdit()

    return () => {
      ignoreResult = true
    }
  }, [propertyId, t])

  return (
    <OwnerLayout>
      <Link to={paths.ownerProperties} className={styles.backLink}>
        <ArrowLeftIcon className={styles.backIcon} aria-hidden="true" />
        {t('ownerDashboard.publish.backToProperties')}
      </Link>
      {isLoadingProperty ? (
        <p className={styles.pageSubtitle}>{t('ownerDashboard.publish.loadingEdit')}</p>
      ) : loadError ? (
        <p className={styles.errorNotice} role="status">{loadError}</p>
      ) : (
        <OwnerPropertyPublishForm propertyId={propertyId} property={property} />
      )}
    </OwnerLayout>
  )
}
