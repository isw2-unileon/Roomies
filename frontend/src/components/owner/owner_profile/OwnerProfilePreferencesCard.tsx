import { useTranslation } from 'react-i18next'

import AuthNotice from '@/components/auth/AuthNotice'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import type { Notice } from '@/hooks/useNotice'
import styles from '@/styles/OwnerProfile.module.css'

interface OwnerProfilePreferencesCardProps {
  onPasswordReset: () => void
  isSendingReset: boolean
  isLoading: boolean
  notice: Notice
}

export default function OwnerProfilePreferencesCard({
  onPasswordReset,
  isSendingReset,
  isLoading,
  notice,
}: OwnerProfilePreferencesCardProps) {
  const { t } = useTranslation()

  return (
    <section className={styles.card} aria-labelledby="owner-profile-preferences-title">
      <div>
        <span className={styles.cardEyebrow}>{t('ownerProfile.preferences.kicker')}</span>
        <h2 id="owner-profile-preferences-title" className={styles.cardTitle}>
          {t('ownerProfile.preferences.title')}
        </h2>
      </div>
      <p className={styles.cardText}>{t('ownerProfile.preferences.description')}</p>

      <div className={styles.preferenceRow}>
        <div>
          <h3 className={styles.preferenceTitle}>{t('ownerProfile.preferences.languageTitle')}</h3>
          <p className={styles.preferenceText}>{t('ownerProfile.preferences.languageDescription')}</p>
        </div>
        <LanguageSwitcher />
      </div>

      <div className={styles.preferenceRow}>
        <div>
          <h3 className={styles.preferenceTitle}>{t('ownerProfile.preferences.passwordTitle')}</h3>
          <p className={styles.preferenceText}>{t('ownerProfile.preferences.passwordDescription')}</p>
        </div>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onPasswordReset}
          disabled={isSendingReset || isLoading}
        >
          {isSendingReset ? t('ownerProfile.preferences.passwordSending') : t('ownerProfile.preferences.passwordAction')}
        </button>
      </div>

      <AuthNotice kind={notice.kind} message={notice.message} />
    </section>
  )
}
