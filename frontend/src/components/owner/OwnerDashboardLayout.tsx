import type { ReactNode } from 'react'
import OwnerSidebar from '@/components/owner/OwnerSidebar'
import OwnerTopBar from '@/components/owner/OwnerTopBar'
import { mockOwnerProfile } from '@/mocks/ownerData'
import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerNavTab } from '@/types/owner'

interface OwnerDashboardLayoutProps {
  activeTab: OwnerNavTab
  onTabChange: (tab: OwnerNavTab) => void
  children: ReactNode
}

export default function OwnerDashboardLayout({ activeTab, onTabChange, children }: OwnerDashboardLayoutProps) {
  const unreadMessages = 1
  const unreadNotifications = 3

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.desktopSidebar}>
          <OwnerSidebar
            activeTab={activeTab}
            onTabChange={onTabChange}
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
                onTabChange={onTabChange}
                unreadNotifications={unreadNotifications}
              />
            </div>

            {children}
          </div>
        </div>
      </div>
    </main>
  )
}
