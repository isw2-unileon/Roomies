import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import placeholderAvatar from '@/assets/placeholder-avatar.png'
import AuthNotice from '@/components/auth/AuthNotice'
import FormField from '@/components/auth/FormField'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import TenantLayout from '@/components/tenant/TenantLayout'
import { useNotice } from '@/hooks/useNotice'
import { forgotPassword } from '@/services/authService'
import {
  getMyTenantProfile,
  getTenantPersonalProfile,
  saveTenantPersonalProfile,
  updateTenantProfile,
  uploadTenantAvatar,
} from '@/services/tenantService'
import type { SaveTenantProfileInput } from '@/services/tenantService'
import styles from '@/styles/TenantProfile.module.css'

type TenantSituation = 'student' | 'worker' | 'unemployed'
type TenantSex = 'male' | 'female' | 'other' | 'prefer_not_to_say'
type TenantLevel = 'low' | 'medium' | 'high'

const MAX_AVATAR_SIZE_BYTES = 1_500_000

const socializationOptions: Array<{ value: TenantLevel; noteKey?: string }> = [
  { value: 'low', noteKey: 'tenantProfile.tenantData.socializationNotes.low' },
  { value: 'medium' },
  { value: 'high', noteKey: 'tenantProfile.tenantData.socializationNotes.high' },
]

