import type { ComponentType, SVGProps } from 'react'
import {
    Bars3Icon,
    BellIcon,
    ChatBubbleLeftRightIcon,
    ClipboardDocumentListIcon,
    GiftIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    UserGroupIcon,
    UserIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import logo from '@/assets/logo.png'
import styles from '@/styles/TenantSidebar.module.css'

type SidebarTab = 'explore' | 'applications' | 'groups' | 'messages' | 'notifications' | 'profile'

interface TenantSidebarProps {
    activeTab: SidebarTab
    onTabChange: (tab: SidebarTab) => void
    unreadMessages: number
    unreadNotifications: number
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

const tabs: { id: SidebarTab; labelKey: string; Icon: IconComponent }[] = [
    { id: 'explore', labelKey: 'tenantDashboard.sidebar.explore', Icon: MagnifyingGlassIcon },
    { id: 'applications', labelKey: 'tenantDashboard.sidebar.applications', Icon: ClipboardDocumentListIcon },
    { id: 'groups', labelKey: 'tenantDashboard.sidebar.groups', Icon: UserGroupIcon },
    { id: 'messages', labelKey: 'tenantDashboard.sidebar.messages', Icon: ChatBubbleLeftRightIcon },
    { id: 'notifications', labelKey: 'tenantDashboard.sidebar.notifications', Icon: BellIcon },
    { id: 'profile', labelKey: 'tenantDashboard.sidebar.profile', Icon: UserIcon },
]

export default function TenantSidebar({ activeTab, onTabChange, unreadMessages, unreadNotifications }: TenantSidebarProps) {
    const { t } = useTranslation()

    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <button
                    type="button"
                    className={styles.menuButton}
                    aria-label={t('tenantDashboard.sidebar.menu')}
                >
                    <Bars3Icon className={styles.iconMedium} aria-hidden="true" />
                </button>
                <div className={styles.brand}>
                    <span className={styles.logoFrame}>
                        <img src={logo} alt={t('common.appName')} className={styles.logo} />
                    </span>
                    <span className={styles.brandName}>{t('common.appName')}</span>
                </div>
            </div>

            <nav className={styles.nav}>
                {tabs.map(({ id, labelKey, Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onTabChange(id)}
                        className={`${styles.navButton} ${activeTab === id ? styles.navButtonActive : ''}`}
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
                    </button>
                ))}
            </nav>

            <div className={styles.publishArea}>
                <button
                    type="button"
                    className={styles.publishButton}
                >
                    <PlusIcon className={styles.iconSmall} aria-hidden="true" />
                    {t('tenantDashboard.sidebar.publish')}
                </button>
            </div>

            <div className={styles.referCard}>
                <div className={styles.referContent}>
                    <div className={styles.referIcon}>
                        <GiftIcon className={styles.iconMedium} aria-hidden="true" />
                    </div>
                    <div className={styles.referText}>
                        <p className={styles.referTitle}>{t('tenantDashboard.sidebar.referTitle')}</p>
                        <p className={styles.referSubtitle}>{t('tenantDashboard.sidebar.referSubtitle')}</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
