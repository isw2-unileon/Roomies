import { useTranslation } from 'react-i18next'

import styles from '@/styles/TenantExploreDetail.module.css'
import type { TenantProperty, TenantPropertyRules } from '@/types/tenant'

interface TenantServicesLocationCardProps {
  property: TenantProperty
  rules?: TenantPropertyRules
}

export default function TenantServicesLocationCard({ property, rules }: TenantServicesLocationCardProps) {
  const { t } = useTranslation()
  const services = [
    t('tenantDashboard.detail.services.wifi'),
    t('tenantDashboard.detail.services.heating'),
    rules?.petsAllowed ? t('tenantDashboard.detail.services.petsAllowed') : '',
    rules?.smokingAllowed ? t('tenantDashboard.detail.services.smokingAllowed') : '',
    rules?.preferredSchedule ? t('tenantDashboard.detail.services.schedule', { schedule: rules.preferredSchedule }) : '',
    rules?.cleanlinessExpectation ? t('tenantDashboard.detail.services.cleanliness', { cleanliness: rules.cleanlinessExpectation }) : '',
  ].filter(Boolean)

  return (
    <section className={styles.servicesCard}>
      <h2 className={styles.cardTitle}>{t('tenantDashboard.detail.services.title')}</h2>
      <div className={styles.servicesGrid}>
        {services.map((service) => (
          <span key={service} className={styles.serviceBadge}>{service}</span>
        ))}
      </div>
      <p className={styles.description}>{t('tenantDashboard.detail.services.location', { address: t(property.addressKey) })}</p>
    </section>
  )
}
