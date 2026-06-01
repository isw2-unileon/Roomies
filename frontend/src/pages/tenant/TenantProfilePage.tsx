import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import placeholderAvatar from '@/assets/placeholder-avatar.png'
import AuthNotice from '@/components/auth/AuthNotice'
import FormField from '@/components/auth/FormField'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import TenantLayout from '@/components/tenant/TenantLayout'
import { useNotice } from '@/hooks/useNotice'
import { forgotPassword } from '@/services/authService'
import { getTenantPersonalProfile, saveTenantPersonalProfile, uploadTenantAvatar } from '@/services/tenantService'
import styles from '@/styles/TenantProfile.module.css'

const MAX_AVATAR_SIZE_BYTES = 1_500_000

export default function TenantProfilePage() {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)

  const profileNotice = useNotice()
  const passwordNotice = useNotice()
  const {
    notice: profileBanner,
    clearNotice: clearProfileNotice,
    showError: showProfileError,
    showSuccess: showProfileSuccess,
  } = profileNotice
  const {
    notice: passwordBanner,
    clearNotice: clearPasswordNotice,
    showError: showPasswordError,
    showSuccess: showPasswordSuccess,
  } = passwordNotice

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      setIsLoading(true)
      clearProfileNotice()

      try {
        const profile = await getTenantPersonalProfile()
        if (!isMounted) {
          return
        }
        setFullName(profile.fullName)
        setEmail(profile.email)
        setAvatarUrl(profile.avatarUrl)
        setAvatarLoadFailed(false)
      } catch (error) {
        if (!isMounted) {
          return
        }
        showProfileError(error instanceof Error ? error.message : t('tenantProfile.personal.loadError'))
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isMounted = false
    }
  }, [clearProfileNotice, showProfileError, t])

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

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

    setIsSaving(true)

    try {
      const message = await saveTenantPersonalProfile({
        fullName: fullName.trim(),
      })
      showProfileSuccess(message ?? t('tenantProfile.personal.saveSuccess'))
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
