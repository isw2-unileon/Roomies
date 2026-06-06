import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'

import AuthHeader from '@/components/auth/AuthHeader'
import AuthLayout from '@/components/auth/AuthLayout'
import AuthNotice from '@/components/auth/AuthNotice'
import SegmentedLevelField from '@/components/common/SegmentedLevelField'
import TenantOnboardingHousingSection from '@/components/tenant/tenant_onboarding/TenantOnboardingHousingSection'
import TenantOnboardingPersonalSection from '@/components/tenant/tenant_onboarding/TenantOnboardingPersonalSection'
import { useNotice } from '@/hooks/useNotice'
import { saveTenantProfile } from '@/services/tenantService'
import styles from '@/styles/auth.module.css'

type TenantSituation = 'student' | 'worker' | 'unemployed'
type TenantSex = 'male' | 'female' | 'other' | 'prefer_not_to_say'
type TenantLevel = 'low' | 'medium' | 'high'

interface TenantOnboardingPageProps {
  onCompleted: () => void
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

  const socializationOptions = [
    { value: 'low', label: t('auth.tenantOnboarding.levelOptions.low'), note: t('auth.tenantOnboarding.socializationNotes.low') },
    { value: 'medium', label: t('auth.tenantOnboarding.levelOptions.medium') },
    { value: 'high', label: t('auth.tenantOnboarding.levelOptions.high'), note: t('auth.tenantOnboarding.socializationNotes.high') },
  ]

  const nightlifeOptions = [
    { value: 'low', label: t('auth.tenantOnboarding.levelOptions.low') },
    { value: 'medium', label: t('auth.tenantOnboarding.levelOptions.medium') },
    { value: 'high', label: t('auth.tenantOnboarding.levelOptions.high') },
  ]

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
        <TenantOnboardingPersonalSection
          age={age}
          onAgeChange={setAge}
          sex={sex}
          onSexChange={setSex}
          situation={situation}
          onSituationChange={setSituation}
          degree={degree}
          onDegreeChange={setDegree}
          profession={profession}
          onProfessionChange={setProfession}
        />

        <TenantOnboardingHousingSection
          budgetMax={budgetMax}
          onBudgetMaxChange={setBudgetMax}
          preferredArea={preferredArea}
          onPreferredAreaChange={setPreferredArea}
          pets={pets}
          onPetsChange={setPets}
          smoking={smoking}
          onSmokingChange={setSmoking}
        />

        <section className={styles.form} aria-label={t('auth.tenantOnboarding.sections.livingPreferences')}>
          <h3 className={styles.roleTitle}>{t('auth.tenantOnboarding.sections.livingPreferences')}</h3>

          <SegmentedLevelField
            name="socialization-level"
            label={t('auth.tenantOnboarding.socializationLabel')}
            value={socializationLevel}
            onChange={(v) => setSocializationLevel(v as TenantLevel)}
            options={socializationOptions}
          />

          <SegmentedLevelField
            name="nightlife-level"
            label={t('auth.tenantOnboarding.nightlifeLabel')}
            value={nightlifeLevel}
            onChange={(v) => setNightlifeLevel(v as TenantLevel)}
            options={nightlifeOptions}
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
