import { useTranslation } from 'react-i18next'
import OwnerDashboardLayout from '@/components/owner/OwnerDashboardLayout'
import OwnerRequestsTable from '@/components/owner/OwnerRequestsTable'
import { mockOwnerRequests } from '@/mocks/ownerData'
import styles from '@/styles/OwnerDashboard.module.css'

export default function OwnerApplications() {
  const { t } = useTranslation()

  return (
    <OwnerDashboardLayout>
      <section className={styles.ownerSectionCard}>
        <header className={styles.ownerSectionHeader}>
          <div>
            <h1 className={styles.ownerSectionTitle}>{t('ownerDashboard.applications.title')}</h1>
            <p className={styles.ownerSectionSubtitle}>{t('ownerDashboard.applications.subtitle')}</p>
          </div>
        </header>
        <OwnerRequestsTable requests={mockOwnerRequests} />
      </section>
    </OwnerDashboardLayout>
  )
}
