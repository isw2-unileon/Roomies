import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import OwnerSidebar from '@/components/owner/OwnerSidebar'
import OwnerTopBar from '@/components/owner/OwnerTopBar'
import { mockOwnerProfile } from '@/mocks/ownerData'
import { paths } from '@/routes/paths'
import { logout } from '@/services/authService'
import styles from '@/styles/OwnerDashboard.module.css'
import type { OwnerNavTab } from '@/types/owner'

interface OwnerDashboardLayoutProps {
  activeTab: OwnerNavTab
  onTabChange: (tab: OwnerNavTab) => void
  children: ReactNode
}

export default function OwnerDashboardLayout({ activeTab, onTabChange, children }: OwnerDashboardLayoutProps) {
  const navigate = useNavigate()
  const unreadMessages = 1
  const unreadNotifications = 3

  async function handleLogout() {
    try {
      await logout()
    } finally {
      navigate(paths.login, { replace: true })
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.desktopSidebar}>
          <OwnerSidebar
            activeTab={activeTab}
            onTabChange={onTabChange}
            onLogout={handleLogout}
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
                onLogout={handleLogout}
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
