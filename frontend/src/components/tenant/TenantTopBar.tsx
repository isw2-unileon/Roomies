import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import type { TenantProfile } from '@/types/tenant'
import styles from '@/styles/TenantTopBar.module.css'

interface TenantTopBarProps {
    profile: TenantProfile
    unreadMessages: number
    unreadNotifications: number
}

function BellIcon() {
    return (
        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.75l-2.955-4.5a2.25 2.25 0 00-2.955-1.265 8.22 8.22 0 00-5.453.826 8.22 8.22 0 00-.826 5.453l2.955 4.5v.75z" />
        </svg>
    )
}

function ChatIcon() {
    return (
        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 5.975 5.975 0 01-2.5-2.5V12a5.973 5.973 0 012.5-4.875A5.973 5.973 0 0112 6.25c4.97 0 9 3.694 9 8.25z" />
        </svg>
    )
}

function UserIcon() {
    return (
        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    )
}

export default function TenantTopBar({ profile, unreadMessages, unreadNotifications }: TenantTopBarProps) {
    const { t } = useTranslation()

    return (
        <header className={styles.topBar}>
            <div className={styles.areaInfo}>
                <span className={styles.areaLabel}>{t('tenantDashboard.topBar.area')}</span>
                <span className={styles.areaValue}>
                    {t(profile.preferredAreaKey)}
                </span>
            </div>

            <div className={styles.actions}>
                <div className={styles.languageSwitcher}>
                    <LanguageSwitcher />
                </div>

                <button
                    type="button"
                    className={styles.iconButton}
                    title={t('tenantDashboard.topBar.notifications')}
                    aria-label={t('tenantDashboard.topBar.notifications')}
                >
                    <BellIcon />
                    {unreadNotifications > 0 && (
                        <span className={styles.counter}>
                            {unreadNotifications}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    className={styles.iconButton}
                    title={t('tenantDashboard.topBar.messages')}
                    aria-label={t('tenantDashboard.topBar.messages')}
                >
                    <ChatIcon />
                    {unreadMessages > 0 && (
                        <span className={styles.counter}>
                            {unreadMessages}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    className={styles.profileButton}
                    title={t('tenantDashboard.topBar.profile')}
                    aria-label={t('tenantDashboard.topBar.profile')}
                >
                    <div className={styles.avatar}>
                        {profile.name
                            .split(' ')
                            .map((p) => p[0])
                            .join('')
                            .slice(0, 2)}
                    </div>
                    <span className={styles.profileText}>
                        <span className={styles.profileName}>{profile.name}</span>
                        <span className={styles.profileRole}>{t('tenantDashboard.topBar.role')}</span>
                    </span>
                    <UserIcon />
                </button>
            </div>
        </header>
    )
}
