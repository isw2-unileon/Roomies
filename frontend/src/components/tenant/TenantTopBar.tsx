import { BellIcon, ChatBubbleLeftRightIcon, UserIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import type { TenantProfile } from '@/types/tenant'
import styles from '@/styles/TenantTopBar.module.css'

interface TenantTopBarProps {
    profile: TenantProfile
    unreadMessages: number
    unreadNotifications: number
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
                    <BellIcon className={styles.icon} aria-hidden="true" />
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
                    <ChatBubbleLeftRightIcon className={styles.icon} aria-hidden="true" />
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
                    <UserIcon className={styles.icon} aria-hidden="true" />
                </button>
            </div>
        </header>
    )
}
