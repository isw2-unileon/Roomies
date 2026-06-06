import { useTranslation } from 'react-i18next'

import FormField from '@/components/auth/FormField'
import styles from '@/styles/auth.module.css'

type TenantSituation = 'student' | 'worker' | 'unemployed'
type TenantSex = 'male' | 'female' | 'other' | 'prefer_not_to_say'

interface TenantOnboardingPersonalSectionProps {
  age: string
  onAgeChange: (value: string) => void
  sex: TenantSex
  onSexChange: (value: TenantSex) => void
  situation: TenantSituation
  onSituationChange: (value: TenantSituation) => void
  degree: string
  onDegreeChange: (value: string) => void
  profession: string
  onProfessionChange: (value: string) => void
}

export default function TenantOnboardingPersonalSection({
  age,
  onAgeChange,
  sex,
  onSexChange,
  situation,
  onSituationChange,
  degree,
  onDegreeChange,
  profession,
  onProfessionChange,
}: TenantOnboardingPersonalSectionProps) {
  const { t } = useTranslation()

  return (
    <section className={styles.form} aria-label={t('auth.tenantOnboarding.sections.personal')}>
      <h3 className={styles.roleTitle}>{t('auth.tenantOnboarding.sections.personal')}</h3>

      <div className={styles.twoColumns}>
        <FormField
          id="age"
          label={t('auth.tenantOnboarding.ageLabel')}
          type="number"
          min={18}
          value={age}
          onChange={(event) => onAgeChange(event.target.value)}
          required
        />

        <div className={styles.field}>
          <label htmlFor="sex" className={styles.roleLabel}>{t('auth.tenantOnboarding.sexLabel')}</label>
          <select id="sex" value={sex} onChange={(event) => onSexChange(event.target.value as TenantSex)} className={styles.select}>
            <option value="male">{t('auth.tenantOnboarding.sexOptions.male')}</option>
            <option value="female">{t('auth.tenantOnboarding.sexOptions.female')}</option>
            <option value="other">{t('auth.tenantOnboarding.sexOptions.other')}</option>
            <option value="prefer_not_to_say">{t('auth.tenantOnboarding.sexOptions.preferNotToSay')}</option>
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="situation" className={styles.roleLabel}>{t('auth.tenantOnboarding.situationLabel')}</label>
        <select id="situation" value={situation} onChange={(event) => onSituationChange(event.target.value as TenantSituation)} className={styles.select}>
          <option value="student">{t('auth.tenantOnboarding.situationOptions.student')}</option>
          <option value="worker">{t('auth.tenantOnboarding.situationOptions.worker')}</option>
          <option value="unemployed">{t('auth.tenantOnboarding.situationOptions.unemployed')}</option>
        </select>
      </div>

      {situation === 'student' ? (
        <FormField
          id="degree"
          label={t('auth.tenantOnboarding.degreeLabel')}
          type="text"
          value={degree}
          onChange={(event) => onDegreeChange(event.target.value)}
          required
        />
      ) : null}

      {situation === 'worker' ? (
        <FormField
          id="profession"
          label={t('auth.tenantOnboarding.professionLabel')}
          type="text"
          value={profession}
          onChange={(event) => onProfessionChange(event.target.value)}
          required
        />
      ) : null}
    </section>
  )
}
