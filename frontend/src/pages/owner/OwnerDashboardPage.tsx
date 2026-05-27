import { PlusIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useNotice } from '@/hooks/useNotice'
import AuthNotice from '@/components/auth/AuthNotice'
import OwnerLayout from '@/components/owner/OwnerLayout'
import OwnerActivityList from '@/components/owner/owner_properties/OwnerActivityList'
import OwnerHelpCard from '@/components/owner/owner_properties/OwnerHelpCard'
import OwnerIssuesList from '@/components/owner/owner_properties/OwnerIssuesList'
import OwnerPaymentsList from '@/components/owner/owner_properties/OwnerPaymentsList'
import OwnerPropertyGrid from '@/components/owner/owner_properties/OwnerPropertyGrid'
import OwnerSummaryCard from '@/components/owner/owner_properties/OwnerSummaryCard'
import {
  mockOwnerActivity,
  mockOwnerIssues,
  mockOwnerPayments,
} from '@/mocks/ownerData'
import styles from '@/styles/OwnerDashboard.module.css'
import { paths } from '@/routes/paths'
import { getProfileStatus } from '@/services/authService'
import { listOwnerApartments } from '@/services/ownerService'
import type { OwnerDashboardProperty, OwnerIssueStatus } from '@/types/owner'

export default function OwnerDashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [issues, setIssues] = useState(mockOwnerIssues)
  const [ownerProperties, setOwnerProperties] = useState<OwnerDashboardProperty[]>([])
  const [isLoadingProperties, setIsLoadingProperties] = useState(false)
  const { notice, showError, clearNotice } = useNotice()

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

  function handleStatusChange(id: string, status: OwnerIssueStatus) {
    setIssues((prev) => prev.map((issue) => (issue.id === id ? { ...issue, status } : issue)))
  }

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
              <OwnerPropertyGrid properties={ownerProperties} />
            )}
          </section>


          <section className={styles.ownerSectionCard}>
            <header className={styles.ownerSectionHeader}>
              <h2 className={styles.ownerSectionTitle}>{t('ownerDashboard.payments.title')}</h2>
            </header>
            <OwnerPaymentsList payments={mockOwnerPayments} />
          </section>

          <section className={styles.ownerSectionCard}>
            <header className={styles.ownerSectionHeader}>
              <h2 className={styles.ownerSectionTitle}>{t('ownerDashboard.issues.title')}</h2>
            </header>
            <OwnerIssuesList issues={issues} onStatusChange={handleStatusChange} />
          </section>
        </div>

        <aside className={styles.ownerSideColumn}>
          <OwnerSummaryCard
            occupied={occupancy.occupied}
            total={occupancy.total}
            free={occupancy.free}
            percent={occupancy.percent}
          />
          <OwnerActivityList items={mockOwnerActivity} />
          <OwnerHelpCard />
        </aside>
      </div>
    </OwnerLayout>
  )
}
