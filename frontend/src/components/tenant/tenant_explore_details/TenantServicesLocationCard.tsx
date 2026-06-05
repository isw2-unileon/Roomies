import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'
import { useTranslation } from 'react-i18next'

import styles from '@/styles/TenantExploreDetail.module.css'
import type { TenantPropertyRules } from '@/types/tenant'

interface TenantServicesLocationCardProps {
  rules?: TenantPropertyRules
}

export default function TenantServicesLocationCard({ rules }: TenantServicesLocationCardProps) {
  const { t } = useTranslation()

  const ruleItems: { label: string; allowed: boolean | null }[] = [
    { label: t('tenantDashboard.detail.services.smokingAllowed'), allowed: rules?.smokingAllowed ?? null },
    { label: t('tenantDashboard.detail.services.petsAllowed'), allowed: rules?.petsAllowed ?? null },
    { label: t('tenantDashboard.detail.services.studentsAllowed'), allowed: rules?.studentsAllowed ?? null },
  ]

  const definedRules = ruleItems.filter((r) => r.allowed !== null)
  const hasContent = definedRules.length > 0 || rules?.notes

  if (!hasContent) {
    return null
  }

  return (
    <section className={styles.servicesCard}>
      <h2 className={styles.cardTitle}>{t('tenantDashboard.detail.services.title')}</h2>

      {definedRules.length > 0 && (
        <div className={styles.rulesGrid}>
          {definedRules.map((rule) => (
            <span
              key={rule.label}
              className={`${styles.ruleBadge} ${rule.allowed ? styles.ruleAllowed : styles.ruleDenied}`}
            >
              {rule.allowed ? (
                <CheckCircleIcon className={styles.ruleIcon} aria-hidden="true" />
              ) : (
                <XCircleIcon className={styles.ruleIcon} aria-hidden="true" />
              )}
              {rule.label}
            </span>
          ))}
        </div>
      )}

      {rules?.notes && (
        <div className={styles.notesBlock}>
          <p className={styles.label}>{t('tenantDashboard.detail.services.notes')}</p>
          <p className={styles.notesText}>{rules.notes}</p>
        </div>
      )}
    </section>
  )
}
