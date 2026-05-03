import { useRef, useState, type ComponentType, type SVGProps } from 'react'
import {
    Bars3Icon,
    BellIcon,
    ChatBubbleLeftRightIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ClipboardDocumentListIcon,
    GiftIcon,
    MagnifyingGlassIcon,
    UserGroupIcon,
    UserIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import logo from '@/assets/logo.png'
import TenantInviteDialog from '@/components/common/InviteDialog'
import { paths } from '@/routes/paths'
import styles from '@/styles/TenantSidebar.module.css'

type SidebarTab = 'explore' | 'applications' | 'groups' | 'messages' | 'notifications' | 'profile'

interface TenantSidebarProps {
    isCollapsed: boolean
    onToggleCollapsed?: () => void
    onNavigate?: () => void
    unreadMessages: number
    unreadNotifications: number
    showCollapseToggle?: boolean
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const tabs: { id: SidebarTab; labelKey: string; path: string; Icon: IconComponent }[] = [
    { id: 'explore', labelKey: 'tenantDashboard.sidebar.explore', path: paths.tenantExplore, Icon: MagnifyingGlassIcon },
    { id: 'applications', labelKey: 'tenantDashboard.sidebar.applications', path: paths.tenantApplications, Icon: ClipboardDocumentListIcon },
    { id: 'groups', labelKey: 'tenantDashboard.sidebar.groups', path: paths.tenantGroups, Icon: UserGroupIcon },
    { id: 'messages', labelKey: 'tenantDashboard.sidebar.messages', path: paths.tenantMessages, Icon: ChatBubbleLeftRightIcon },
    { id: 'notifications', labelKey: 'tenantDashboard.sidebar.notifications', path: paths.tenantNotifications, Icon: BellIcon },
    { id: 'profile', labelKey: 'tenantDashboard.sidebar.profile', path: paths.tenantProfile, Icon: UserIcon },
]

export default function TenantSidebar({
    isCollapsed,
    onToggleCollapsed,
    onNavigate,
    unreadMessages,
    unreadNotifications,
    showCollapseToggle = true,
}: TenantSidebarProps) {
    const { t } = useTranslation()
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
    const inviteButtonRef = useRef<HTMLButtonElement>(null)
    const ToggleIcon = isCollapsed ? ChevronDoubleRightIcon : ChevronDoubleLeftIcon
    const toggleLabel = isCollapsed
        ? t('tenantDashboard.sidebar.showMenu')
        : t('tenantDashboard.sidebar.hideMenu')

    function closeInviteDialog() {
        setIsInviteDialogOpen(false)
        inviteButtonRef.current?.focus()
    }

    return (
        <aside
            className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ''}`}
            aria-label={t('tenantDashboard.sidebar.panel')}
        >
            <div className={styles.header}>
                <div className={styles.brand}>
                    <span className={styles.logoFrame}>
                        <img src={logo} alt={t('common.appName')} className={styles.logo} />
                    </span>
                    <span className={styles.brandName}>{t('common.appName')}</span>
                </div>

                {showCollapseToggle ? (
                    <button
                        type="button"
                        className={styles.menuButton}
                        aria-label={toggleLabel}
                        aria-expanded={!isCollapsed}
                        aria-controls="tenant-sidebar-navigation"
                        onClick={onToggleCollapsed}
                    >
                        <ToggleIcon className={styles.iconMedium} aria-hidden="true" />
                    </button>
                ) : (
                    <Bars3Icon className={styles.mobileOnlyIcon} aria-hidden="true" />
                )}
            </div>

            <nav id="tenant-sidebar-navigation" className={styles.nav} aria-label={t('tenantDashboard.sidebar.navigation')}>
                {tabs.map(({ id, labelKey, path, Icon }) => (
                    <NavLink
                        key={id}
                        to={path}
                        onClick={onNavigate}
                        title={t(labelKey)}
                        aria-label={t(labelKey)}
                        className={({ isActive }) => `${styles.navButton} ${isActive ? styles.navButtonActive : ''}`}
                    >
                        <Icon className={styles.iconSmall} aria-hidden="true" />
                        <span className={styles.navLabel}>{t(labelKey)}</span>
                        {id === 'messages' && unreadMessages > 0 && (
                            <span className={styles.badge}>
                                {unreadMessages}
                            </span>
                        )}
                        {id === 'notifications' && unreadNotifications > 0 && (
                            <span className={styles.badge}>
                                {unreadNotifications}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className={styles.footer}>
                <button
                    ref={inviteButtonRef}
                    type="button"
                    className={styles.referCard}
                    aria-haspopup="dialog"
                    aria-expanded={isInviteDialogOpen}
                    onClick={() => setIsInviteDialogOpen(true)}
                >
                    <div className={styles.referContent}>
                        <div className={styles.referIcon}>
                            <GiftIcon className={styles.iconMedium} aria-hidden="true" />
                        </div>
                        <div className={styles.referText}>
                            <p className={styles.referTitle}>{t('tenantDashboard.sidebar.referTitle')}</p>
                            <p className={styles.referSubtitle}>{t('tenantDashboard.sidebar.referSubtitle')}</p>
                        </div>
                    </div>
                </button>
            </div>

            {isInviteDialogOpen ? <TenantInviteDialog onClose={closeInviteDialog} /> : null}
        </aside>
    )
}
