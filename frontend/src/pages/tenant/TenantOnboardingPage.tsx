import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AuthHeader from '@/components/auth/AuthHeader'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthNotice from '@/components/auth/AuthNotice'
import FormField from '@/components/auth/FormField'
import { apiFetch } from '@/api'
import { useNotice } from '@/hooks/useNotice'
import styles from '@/styles/auth.module.css'

type Schedule = 'morning' | 'night' | 'flexible'
type NoiseLevel = 'quiet' | 'moderate' | 'loud'
type Cleanliness = 'very_clean' | 'normal' | 'relaxed'

interface TenantOnboardingPageProps {
  onCompleted: () => void
}

interface TenantProfileResponse {
  message?: string
  onboarding_complete?: boolean
  error?: string
}

export default function TenantOnboardingPage({ onCompleted }: TenantOnboardingPageProps) {
  const { t } = useTranslation()

  const [budgetMin, setBudgetMin] = useState('400')
  const [budgetMax, setBudgetMax] = useState('900')
  const [preferredArea, setPreferredArea] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [schedule, setSchedule] = useState<Schedule>('flexible')
  const [pets, setPets] = useState(false)
  const [smoker, setSmoker] = useState(false)
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

    const token = localStorage.getItem('roomies.access_token')
    if (!token) {
      showError(t('auth.tenantOnboarding.errors.sessionExpired'))
      return
    }

    setIsLoading(true)

    try {
      const response = await apiFetch('/api/tenant-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          budget_min: parsedBudgetMin,
          budget_max: parsedBudgetMax,
          preferred_area: preferredArea.trim(),
          move_in_date: moveInDate,
          schedule,
          pets,
          smoker,
          noise_level: noiseLevel,
          cleanliness,
        }),
      })

      const data = (await response.json()) as TenantProfileResponse

      if (!response.ok) {
        showError(data.error ?? t('auth.tenantOnboarding.errors.default'))
        return
      }

      showSuccess(data.message ?? t('auth.tenantOnboarding.successDefault'))
      onCompleted()
    } catch {
      showError(t('auth.tenantOnboarding.errors.default'))
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
            <label htmlFor="schedule" className={styles.roleLabel}>
              {t('auth.tenantOnboarding.scheduleLabel')}
            </label>
            <select
              id="schedule"
              value={schedule}
              onChange={(event) => setSchedule(event.target.value as Schedule)}
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
              checked={smoker}
              onChange={(event) => setSmoker(event.target.checked)}
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
