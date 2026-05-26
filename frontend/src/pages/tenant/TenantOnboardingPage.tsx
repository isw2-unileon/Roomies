import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AuthHeader from '@/components/auth/AuthHeader'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthNotice from '@/components/auth/AuthNotice'
import FormField from '@/components/auth/FormField'
import { useNotice } from '@/hooks/useNotice'
import { saveTenantProfile } from '@/services/tenantService'
import styles from '@/styles/auth.module.css'

type WorkSchedule = 'morning' | 'night' | 'flexible'
type NoiseLevel = 'quiet' | 'moderate' | 'loud'
type Cleanliness = 'very_clean' | 'normal' | 'relaxed'

interface TenantOnboardingPageProps {
  onCompleted: () => void
}

export default function TenantOnboardingPage({ onCompleted }: TenantOnboardingPageProps) {
  const { t } = useTranslation()

  const [budgetMin, setBudgetMin] = useState('400')
  const [budgetMax, setBudgetMax] = useState('900')
  const [preferredArea, setPreferredArea] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>('flexible')
  const [pets, setPets] = useState(false)
  const [smoking, setSmoking] = useState(false)
  const [noiseLevel, setNoiseLevel] = useState<NoiseLevel>('moderate')
  const [cleanliness, setCleanliness] = useState<Cleanliness>('normal')
  const [isLoading, setIsLoading] = useState(false)

  const { notice, showError, showSuccess, clearNotice } = useNotice()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearNotice()

    const parsedBudgetMin = Number.parseInt(budgetMin, 10)
    const parsedBudgetMax = Number.parseInt(budgetMax, 10)

    if (!Number.isFinite(parsedBudgetMin) || !Number.isFinite(parsedBudgetMax)) {
      showError(t('auth.tenantOnboarding.errors.invalidBudgetNumbers'))
      return
    }

    if (parsedBudgetMin <= 0 || parsedBudgetMax <= 0 || parsedBudgetMin > parsedBudgetMax) {
      showError(t('auth.tenantOnboarding.errors.invalidBudgetRange'))
      return
    }

    if (preferredArea.trim().length < 2) {
      showError(t('auth.tenantOnboarding.errors.preferredAreaMin'))
      return
    }

    if (!moveInDate) {
      showError(t('auth.tenantOnboarding.errors.moveInDateRequired'))
      return
    }

    setIsLoading(true)

    try {
      const message = await saveTenantProfile({
        budgetMin: parsedBudgetMin,
        budgetMax: parsedBudgetMax,
        preferredArea: preferredArea.trim(),
        moveInDate,
        workSchedule,
        pets,
        smoking,
        noiseLevel,
        cleanliness,
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
        <div className={styles.twoColumns}>
          <FormField
            id="budget-min"
            label={t('auth.tenantOnboarding.budgetMinLabel')}
            type="number"
            min={1}
            value={budgetMin}
            onChange={(event) => setBudgetMin(event.target.value)}
            required
          />

          <FormField
            id="budget-max"
            label={t('auth.tenantOnboarding.budgetMaxLabel')}
            type="number"
            min={1}
            value={budgetMax}
            onChange={(event) => setBudgetMax(event.target.value)}
            required
          />
        </div>

        <FormField
          id="preferred-area"
          label={t('auth.tenantOnboarding.preferredAreaLabel')}
          type="text"
          value={preferredArea}
          onChange={(event) => setPreferredArea(event.target.value)}
          placeholder={t('auth.tenantOnboarding.preferredAreaPlaceholder')}
          required
        />

        <FormField
          id="move-in-date"
          label={t('auth.tenantOnboarding.moveInDateLabel')}
          type="date"
          value={moveInDate}
          onChange={(event) => setMoveInDate(event.target.value)}
          required
        />

        <div className={styles.twoColumns}>
          <div className={styles.field}>
            <label htmlFor="work-schedule" className={styles.roleLabel}>
              {t('auth.tenantOnboarding.scheduleLabel')}
            </label>
            <select
              id="work-schedule"
              value={workSchedule}
              onChange={(event) => setWorkSchedule(event.target.value as WorkSchedule)}
              className={styles.select}
            >
              <option value="morning">{t('auth.tenantOnboarding.scheduleOptions.morning')}</option>
              <option value="night">{t('auth.tenantOnboarding.scheduleOptions.night')}</option>
              <option value="flexible">{t('auth.tenantOnboarding.scheduleOptions.flexible')}</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="noise-level" className={styles.roleLabel}>
              {t('auth.tenantOnboarding.noiseLevelLabel')}
            </label>
            <select
              id="noise-level"
              value={noiseLevel}
              onChange={(event) => setNoiseLevel(event.target.value as NoiseLevel)}
              className={styles.select}
            >
              <option value="quiet">{t('auth.tenantOnboarding.noiseLevelOptions.quiet')}</option>
              <option value="moderate">{t('auth.tenantOnboarding.noiseLevelOptions.moderate')}</option>
              <option value="loud">{t('auth.tenantOnboarding.noiseLevelOptions.loud')}</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="cleanliness" className={styles.roleLabel}>
            {t('auth.tenantOnboarding.cleanlinessLabel')}
          </label>
          <select
            id="cleanliness"
            value={cleanliness}
            onChange={(event) => setCleanliness(event.target.value as Cleanliness)}
            className={styles.select}
          >
            <option value="very_clean">{t('auth.tenantOnboarding.cleanlinessOptions.veryClean')}</option>
            <option value="normal">{t('auth.tenantOnboarding.cleanlinessOptions.normal')}</option>
            <option value="relaxed">{t('auth.tenantOnboarding.cleanlinessOptions.relaxed')}</option>
          </select>
        </div>

        <div className={styles.checkboxGrid}>
          <label className={styles.checkboxCard}>
            <input
              type="checkbox"
              checked={pets}
              onChange={(event) => setPets(event.target.checked)}
              className={styles.roleRadio}
            />
            <span>{t('auth.tenantOnboarding.petsLabel')}</span>
          </label>

          <label className={styles.checkboxCard}>
            <input
              type="checkbox"
              checked={smoking}
              onChange={(event) => setSmoking(event.target.checked)}
              className={styles.roleRadio}
            />
            <span>{t('auth.tenantOnboarding.smokerLabel')}</span>
          </label>
        </div>

        <AuthNotice kind={notice.kind} message={notice.message} />

        <button type="submit" disabled={isLoading} className={styles.btnPrimary}>
          {isLoading
            ? t('auth.tenantOnboarding.submitting')
            : t('auth.tenantOnboarding.submit')}
        </button>
      </form>
    </AuthLayout>
  )
}
