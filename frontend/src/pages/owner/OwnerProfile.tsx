import { useTranslation } from 'react-i18next'
import OwnerDashboardLayout from '@/components/owner/OwnerDashboardLayout'
import styles from '@/styles/OwnerDashboard.module.css'

export default function OwnerProfile() {
  const { t } = useTranslation()

  return (
    <OwnerDashboardLayout>
      <section className={styles.ownerPlaceholder}>
        <span className={styles.ownerPlaceholderKicker}>{t('ownerDashboard.placeholder.kicker')}</span>
        <h1 className={styles.ownerPlaceholderTitle}>{t('ownerDashboard.sidebar.profile')}</h1>
        <p className={styles.ownerPlaceholderSubtitle}>{t('ownerDashboard.placeholder.subtitle')}</p>
      </section>
    </OwnerDashboardLayout>
  )
}
