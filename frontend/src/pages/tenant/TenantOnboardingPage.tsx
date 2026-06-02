import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AuthHeader from '@/components/auth/AuthHeader'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthNotice from '@/components/auth/AuthNotice'
import FormField from '@/components/auth/FormField'
import { useNotice } from '@/hooks/useNotice'
import { saveTenantProfile } from '@/services/tenantService'
import styles from '@/styles/auth.module.css'

type TenantSituation = 'student' | 'worker' | 'unemployed'
type TenantSex = 'male' | 'female' | 'other' | 'prefer_not_to_say'
type TenantLevel = 'low' | 'medium' | 'high'

interface TenantOnboardingPageProps {
  onCompleted: () => void
}

const socializationOptions: Array<{ value: TenantLevel; noteKey?: string }> = [
  { value: 'low', noteKey: 'auth.tenantOnboarding.socializationNotes.low' },
  { value: 'medium' },
  { value: 'high', noteKey: 'auth.tenantOnboarding.socializationNotes.high' },
]

const nightlifeOptions: TenantLevel[] = ['low', 'medium', 'high']

interface SegmentedLevelFieldProps {
  name: string
  label: string
  value: TenantLevel
  onChange: (value: TenantLevel) => void
  options: Array<{ value: TenantLevel; noteKey?: string }>
  t: (key: string) => string
}

