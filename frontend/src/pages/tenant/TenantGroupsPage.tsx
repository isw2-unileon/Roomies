import { useTranslation } from 'react-i18next'

import TenantLayout from '@/components/tenant/TenantLayout'
import styles from '@/styles/TenantPlaceholder.module.css'

export default function TenantGroupsPage() {
  const { t } = useTranslation()

  return (
    <TenantLayout>
      <section className={styles.placeholder}>
        <span className={styles.kicker}>{t('tenantDashboard.placeholder.kicker')}</span>
        <h1 className={styles.title}>{t('tenantDashboard.sidebar.groups')}</h1>
        <p className={styles.subtitle}>{t('tenantDashboard.placeholder.subtitle')}</p>
      </section>
    </TenantLayout>
  )
}
