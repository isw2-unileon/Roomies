import { PlusIcon } from '@heroicons/react/24/outline'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OwnerActivityList from '@/components/owner/OwnerActivityList'
import OwnerHelpCard from '@/components/owner/OwnerHelpCard'
import OwnerIssuesList from '@/components/owner/OwnerIssuesList'
import OwnerPaymentsList from '@/components/owner/OwnerPaymentsList'
import OwnerPropertyGrid from '@/components/owner/OwnerPropertyGrid'
import OwnerRequestsTable from '@/components/owner/OwnerRequestsTable'
import OwnerSidebar from '@/components/owner/OwnerSidebar'
import OwnerSummaryCard from '@/components/owner/OwnerSummaryCard'
import OwnerTopBar from '@/components/owner/OwnerTopBar'
import {
  mockOwnerActivity,
  mockOwnerIssues,
  mockOwnerPayments,
  mockOwnerProfile,
  mockOwnerProperties,
  mockOwnerRequests,
} from '@/mocks/ownerData'
import styles from '@/styles/OwnerDashboard.module.css'
import { paths } from '@/routes/paths'
import type { OwnerIssueStatus, OwnerNavTab } from '@/types/owner'

export default function OwnerDashboardPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<OwnerNavTab>('properties')
  const [issues, setIssues] = useState(mockOwnerIssues)
  const unreadMessages = 1
  const unreadNotifications = 3

  const occupancy = useMemo(() => {
    const total = mockOwnerProperties.reduce((acc, property) => acc + property.totalSpots, 0)
    const occupied = mockOwnerProperties.reduce((acc, property) => acc + property.occupiedSpots, 0)
    const free = total - occupied
    const percent = total > 0 ? Math.round((occupied / total) * 100) : 0
    return { total, occupied, free, percent }
  }, [])

  function handleStatusChange(id: string, status: OwnerIssueStatus) {
    setIssues((prev) => prev.map((issue) => (issue.id === id ? { ...issue, status } : issue)))
  }

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.desktopSidebar}>
          <OwnerSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            unreadNotifications={unreadNotifications}
          />
        </div>

        <div className={styles.mainColumn}>
          <OwnerTopBar
            profile={mockOwnerProfile}
            unreadMessages={unreadMessages}
            unreadNotifications={unreadNotifications}
          />

          <div className={styles.content}>
            <div className={styles.mobileSidebar}>
              <OwnerSidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                unreadNotifications={unreadNotifications}
              />
            </div>

            <div className={styles.ownerMainGrid}>
              <div className={styles.ownerPrimaryColumn}>
                <section className={styles.ownerSectionCard}>
                  <header className={styles.ownerSectionHeader}>
                    <h1 className={styles.ownerSectionTitle}>Mis pisos</h1>
                    <button
                      type="button"
                      className={styles.ownerPublishButton}
                      onClick={() => navigate(paths.ownerPublishProperty)}
                    >
                      <PlusIcon className={styles.ownerIconSmall} aria-hidden="true" />
                      Publicar piso
                    </button>
                  </header>
                  <OwnerPropertyGrid properties={mockOwnerProperties} />
                </section>

                <section className={styles.ownerSectionCard}>
                  <header className={styles.ownerSectionHeader}>
                    <h2 className={styles.ownerSectionTitle}>Solicitudes recibidas</h2>
                    <button type="button" className={styles.ownerTextButton}>Ver todas las solicitudes</button>
                  </header>
                  <OwnerRequestsTable requests={mockOwnerRequests} />
                </section>

                <section className={styles.ownerSectionCard}>
                  <header className={styles.ownerSectionHeader}>
                    <h2 className={styles.ownerSectionTitle}>Pagos recibidos</h2>
                  </header>
                  <OwnerPaymentsList payments={mockOwnerPayments} />
                </section>

                <section className={styles.ownerSectionCard}>
                  <header className={styles.ownerSectionHeader}>
                    <h2 className={styles.ownerSectionTitle}>Incidencias y mantenimiento</h2>
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
          </div>
        </div>
      </div>
    </main>
  )
}
