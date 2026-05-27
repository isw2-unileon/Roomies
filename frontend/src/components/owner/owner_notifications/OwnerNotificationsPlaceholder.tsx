import { useTranslation } from 'react-i18next'
import styles from '@/styles/OwnerDashboard.module.css'

export default function OwnerNotificationsPlaceholder() {
  const { t } = useTranslation()

  return (
    <section className={styles.ownerPlaceholder}>
      <span className={styles.ownerPlaceholderKicker}>{t('ownerDashboard.placeholder.kicker')}</span>
      <h1 className={styles.ownerPlaceholderTitle}>{t('ownerDashboard.sidebar.notifications')}</h1>
      <p className={styles.ownerPlaceholderSubtitle}>{t('ownerDashboard.placeholder.subtitle')}</p>
    </section>
  )
}
