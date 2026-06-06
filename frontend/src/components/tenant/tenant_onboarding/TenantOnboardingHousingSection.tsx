import { useTranslation } from 'react-i18next'

import FormField from '@/components/auth/FormField'
import styles from '@/styles/auth.module.css'

interface TenantOnboardingHousingSectionProps {
  budgetMax: string
  onBudgetMaxChange: (value: string) => void
  preferredArea: string
  onPreferredAreaChange: (value: string) => void
  pets: boolean
  onPetsChange: (value: boolean) => void
  smoking: boolean
  onSmokingChange: (value: boolean) => void
}

export default function TenantOnboardingHousingSection({
  budgetMax,
  onBudgetMaxChange,
  preferredArea,
  onPreferredAreaChange,
  pets,
  onPetsChange,
  smoking,
  onSmokingChange,
}: TenantOnboardingHousingSectionProps) {
  const { t } = useTranslation()

  return (
    <section className={styles.form} aria-label={t('auth.tenantOnboarding.sections.housing')}>
      <h3 className={styles.roleTitle}>{t('auth.tenantOnboarding.sections.housing')}</h3>

      <FormField
        id="budget-max"
        label={t('auth.tenantOnboarding.budgetMaxLabel')}
        type="number"
        min={1}
        value={budgetMax}
        onChange={(event) => onBudgetMaxChange(event.target.value)}
        required
      />

      <FormField
        id="preferred-area"
        label={t('auth.tenantOnboarding.preferredAreaLabel')}
        type="text"
        value={preferredArea}
        onChange={(event) => onPreferredAreaChange(event.target.value)}
        placeholder={t('auth.tenantOnboarding.preferredAreaPlaceholder')}
        required
      />

      <div className={styles.checkboxGrid}>
        <label className={styles.checkboxCard}>
          <input type="checkbox" checked={pets} onChange={(event) => onPetsChange(event.target.checked)} className={styles.roleRadio} />
          <span>{t('auth.tenantOnboarding.petsLabel')}</span>
        </label>

        <label className={styles.checkboxCard}>
          <input type="checkbox" checked={smoking} onChange={(event) => onSmokingChange(event.target.checked)} className={styles.roleRadio} />
          <span>{t('auth.tenantOnboarding.smokerLabel')}</span>
        </label>
      </div>
    </section>
  )
}
