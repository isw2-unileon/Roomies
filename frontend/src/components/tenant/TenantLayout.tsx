import { useState, type ReactNode } from 'react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import TenantSidebar from '@/components/tenant/TenantSidebar'
import styles from '@/styles/TenantLayout.module.css'

const UNREAD_MESSAGES = 2
const UNREAD_NOTIFICATIONS = 1

interface TenantLayoutProps {
  children: ReactNode
}

export default function TenantLayout({ children }: TenantLayoutProps) {
  const { t } = useTranslation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className={styles.shell}>
      <a href="#tenant-main" className={styles.skipLink}>
        {t('tenantDashboard.layout.skipToContent')}
      </a>

      <div className={styles.desktopSidebar}>
        <TenantSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
          unreadMessages={UNREAD_MESSAGES}
          unreadNotifications={UNREAD_NOTIFICATIONS}
        />
      </div>

      <div className={styles.mainArea}>
        <header className={styles.utilityBar}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            aria-label={t('tenantDashboard.sidebar.menu')}
            aria-expanded={isMobileSidebarOpen}
            aria-controls="tenant-mobile-sidebar"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Bars3Icon className={styles.icon} aria-hidden="true" />
          </button>
        </header>

        <main id="tenant-main" className={styles.content}>
          {children}
        </main>
      </div>

      {isMobileSidebarOpen ? (
        <div className={styles.mobileLayer} role="presentation">
          <button
            type="button"
            className={styles.mobileBackdrop}
            aria-label={t('tenantDashboard.layout.closeMenu')}
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div id="tenant-mobile-sidebar" className={styles.mobilePanel}>
            <button
              type="button"
              className={styles.mobileCloseButton}
              aria-label={t('tenantDashboard.layout.closeMenu')}
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <XMarkIcon className={styles.icon} aria-hidden="true" />
            </button>
            <TenantSidebar
              isCollapsed={false}
              showCollapseToggle={false}
              onToggleCollapsed={() => undefined}
              onNavigate={() => setIsMobileSidebarOpen(false)}
              unreadMessages={UNREAD_MESSAGES}
              unreadNotifications={UNREAD_NOTIFICATIONS}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
