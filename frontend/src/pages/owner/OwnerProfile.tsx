import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import placeholderAvatar from '@/assets/placeholder-avatar.png'
import OwnerProfileFormCard from '@/components/owner/owner_profile/OwnerProfileFormCard'
import type { OwnerProfileFormData } from '@/components/owner/owner_profile/OwnerProfileFormCard'
import OwnerProfilePreferencesCard from '@/components/owner/owner_profile/OwnerProfilePreferencesCard'
import OwnerLayout from '@/components/owner/OwnerLayout'
import { useNotice } from '@/hooks/useNotice'
import { forgotPassword } from '@/services/authService'
import { getOwnerProfile, updateOwnerProfile, uploadOwnerAvatar } from '@/services/ownerService'
import styles from '@/styles/OwnerProfile.module.css'

const MAX_AVATAR_SIZE_BYTES = 1_500_000

const INITIAL_FORM_DATA: OwnerProfileFormData = {
  fullName: '',
  email: '',
  displayName: '',
  phone: '',
}

export default function OwnerProfile() {
  const { t } = useTranslation()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const [formData, setFormData] = useState<OwnerProfileFormData>(INITIAL_FORM_DATA)

  const profileNotice = useNotice()
  const passwordNotice = useNotice()

  const { notice: profileBanner, clearNotice: clearProfileNotice, showError: showProfileError, showSuccess: showProfileSuccess } = profileNotice
  const { notice: passwordBanner, clearNotice: clearPasswordNotice, showError: showPasswordError, showSuccess: showPasswordSuccess } = passwordNotice

  const handleFieldChange = useCallback(<K extends keyof OwnerProfileFormData>(field: K, value: OwnerProfileFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      setIsLoading(true)
      clearProfileNotice()
      try {
        const profile = await getOwnerProfile()
        if (!isMounted) return
        setAvatarUrl(profile.avatarUrl)
        setAvatarLoadFailed(false)
        setFormData({
          fullName: profile.fullName,
          email: profile.email,
          displayName: profile.displayName,
          phone: profile.phone,
        })
      } catch (error) {
        if (!isMounted) return
        showProfileError(error instanceof Error ? error.message : t('ownerProfile.personal.loadError'))
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadProfile()
    return () => { isMounted = false }
  }, [clearProfileNotice, showProfileError, t])

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    clearProfileNotice()

    if (!file.type.startsWith('image/')) {
      showProfileError(t('ownerProfile.personal.errors.invalidAvatarType'))
      event.target.value = ''
      return
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      showProfileError(t('ownerProfile.personal.errors.invalidAvatarSize'))
      event.target.value = ''
      return
    }

    setIsUploadingAvatar(true)
    try {
      const uploaded = await uploadOwnerAvatar(file)
      setAvatarUrl(uploaded)
      setAvatarLoadFailed(false)
      showProfileSuccess(t('ownerProfile.personal.avatarUploaded'))
    } catch (error) {
      showProfileError(error instanceof Error ? error.message : t('ownerProfile.personal.errors.avatarReadFailed'))
    } finally {
      setIsUploadingAvatar(false)
    }
    event.target.value = ''
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearProfileNotice()

    if (formData.fullName.trim().length < 2) {
      showProfileError(t('ownerProfile.personal.errors.fullNameMin'))
      return
    }

    setIsSaving(true)
    try {
      const message = await updateOwnerProfile({
        fullName: formData.fullName.trim(),
        displayName: formData.displayName.trim(),
        phone: formData.phone.trim(),
      })
      showProfileSuccess(message ?? t('ownerProfile.personal.saveSuccess'))
    } catch (error) {
      showProfileError(error instanceof Error ? error.message : t('ownerProfile.personal.saveError'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePasswordReset() {
    clearPasswordNotice()
    if (!formData.email.trim()) {
      showPasswordError(t('ownerProfile.preferences.passwordMissingEmail'))
      return
    }

    setIsSendingReset(true)
    try {
      const message = await forgotPassword(formData.email)
      showPasswordSuccess(message ?? t('ownerProfile.preferences.passwordSuccess'))
    } catch (error) {
      showPasswordError(error instanceof Error ? error.message : t('ownerProfile.preferences.passwordError'))
    } finally {
      setIsSendingReset(false)
    }
  }

  const profileImage = !avatarLoadFailed && avatarUrl ? avatarUrl : placeholderAvatar

  return (
    <OwnerLayout>
      <div className={styles.page}>
        <section className={styles.hero}>
          <span className={styles.kicker}>{t('ownerProfile.kicker')}</span>
          <h1 className={styles.title}>{t('ownerProfile.title')}</h1>
          <p className={styles.subtitle}>{t('ownerProfile.subtitle')}</p>
        </section>

        <div className={styles.grid}>
          <OwnerProfileFormCard
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

          <OwnerProfilePreferencesCard
            onPasswordReset={handlePasswordReset}
            isSendingReset={isSendingReset}
            isLoading={isLoading}
            notice={passwordBanner}
          />
        </div>
      </div>
    </OwnerLayout>
  )
}
