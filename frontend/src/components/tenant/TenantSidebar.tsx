import type { ReactNode } from 'react'
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

function MenuIcon() {
    return (
        <svg className={styles.iconMedium} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
    )
}

function ExploreIcon() {
    return (
        <svg className={styles.iconSmall} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
    )
}

function ApplicationsIcon() {
    return (
        <svg className={styles.iconSmall} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 2.25A2.25 2.25 0 0112 16.5v2.25a2.25 2.25 0 01-2.247 2.188H8.376a2.25 2.25 0 01-2.247-2.188V8.25a2.25 2.25 0 012.248-2.188h2.004z" />
        </svg>
    )
}

function GroupsIcon() {
    return (
        <svg className={styles.iconSmall} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9 9 0 01-9-9 9 9 0 019-9 9 9 0 019 9c0 1.66-1.25 3-2.5 3.5 1.25.5 2.5 1.5 2.5 3.5v.72a27.34 27.34 0 01-2.5 0v-.72c0-1.25.75-2 1.5-2.5.25-.5.5-1 1-1.5a9 9 0 01-9 0zM12 12.75c.67 0 1.25.5 1.25 1.25v2.75c0 .75-.5 1.25-1.25 1.25H10.5a1.25 1.25 0 01-1.25-1.25V15c0-.75.5-1.25 1.25-1.25h1.5z" />
        </svg>
    )
}

function MessagesIcon() {
    return (
        <svg className={styles.iconSmall} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 5.975 5.975 0 01-2.5-2.5V12a5.973 5.973 0 012.5-4.875A5.973 5.973 0 0112 6.25c4.97 0 9 3.694 9 8.25z" />
        </svg>
    )
}

function NotificationsIcon() {
    return (
        <svg className={styles.iconSmall} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.75l-2.955-4.5a2.25 2.25 0 00-2.955-1.265 8.22 8.22 0 00-5.453.826 8.22 8.22 0 00-.826 5.453l2.955 4.5v.75z" />
        </svg>
    )
}

function ProfileIcon() {
    return (
        <svg className={styles.iconSmall} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    )
}

function PlusIcon() {
    return (
        <svg className={styles.iconSmall} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m6.75-6.75h-15" />
        </svg>
    )
}

function ReferIcon() {
    return (
        <svg className={styles.iconMedium} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.75a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.25 2.25 0 0114.25 2.625H9.75A2.25 2.25 0 017.5 4.875m0 9a2.25 2.25 0 012.25-2.25h4.5A2.25 2.25 0 0116.5 13.875m0-9A2.25 2.25 0 0118.75 2.625h-4.5A2.25 2.25 0 0112 4.875" />
        </svg>
    )
}

const tabs: { id: SidebarTab; labelKey: string; Icon: () => ReactNode }[] = [
    { id: 'explore', labelKey: 'tenantDashboard.sidebar.explore', Icon: ExploreIcon },
    { id: 'applications', labelKey: 'tenantDashboard.sidebar.applications', Icon: ApplicationsIcon },
    { id: 'groups', labelKey: 'tenantDashboard.sidebar.groups', Icon: GroupsIcon },
    { id: 'messages', labelKey: 'tenantDashboard.sidebar.messages', Icon: MessagesIcon },
    { id: 'notifications', labelKey: 'tenantDashboard.sidebar.notifications', Icon: NotificationsIcon },
    { id: 'profile', labelKey: 'tenantDashboard.sidebar.profile', Icon: ProfileIcon },
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
                    <MenuIcon />
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
                        <Icon />
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
                    <PlusIcon />
                    {t('tenantDashboard.sidebar.publish')}
                </button>
            </div>

            <div className={styles.referCard}>
                <div className={styles.referContent}>
                    <div className={styles.referIcon}>
                        <ReferIcon />
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
