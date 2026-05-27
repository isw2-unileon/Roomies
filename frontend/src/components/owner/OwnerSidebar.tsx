import type { ComponentType, SVGProps } from 'react'
import {
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ClipboardDocumentListIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import logo from '@/assets/logo.png'
import { paths } from '@/routes/paths'
import type { OwnerNavTab } from '@/types/owner'
import styles from '@/styles/OwnerDashboard.module.css'

interface OwnerSidebarProps {
  isCollapsed: boolean
  onToggleCollapsed?: () => void
  onNavigate?: () => void
  onLogout?: () => void
  unreadMessages: number
  unreadNotifications: number
  showCollapseToggle?: boolean
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const tabs: { id: OwnerNavTab; labelKey: string; path: string; Icon: IconComponent }[] = [
  { id: 'properties', labelKey: 'ownerDashboard.sidebar.properties', path: paths.ownerProperties, Icon: BuildingOffice2Icon },
  { id: 'applications', labelKey: 'ownerDashboard.sidebar.applications', path: paths.ownerApplications, Icon: ClipboardDocumentListIcon },
  { id: 'messages', labelKey: 'ownerDashboard.sidebar.messages', path: paths.ownerMessages, Icon: ChatBubbleLeftRightIcon },
  { id: 'notifications', labelKey: 'ownerDashboard.sidebar.notifications', path: paths.ownerNotifications, Icon: BellIcon },
  { id: 'profile', labelKey: 'ownerDashboard.sidebar.profile', path: paths.ownerProfile, Icon: UserIcon },
]

export default function OwnerSidebar({
  isCollapsed,
  onToggleCollapsed,
  onNavigate,
  onLogout,
  unreadMessages,
  unreadNotifications,
  showCollapseToggle = true,
}: OwnerSidebarProps) {
  const { t } = useTranslation()
  const ToggleIcon = isCollapsed ? ChevronDoubleRightIcon : ChevronDoubleLeftIcon
  const toggleLabel = isCollapsed
    ? t('ownerDashboard.sidebar.showMenu')
    : t('ownerDashboard.sidebar.hideMenu')

  return (
    <aside
      className={`${styles.ownerSidebar} ${isCollapsed ? styles.ownerSidebarCollapsed : ''}`}
      aria-label={t('ownerDashboard.sidebar.panel')}
    >
      <div className={styles.ownerSidebarHeader}>
        <div className={styles.ownerBrand}>
          <span className={styles.ownerLogoFrame}>
            <img src={logo} alt={t('common.appName')} className={styles.ownerLogo} />
          </span>
          <span className={styles.ownerBrandName}>{t('common.appName')}</span>
        </div>

        {showCollapseToggle ? (
          <button
            type="button"
            className={styles.ownerMenuButton}
            aria-label={toggleLabel}
            aria-expanded={!isCollapsed}
            aria-controls="owner-sidebar-navigation"
            onClick={onToggleCollapsed}
          >
            <ToggleIcon className={styles.ownerIconMedium} aria-hidden="true" />
          </button>
        ) : (
          <Bars3Icon className={styles.ownerMobileOnlyIcon} aria-hidden="true" />
        )}
      </div>

      <nav id="owner-sidebar-navigation" className={styles.ownerNav} aria-label={t('ownerDashboard.sidebar.navigation')}>
        {tabs.map(({ id, labelKey, path, Icon }) => (
          <NavLink
            key={id}
            to={path}
            onClick={onNavigate}
            title={t(labelKey)}
            aria-label={t(labelKey)}
            className={({ isActive }) => `${styles.ownerNavButton} ${isActive ? styles.ownerNavButtonActive : ''}`}
          >
            <Icon className={styles.ownerIconSmall} aria-hidden="true" />
            <span className={styles.ownerNavLabel}>{t(labelKey)}</span>
            {id === 'messages' && unreadMessages > 0 && (
              <span className={styles.ownerNavBadge}>{unreadMessages}</span>
            )}
            {id === 'notifications' && unreadNotifications > 0 && (
              <span className={styles.ownerNavBadge}>{unreadNotifications}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={styles.ownerLogoutWrap}>
        <button
          type="button"
          className={styles.ownerLogoutButton}
          title={t('ownerDashboard.sidebar.logout')}
          aria-label={t('ownerDashboard.sidebar.logout')}
          onClick={onLogout}
        >
          <ArrowLeftOnRectangleIcon className={styles.ownerIconSmall} aria-hidden="true" />
          <span className={styles.ownerLogoutLabel}>{t('ownerDashboard.sidebar.logout')}</span>
        </button>
      </div>
    </aside>
  )
}