function SegmentedLevelField({ name, label, value, onChange, options, t }: SegmentedLevelFieldProps) {
  return (
    <div className={styles.field}>
      <span className={styles.roleLabel}>{label}</span>
      <div className={styles.segmentedControl} role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const checked = value === option.value

          return (
            <label key={option.value} className={`${styles.segmentOption} ${checked ? styles.segmentOptionActive : ''}`}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={(event) => onChange(event.target.value as TenantLevel)}
                className={styles.segmentInput}
              />
              <span className={styles.segmentLabel}>{t(`auth.tenantOnboarding.levelOptions.${option.value}`)}</span>
              {option.noteKey ? <span className={styles.segmentNote}>{t(option.noteKey)}</span> : <span className={styles.segmentNotePlaceholder} aria-hidden="true" />} 
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default function TenantOnboardingPage({ onCompleted }: TenantOnboardingPageProps) {
  const { t } = useTranslation()

  const [budgetMax, setBudgetMax] = useState('900')
  const [preferredArea, setPreferredArea] = useState('')
  const [pets, setPets] = useState(false)
  const [smoking, setSmoking] = useState(false)
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<TenantSex>('prefer_not_to_say')
  const [situation, setSituation] = useState<TenantSituation>('student')
  const [degree, setDegree] = useState('')
  const [profession, setProfession] = useState('')
  const [socializationLevel, setSocializationLevel] = useState<TenantLevel>('medium')
  const [nightlifeLevel, setNightlifeLevel] = useState<TenantLevel>('medium')
  const [isLoading, setIsLoading] = useState(false)

  const { notice, showError, showSuccess, clearNotice } = useNotice()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearNotice()

    const parsedBudgetMax = Number.parseInt(budgetMax, 10)
    const parsedAge = Number.parseInt(age, 10)

    if (!Number.isFinite(parsedBudgetMax) || parsedBudgetMax <= 0) {
      showError(t('auth.tenantOnboarding.errors.invalidBudgetMax'))
      return
    }

    if (!Number.isFinite(parsedAge) || parsedAge <= 0) {
      showError(t('auth.tenantOnboarding.errors.invalidAge'))
      return
    }

    if (preferredArea.trim().length < 2) {
      showError(t('auth.tenantOnboarding.errors.preferredAreaMin'))
      return
    }

    if (situation === 'student' && degree.trim().length < 2) {
      showError(t('auth.tenantOnboarding.errors.degreeRequired'))
      return
    }

    if (situation === 'worker' && profession.trim().length < 2) {
      showError(t('auth.tenantOnboarding.errors.professionRequired'))
      return
    }

    setIsLoading(true)

    try {
      const message = await saveTenantProfile({
        budgetMax: parsedBudgetMax,
        preferredArea: preferredArea.trim(),
        pets,
        smoking,
        age: parsedAge,
        sex,
        situation,
        degree: situation === 'student' ? degree.trim() : undefined,
        profession: situation === 'worker' ? profession.trim() : undefined,
        socializationLevel,
        nightlifeLevel,
      })
      showSuccess(message ?? t('auth.tenantOnboarding.successDefault'))
      onCompleted()
    } catch (error) {
      showError(error instanceof Error ? error.message : t('auth.tenantOnboarding.errors.default'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      sidebarDescription={t('auth.tenantOnboarding.sidebarDescription')}
      sidebarTagline={t('auth.tenantOnboarding.sidebarTagline')}
    >
      <AuthHeader
        title={t('auth.tenantOnboarding.title')}
        subtitle={t('auth.tenantOnboarding.subtitle')}
      />

      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <section className={styles.form} aria-label={t('auth.tenantOnboarding.sections.personal')}>
          <h3 className={styles.roleTitle}>{t('auth.tenantOnboarding.sections.personal')}</h3>

          <div className={styles.twoColumns}>
            <FormField
              id="age"
              label={t('auth.tenantOnboarding.ageLabel')}
              type="number"
              min={18}
              value={age}
              onChange={(event) => setAge(event.target.value)}
              required
            />

            <div className={styles.field}>
              <label htmlFor="sex" className={styles.roleLabel}>{t('auth.tenantOnboarding.sexLabel')}</label>
              <select id="sex" value={sex} onChange={(event) => setSex(event.target.value as TenantSex)} className={styles.select}>
                <option value="male">{t('auth.tenantOnboarding.sexOptions.male')}</option>
                <option value="female">{t('auth.tenantOnboarding.sexOptions.female')}</option>
                <option value="other">{t('auth.tenantOnboarding.sexOptions.other')}</option>
                <option value="prefer_not_to_say">{t('auth.tenantOnboarding.sexOptions.preferNotToSay')}</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="situation" className={styles.roleLabel}>{t('auth.tenantOnboarding.situationLabel')}</label>
            <select id="situation" value={situation} onChange={(event) => setSituation(event.target.value as TenantSituation)} className={styles.select}>
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
              onChange={(event) => setDegree(event.target.value)}
              required
            />
          ) : null}

          {situation === 'worker' ? (
            <FormField
              id="profession"
              label={t('auth.tenantOnboarding.professionLabel')}
              type="text"
              value={profession}
              onChange={(event) => setProfession(event.target.value)}
              required
            />
          ) : null}
        </section>

        <section className={styles.form} aria-label={t('auth.tenantOnboarding.sections.housing')}>
          <h3 className={styles.roleTitle}>{t('auth.tenantOnboarding.sections.housing')}</h3>

          <FormField
            id="budget-max"
            label={t('auth.tenantOnboarding.budgetMaxLabel')}
            type="number"
            min={1}
            value={budgetMax}
            onChange={(event) => setBudgetMax(event.target.value)}
            required
          />

          <FormField
            id="preferred-area"
            label={t('auth.tenantOnboarding.preferredAreaLabel')}
            type="text"
            value={preferredArea}
            onChange={(event) => setPreferredArea(event.target.value)}
            placeholder={t('auth.tenantOnboarding.preferredAreaPlaceholder')}
            required
          />

          <div className={styles.checkboxGrid}>
            <label className={styles.checkboxCard}>
              <input type="checkbox" checked={pets} onChange={(event) => setPets(event.target.checked)} className={styles.roleRadio} />
              <span>{t('auth.tenantOnboarding.petsLabel')}</span>
            </label>

            <label className={styles.checkboxCard}>
              <input type="checkbox" checked={smoking} onChange={(event) => setSmoking(event.target.checked)} className={styles.roleRadio} />
              <span>{t('auth.tenantOnboarding.smokerLabel')}</span>
            </label>
          </div>
        </section>

        <section className={styles.form} aria-label={t('auth.tenantOnboarding.sections.livingPreferences')}>
          <h3 className={styles.roleTitle}>{t('auth.tenantOnboarding.sections.livingPreferences')}</h3>

          <SegmentedLevelField
            name="socialization-level"
            label={t('auth.tenantOnboarding.socializationLabel')}
            value={socializationLevel}
            onChange={setSocializationLevel}
            options={socializationOptions}
            t={t}
          />

          <SegmentedLevelField
            name="nightlife-level"
            label={t('auth.tenantOnboarding.nightlifeLabel')}
            value={nightlifeLevel}
            onChange={setNightlifeLevel}
            options={nightlifeOptions.map((option) => ({ value: option }))}
            t={t}
          />
        </section>

        <AuthNotice kind={notice.kind} message={notice.message} />

        <button type="submit" disabled={isLoading} className={styles.btnPrimary}>
          {isLoading ? t('auth.tenantOnboarding.submitting') : t('auth.tenantOnboarding.submit')}
        </button>
      </form>
    </AuthLayout>
  )
}
