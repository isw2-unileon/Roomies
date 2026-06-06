import { useTranslation } from 'react-i18next'

import AuthNotice from '@/components/auth/AuthNotice'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import type { Notice } from '@/hooks/useNotice'
import styles from '@/styles/TenantProfile.module.css'

interface TenantProfilePreferencesCardProps {
  onPasswordReset: () => void
  isSendingReset: boolean
  isLoading: boolean
  notice: Notice
}

export default function TenantProfilePreferencesCard({
  onPasswordReset,
  isSendingReset,
  isLoading,
  notice,
}: TenantProfilePreferencesCardProps) {
  const { t } = useTranslation()

  return (
    <section className={styles.card} aria-labelledby="tenant-profile-preferences-title">
      <div>
        <span className={styles.cardEyebrow}>{t('tenantProfile.preferences.kicker')}</span>
        <h2 id="tenant-profile-preferences-title" className={styles.cardTitle}>
          {t('tenantProfile.preferences.title')}
        </h2>
      </div>
      <p className={styles.cardText}>{t('tenantProfile.preferences.description')}</p>

      <div className={styles.preferenceRow}>
        <div>
          <h3 className={styles.preferenceTitle}>{t('tenantProfile.preferences.languageTitle')}</h3>
          <p className={styles.preferenceText}>{t('tenantProfile.preferences.languageDescription')}</p>
        </div>
        <LanguageSwitcher />
      </div>

      <div className={styles.preferenceRow}>
        <div>
          <h3 className={styles.preferenceTitle}>{t('tenantProfile.preferences.passwordTitle')}</h3>
          <p className={styles.preferenceText}>{t('tenantProfile.preferences.passwordDescription')}</p>
        </div>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onPasswordReset}
          disabled={isSendingReset || isLoading}
        >
          {isSendingReset ? t('tenantProfile.preferences.passwordSending') : t('tenantProfile.preferences.passwordAction')}
        </button>
      </div>

      <AuthNotice kind={notice.kind} message={notice.message} />
    </section>
  )
}
