import { useState, type ReactNode } from 'react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import OwnerSidebar from '@/components/owner/OwnerSidebar'
import { paths } from '@/routes/paths'
import { logout } from '@/services/authService'
import styles from '@/styles/OwnerDashboard.module.css'

const UNREAD_MESSAGES = 1
const UNREAD_NOTIFICATIONS = 3

interface OwnerDashboardLayoutProps {
  children: ReactNode
}

export default function OwnerDashboardLayout({ children }: OwnerDashboardLayoutProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  async function handleLogout() {
    try {
      await logout()
    } finally {
      navigate(paths.login, { replace: true })
    }
  }

  return (
    <div className={styles.page}>
      <a href="#owner-main" className={styles.skipLink}>
        {t('ownerDashboard.layout.skipToContent')}
      </a>

      <div className={styles.layout}>
        <div className={styles.desktopSidebar}>
          <OwnerSidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
            onLogout={handleLogout}
            unreadMessages={UNREAD_MESSAGES}
            unreadNotifications={UNREAD_NOTIFICATIONS}
          />
        </div>

        <div className={styles.mainColumn}>
          <header className={styles.utilityBar}>
            <button
              type="button"
              className={styles.mobileMenuButton}
              aria-label={t('ownerDashboard.sidebar.menu')}
              aria-expanded={isMobileSidebarOpen}
              aria-controls="owner-mobile-sidebar"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Bars3Icon className={styles.ownerIconMedium} aria-hidden="true" />
            </button>
          </header>

          <main id="owner-main" className={styles.content}>
            {children}
          </main>
        </div>
      </div>

      {isMobileSidebarOpen ? (
        <div className={styles.mobileLayer} role="presentation">
          <button
            type="button"
            className={styles.mobileBackdrop}
            aria-label={t('ownerDashboard.layout.closeMenu')}
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div id="owner-mobile-sidebar" className={styles.mobilePanel}>
            <button
              type="button"
              className={styles.mobileCloseButton}
              aria-label={t('ownerDashboard.layout.closeMenu')}
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <XMarkIcon className={styles.ownerIconMedium} aria-hidden="true" />
            </button>
            <OwnerSidebar
              isCollapsed={false}
              showCollapseToggle={false}
              onToggleCollapsed={() => undefined}
              onNavigate={() => setIsMobileSidebarOpen(false)}
              onLogout={handleLogout}
              unreadMessages={UNREAD_MESSAGES}
              unreadNotifications={UNREAD_NOTIFICATIONS}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
