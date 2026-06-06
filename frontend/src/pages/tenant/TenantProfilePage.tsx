import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import placeholderAvatar from '@/assets/placeholder-avatar.png'
import TenantProfileFormCard from '@/components/tenant/tenant_profile/TenantProfileFormCard'
import type { TenantProfileFormData } from '@/components/tenant/tenant_profile/TenantProfileFormCard'
import TenantProfilePreferencesCard from '@/components/tenant/tenant_profile/TenantProfilePreferencesCard'
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

const MAX_AVATAR_SIZE_BYTES = 1_500_000

const INITIAL_FORM_DATA: TenantProfileFormData = {
  fullName: '',
  email: '',
  age: '',
  sex: 'prefer_not_to_say',
  situation: 'student',
  degree: '',
  profession: '',
  budgetMax: '',
  preferredArea: '',
  pets: false,
  smoking: false,
  socializationLevel: 'medium',
  nightlifeLevel: 'medium',
}

export default function TenantProfilePage() {
  const { t } = useTranslation()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const [formData, setFormData] = useState<TenantProfileFormData>(INITIAL_FORM_DATA)

  const profileNotice = useNotice()
  const passwordNotice = useNotice()

  const { notice: profileBanner, clearNotice: clearProfileNotice, showError: showProfileError, showSuccess: showProfileSuccess } = profileNotice
  const { notice: passwordBanner, clearNotice: clearPasswordNotice, showError: showPasswordError, showSuccess: showPasswordSuccess } = passwordNotice

  const handleFieldChange = useCallback(<K extends keyof TenantProfileFormData>(field: K, value: TenantProfileFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

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
        setAvatarUrl(personal.avatarUrl)
        setAvatarLoadFailed(false)
        setFormData({
          fullName: personal.fullName,
          email: personal.email,
          age: tenantData.age > 0 ? String(tenantData.age) : '',
          sex: (tenantData.sex as TenantProfileFormData['sex']) || 'prefer_not_to_say',
          situation: (tenantData.situation as TenantProfileFormData['situation']) || 'student',
          degree: tenantData.degree,
          profession: tenantData.profession,
          budgetMax: tenantData.budgetMax > 0 ? String(tenantData.budgetMax) : '',
          preferredArea: tenantData.preferredArea,
          pets: tenantData.pets,
          smoking: tenantData.smoking,
          socializationLevel: (tenantData.socializationLevel as TenantProfileFormData['socializationLevel']) || 'medium',
          nightlifeLevel: (tenantData.nightlifeLevel as TenantProfileFormData['nightlifeLevel']) || 'medium',
        })
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

    if (formData.fullName.trim().length < 2) {
      showProfileError(t('tenantProfile.personal.errors.fullNameMin'))
      return
    }

    const parsedBudgetMax = Number.parseInt(formData.budgetMax, 10)
    const parsedAge = Number.parseInt(formData.age, 10)

    if (!Number.isFinite(parsedBudgetMax) || parsedBudgetMax <= 0) {
      showProfileError(t('tenantProfile.tenantData.errors.invalidBudgetMax'))
      return
    }
    if (!Number.isFinite(parsedAge) || parsedAge <= 0) {
      showProfileError(t('tenantProfile.tenantData.errors.invalidAge'))
      return
    }
    if (formData.preferredArea.trim().length < 2) {
      showProfileError(t('tenantProfile.tenantData.errors.preferredAreaMin'))
      return
    }
    if (formData.situation === 'student' && formData.degree.trim().length < 2) {
      showProfileError(t('tenantProfile.tenantData.errors.degreeRequired'))
      return
    }
    if (formData.situation === 'worker' && formData.profession.trim().length < 2) {
      showProfileError(t('tenantProfile.tenantData.errors.professionRequired'))
      return
    }

    const tenantInput: SaveTenantProfileInput = {
      budgetMax: parsedBudgetMax,
      preferredArea: formData.preferredArea.trim(),
      pets: formData.pets,
      smoking: formData.smoking,
      age: parsedAge,
      sex: formData.sex,
      situation: formData.situation,
      degree: formData.situation === 'student' ? formData.degree.trim() : undefined,
      profession: formData.situation === 'worker' ? formData.profession.trim() : undefined,
      socializationLevel: formData.socializationLevel,
      nightlifeLevel: formData.nightlifeLevel,
    }

    setIsSaving(true)
    try {
      await Promise.all([
        saveTenantPersonalProfile({ fullName: formData.fullName.trim() }),
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
    if (!formData.email.trim()) {
      showPasswordError(t('tenantProfile.preferences.passwordMissingEmail'))
      return
    }

    setIsSendingReset(true)
    try {
      const message = await forgotPassword(formData.email)
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
          <TenantProfileFormCard
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded((c) => !c)}
            isLoading={isLoading}
            isSaving={isSaving}
            isUploadingAvatar={isUploadingAvatar}
            profileImage={profileImage}
            onAvatarLoadFailed={() => setAvatarLoadFailed(true)}
            onAvatarChange={handleAvatarChange}
            data={formData}
            onFieldChange={handleFieldChange}
            notice={profileBanner}
            onSubmit={handleSubmit}
          />

          <TenantProfilePreferencesCard
            onPasswordReset={handlePasswordReset}
            isSendingReset={isSendingReset}
            isLoading={isLoading}
            notice={passwordBanner}
          />
        </div>
      </div>
    </TenantLayout>
  )
}