const nightlifeOptions: Array<{ value: TenantLevel }> = [
  { value: 'low' },
  { value: 'medium' },
  { value: 'high' },
]

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
      <span className={styles.fieldLabel}>{label}</span>
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
              <span className={styles.segmentLabel}>{t(`tenantProfile.tenantData.levelOptions.${option.value}`)}</span>
              {option.noteKey ? (
                <span className={styles.segmentNote}>{t(option.noteKey)}</span>
              ) : (
                <span className={styles.segmentNotePlaceholder} aria-hidden="true" />
              )}
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default function TenantProfilePage() {
  const { t } = useTranslation()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)

  // Personal fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)

  // Tenant data fields
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<TenantSex>('prefer_not_to_say')
  const [situation, setSituation] = useState<TenantSituation>('student')
  const [degree, setDegree] = useState('')
  const [profession, setProfession] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [preferredArea, setPreferredArea] = useState('')
  const [pets, setPets] = useState(false)
  const [smoking, setSmoking] = useState(false)
  const [socializationLevel, setSocializationLevel] = useState<TenantLevel>('medium')
  const [nightlifeLevel, setNightlifeLevel] = useState<TenantLevel>('medium')

  const profileNotice = useNotice()
  const passwordNotice = useNotice()

  const { notice: profileBanner, clearNotice: clearProfileNotice, showError: showProfileError, showSuccess: showProfileSuccess } = profileNotice
  const { notice: passwordBanner, clearNotice: clearPasswordNotice, showError: showPasswordError, showSuccess: showPasswordSuccess } = passwordNotice

  useEffect(() => {
    let isMounted = true

    async function loadAll() {
      setIsLoading(true)
      clearProfileNotice()
      try {
        const [personal, tenantData] = await Promise.all([
          getTenantPersonalProfile(),
          getMyTenantProfile(),
        ])
        if (!isMounted) return
        setFullName(personal.fullName)
        setEmail(personal.email)
        setAvatarUrl(personal.avatarUrl)
        setAvatarLoadFailed(false)
        setAge(tenantData.age > 0 ? String(tenantData.age) : '')
        setSex((tenantData.sex as TenantSex) || 'prefer_not_to_say')
        setSituation((tenantData.situation as TenantSituation) || 'student')
        setDegree(tenantData.degree)
        setProfession(tenantData.profession)
        setBudgetMax(tenantData.budgetMax > 0 ? String(tenantData.budgetMax) : '')
        setPreferredArea(tenantData.preferredArea)
        setPets(tenantData.pets)
        setSmoking(tenantData.smoking)
        setSocializationLevel((tenantData.socializationLevel as TenantLevel) || 'medium')
        setNightlifeLevel((tenantData.nightlifeLevel as TenantLevel) || 'medium')
      } catch (error) {
        if (!isMounted) return
        showProfileError(error instanceof Error ? error.message : t('tenantProfile.personal.loadError'))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadAll()
    return () => { isMounted = false }
  }, [clearProfileNotice, showProfileError, t])

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    clearProfileNotice()

    if (!file.type.startsWith('image/')) {
      showProfileError(t('tenantProfile.personal.errors.invalidAvatarType'))
      event.target.value = ''
      return
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      showProfileError(t('tenantProfile.personal.errors.invalidAvatarSize'))
      event.target.value = ''
      return
    }

    setIsUploadingAvatar(true)
    try {
      const uploadedAvatarUrl = await uploadTenantAvatar(file)
      setAvatarUrl(uploadedAvatarUrl)
      setAvatarLoadFailed(false)
      showProfileSuccess(t('tenantProfile.personal.avatarUploaded'))
    } catch (error) {
      showProfileError(error instanceof Error ? error.message : t('tenantProfile.personal.errors.avatarReadFailed'))
    } finally {
      setIsUploadingAvatar(false)
    }
    event.target.value = ''
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearProfileNotice()

    if (fullName.trim().length < 2) {
      showProfileError(t('tenantProfile.personal.errors.fullNameMin'))
      return
    }

    const parsedBudgetMax = Number.parseInt(budgetMax, 10)
    const parsedAge = Number.parseInt(age, 10)

    if (!Number.isFinite(parsedBudgetMax) || parsedBudgetMax <= 0) {
      showProfileError(t('tenantProfile.tenantData.errors.invalidBudgetMax'))
      return
    }
    if (!Number.isFinite(parsedAge) || parsedAge <= 0) {
      showProfileError(t('tenantProfile.tenantData.errors.invalidAge'))
      return
    }
    if (preferredArea.trim().length < 2) {
      showProfileError(t('tenantProfile.tenantData.errors.preferredAreaMin'))
      return
    }
    if (situation === 'student' && degree.trim().length < 2) {
      showProfileError(t('tenantProfile.tenantData.errors.degreeRequired'))
      return
    }
    if (situation === 'worker' && profession.trim().length < 2) {
      showProfileError(t('tenantProfile.tenantData.errors.professionRequired'))
      return
    }

    const tenantInput: SaveTenantProfileInput = {
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
    }

    setIsSaving(true)
    try {
      await Promise.all([
        saveTenantPersonalProfile({ fullName: fullName.trim() }),
        updateTenantProfile(tenantInput),
      ])
      showProfileSuccess(t('tenantProfile.personal.saveSuccess'))
    } catch (error) {
      showProfileError(error instanceof Error ? error.message : t('tenantProfile.personal.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePasswordReset() {
    clearPasswordNotice()
    if (!email.trim()) {
      showPasswordError(t('tenantProfile.preferences.passwordMissingEmail'))
      return
    }

    setIsSendingReset(true)
    try {
      const message = await forgotPassword(email)
      showPasswordSuccess(message ?? t('tenantProfile.preferences.passwordSuccess'))
    } catch (error) {
      showPasswordError(error instanceof Error ? error.message : t('tenantProfile.preferences.passwordError'))
    } finally {
      setIsSendingReset(false)
    }
  }

  const profileImage = !avatarLoadFailed && avatarUrl ? avatarUrl : placeholderAvatar

  return (
    <TenantLayout>
      <div className={styles.page}>
        <section className={styles.hero}>
          <span className={styles.kicker}>{t('tenantProfile.kicker')}</span>
          <h1 className={styles.title}>{t('tenantProfile.title')}</h1>
          <p className={styles.subtitle}>{t('tenantProfile.subtitle')}</p>
        </section>

        <div className={styles.grid}>
          <section className={styles.card} aria-labelledby="tenant-profile-personal-title">
            <button
              type="button"
              className={styles.cardToggle}
              aria-expanded={isExpanded}
              aria-controls="tenant-profile-personal-panel"
              onClick={() => setIsExpanded((current) => !current)}
            >
              <div>
                <span className={styles.cardEyebrow}>{t('tenantProfile.personal.kicker')}</span>
                <h2 id="tenant-profile-personal-title" className={styles.cardTitle}>
                  {t('tenantProfile.personal.title')}
                </h2>
              </div>
              <span className={styles.toggleText}>
                {isExpanded ? t('tenantProfile.personal.close') : t('tenantProfile.personal.edit')}
              </span>
            </button>

            <p className={styles.cardText}>{t('tenantProfile.personal.description')}</p>

            <div id="tenant-profile-personal-panel" className={styles.personalPanel} hidden={!isExpanded}>
              {isLoading ? (
                <p className={styles.cardText}>{t('tenantProfile.personal.loading')}</p>
              ) : (
                <form className={styles.form} noValidate onSubmit={handleSubmit}>
                  <div className={styles.avatarSection}>
                    <img
                      src={profileImage}
                      alt={t('tenantProfile.personal.avatarAlt')}
                      className={styles.avatar}
                      onError={() => setAvatarLoadFailed(true)}
                    />
                    <div className={styles.avatarCopy}>
                      <p className={styles.avatarTitle}>{t('tenantProfile.personal.avatarTitle')}</p>
                      <p className={styles.avatarHint}>{t('tenantProfile.personal.avatarHint')}</p>
                      <label className={styles.avatarButton}>
                        {isUploadingAvatar ? t('tenantProfile.personal.avatarUploading') : t('tenantProfile.personal.avatarAction')}
                        <input
                          type="file"
                          accept="image/*"
                          className={styles.fileInput}
                          onChange={handleAvatarChange}
                          disabled={isUploadingAvatar}
                        />
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <FormField
                      id="tenant-profile-full-name"
                      label={t('tenantProfile.personal.fullNameLabel')}
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                    />

                    <div>
                      <FormField
                        id="tenant-profile-email"
                        label={t('tenantProfile.personal.emailLabel')}
                        type="email"
                        value={email}
                        readOnly
                        disabled
                      />
                      <p className={styles.readOnlyHint}>{t('tenantProfile.personal.emailHint')}</p>
                    </div>
                  </div>

                  <h3 className={styles.sectionTitle}>{t('tenantProfile.tenantData.sections.personal')}</h3>

                  <div className={styles.twoColumns}>
                    <FormField
                      id="tenant-data-age"
                      label={t('tenantProfile.tenantData.ageLabel')}
                      type="number"
                      min={18}
                      value={age}
                      onChange={(event) => setAge(event.target.value)}
                      required
                    />

                    <div className={styles.field}>
                      <label htmlFor="tenant-data-sex" className={styles.fieldLabel}>
                        {t('tenantProfile.tenantData.sexLabel')}
                      </label>
                      <select
                        id="tenant-data-sex"
                        value={sex}
                        onChange={(event) => setSex(event.target.value as TenantSex)}
                        className={styles.select}
                      >
                        <option value="male">{t('tenantProfile.tenantData.sexOptions.male')}</option>
                        <option value="female">{t('tenantProfile.tenantData.sexOptions.female')}</option>
                        <option value="other">{t('tenantProfile.tenantData.sexOptions.other')}</option>
                        <option value="prefer_not_to_say">{t('tenantProfile.tenantData.sexOptions.preferNotToSay')}</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="tenant-data-situation" className={styles.fieldLabel}>
                      {t('tenantProfile.tenantData.situationLabel')}
                    </label>
                    <select
                      id="tenant-data-situation"
                      value={situation}
                      onChange={(event) => setSituation(event.target.value as TenantSituation)}
                      className={styles.select}
                    >
                      <option value="student">{t('tenantProfile.tenantData.situationOptions.student')}</option>
                      <option value="worker">{t('tenantProfile.tenantData.situationOptions.worker')}</option>
                      <option value="unemployed">{t('tenantProfile.tenantData.situationOptions.unemployed')}</option>
                    </select>
                  </div>

                  {situation === 'student' ? (
                    <FormField
                      id="tenant-data-degree"
                      label={t('tenantProfile.tenantData.degreeLabel')}
                      type="text"
                      value={degree}
                      onChange={(event) => setDegree(event.target.value)}
                      required
                    />
                  ) : null}

                  {situation === 'worker' ? (
                    <FormField
                      id="tenant-data-profession"
                      label={t('tenantProfile.tenantData.professionLabel')}
                      type="text"
                      value={profession}
                      onChange={(event) => setProfession(event.target.value)}
                      required
                    />
                  ) : null}

                  <h3 className={styles.sectionTitle}>{t('tenantProfile.tenantData.sections.housing')}</h3>

                  <div className={styles.twoColumns}>
                    <FormField
                      id="tenant-data-budget-max"
                      label={t('tenantProfile.tenantData.budgetMaxLabel')}
                      type="number"
                      min={1}
                      value={budgetMax}
                      onChange={(event) => setBudgetMax(event.target.value)}
                      required
                    />

                    <FormField
                      id="tenant-data-preferred-area"
                      label={t('tenantProfile.tenantData.preferredAreaLabel')}
                      type="text"
                      value={preferredArea}
                      onChange={(event) => setPreferredArea(event.target.value)}
                      placeholder={t('tenantProfile.tenantData.preferredAreaPlaceholder')}
                      required
                    />
                  </div>

                  <div className={styles.checkboxGrid}>
                    <label className={styles.checkboxCard}>
                      <input
                        type="checkbox"
                        className={styles.checkboxInput}
                        checked={pets}
                        onChange={(event) => setPets(event.target.checked)}
                      />
                      <span>{t('tenantProfile.tenantData.petsLabel')}</span>
                    </label>

                    <label className={styles.checkboxCard}>
                      <input
                        type="checkbox"
                        className={styles.checkboxInput}
                        checked={smoking}
                        onChange={(event) => setSmoking(event.target.checked)}
                      />
                      <span>{t('tenantProfile.tenantData.smokerLabel')}</span>
                    </label>
                  </div>

                  <h3 className={styles.sectionTitle}>{t('tenantProfile.tenantData.sections.living')}</h3>

                  <SegmentedLevelField
                    name="tenant-data-socialization"
                    label={t('tenantProfile.tenantData.socializationLabel')}
                    value={socializationLevel}
                    onChange={setSocializationLevel}
                    options={socializationOptions}
                    t={t}
                  />

                  <SegmentedLevelField
                    name="tenant-data-nightlife"
                    label={t('tenantProfile.tenantData.nightlifeLabel')}
                    value={nightlifeLevel}
                    onChange={setNightlifeLevel}
                    options={nightlifeOptions}
                    t={t}
                  />

                  <AuthNotice kind={profileBanner.kind} message={profileBanner.message} />

                  <button type="submit" disabled={isSaving || isUploadingAvatar} className={styles.primaryButton}>
                    {isSaving ? t('tenantProfile.personal.saving') : t('tenantProfile.personal.save')}
                  </button>
                </form>
              )}
            </div>
          </section>

          <section className={styles.card} aria-labelledby="tenant-profile-preferences-title">
            <div>
              <span className={styles.cardEyebrow}>{t('tenantProfile.preferences.kicker')}</span>
              <h2 id="tenant-profile-preferences-title" className={styles.cardTitle}>
                {t('tenantProfile.preferences.title')}
              </h2>
            </div>
            <p className={styles.cardText}>{t('tenantProfile.preferences.description')}</p>

            <div className={styles.preferenceRow}>
              <div>
                <h3 className={styles.preferenceTitle}>{t('tenantProfile.preferences.languageTitle')}</h3>
                <p className={styles.preferenceText}>{t('tenantProfile.preferences.languageDescription')}</p>
              </div>
              <LanguageSwitcher />
            </div>

            <div className={styles.preferenceRow}>
              <div>
                <h3 className={styles.preferenceTitle}>{t('tenantProfile.preferences.passwordTitle')}</h3>
                <p className={styles.preferenceText}>{t('tenantProfile.preferences.passwordDescription')}</p>
              </div>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handlePasswordReset}
                disabled={isSendingReset || isLoading}
              >
                {isSendingReset ? t('tenantProfile.preferences.passwordSending') : t('tenantProfile.preferences.passwordAction')}
              </button>
            </div>

            <AuthNotice kind={passwordBanner.kind} message={passwordBanner.message} />
          </section>
        </div>
      </div>
    </TenantLayout>
  )
}
