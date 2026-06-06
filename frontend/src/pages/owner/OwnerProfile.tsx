import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import placeholderAvatar from '@/assets/placeholder-avatar.png'
import AuthNotice from '@/components/auth/AuthNotice'
import FormField from '@/components/auth/FormField'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'
import OwnerLayout from '@/components/owner/OwnerLayout'
import { useNotice } from '@/hooks/useNotice'
import { forgotPassword } from '@/services/authService'
import { getOwnerProfile, updateOwnerProfile, uploadOwnerAvatar } from '@/services/ownerService'
import styles from '@/styles/OwnerProfile.module.css'

const MAX_AVATAR_SIZE_BYTES = 1_500_000

export default function OwnerProfile() {
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
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')

  const profileNotice = useNotice()
  const passwordNotice = useNotice()

  const { notice: profileBanner, clearNotice: clearProfileNotice, showError: showProfileError, showSuccess: showProfileSuccess } = profileNotice
  const { notice: passwordBanner, clearNotice: clearPasswordNotice, showError: showPasswordError, showSuccess: showPasswordSuccess } = passwordNotice

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      setIsLoading(true)
      clearProfileNotice()
      try {
        const profile = await getOwnerProfile()
        if (!isMounted) return
        setFullName(profile.fullName)
        setEmail(profile.email)
        setAvatarUrl(profile.avatarUrl)
        setAvatarLoadFailed(false)
        setDisplayName(profile.displayName)
        setPhone(profile.phone)
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

    if (fullName.trim().length < 2) {
      showProfileError(t('ownerProfile.personal.errors.fullNameMin'))
      return
    }

    setIsSaving(true)
    try {
      const message = await updateOwnerProfile({
        fullName: fullName.trim(),
        displayName: displayName.trim(),
        phone: phone.trim(),
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
    if (!email.trim()) {
      showPasswordError(t('ownerProfile.preferences.passwordMissingEmail'))
      return
    }

    setIsSendingReset(true)
    try {
      const message = await forgotPassword(email)
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
          <section className={styles.card} aria-labelledby="owner-profile-personal-title">
            <button
              type="button"
              className={styles.cardToggle}
              aria-expanded={isExpanded}
              aria-controls="owner-profile-personal-panel"
              onClick={() => setIsExpanded((current) => !current)}
            >
              <div>
                <span className={styles.cardEyebrow}>{t('ownerProfile.personal.kicker')}</span>
                <h2 id="owner-profile-personal-title" className={styles.cardTitle}>
                  {t('ownerProfile.personal.title')}
                </h2>
              </div>
              <span className={styles.toggleText}>
                {isExpanded ? t('ownerProfile.personal.close') : t('ownerProfile.personal.edit')}
              </span>
            </button>

            <p className={styles.cardText}>{t('ownerProfile.personal.description')}</p>

            <div id="owner-profile-personal-panel" className={styles.personalPanel} hidden={!isExpanded}>
              {isLoading ? (
                <p className={styles.cardText}>{t('ownerProfile.personal.loading')}</p>
              ) : (
                <form className={styles.form} noValidate onSubmit={handleSubmit}>
                  <div className={styles.avatarSection}>
                    <img
                      src={profileImage}
                      alt={t('ownerProfile.personal.avatarAlt')}
                      className={styles.avatar}
                      onError={() => setAvatarLoadFailed(true)}
                    />
                    <div className={styles.avatarCopy}>
                      <p className={styles.avatarTitle}>{t('ownerProfile.personal.avatarTitle')}</p>
                      <p className={styles.avatarHint}>{t('ownerProfile.personal.avatarHint')}</p>
                      <label className={styles.avatarButton}>
                        {isUploadingAvatar ? t('ownerProfile.personal.avatarUploading') : t('ownerProfile.personal.avatarAction')}
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
                      id="owner-profile-full-name"
                      label={t('ownerProfile.personal.fullNameLabel')}
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                    />

                    <div>
                      <FormField
                        id="owner-profile-email"
                        label={t('ownerProfile.personal.emailLabel')}
                        type="email"
                        value={email}
                        readOnly
                        disabled
                      />
                      <p className={styles.readOnlyHint}>{t('ownerProfile.personal.emailHint')}</p>
                    </div>
                  </div>

                  <div className={styles.formGrid}>
                    <FormField
                      id="owner-profile-display-name"
                      label={t('ownerProfile.personal.displayNameLabel')}
                      type="text"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                    />

                    <FormField
                      id="owner-profile-phone"
                      label={t('ownerProfile.personal.phoneLabel')}
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </div>

                  <AuthNotice kind={profileBanner.kind} message={profileBanner.message} />

                  <button type="submit" disabled={isSaving || isUploadingAvatar} className={styles.primaryButton}>
                    {isSaving ? t('ownerProfile.personal.saving') : t('ownerProfile.personal.save')}
                  </button>
                </form>
              )}
            </div>
          </section>

          <section className={styles.card} aria-labelledby="owner-profile-preferences-title">
            <div>
              <span className={styles.cardEyebrow}>{t('ownerProfile.preferences.kicker')}</span>
              <h2 id="owner-profile-preferences-title" className={styles.cardTitle}>
                {t('ownerProfile.preferences.title')}
              </h2>
            </div>
            <p className={styles.cardText}>{t('ownerProfile.preferences.description')}</p>

            <div className={styles.preferenceRow}>
              <div>
                <h3 className={styles.preferenceTitle}>{t('ownerProfile.preferences.languageTitle')}</h3>
                <p className={styles.preferenceText}>{t('ownerProfile.preferences.languageDescription')}</p>
              </div>
              <LanguageSwitcher />
            </div>

            <div className={styles.preferenceRow}>
              <div>
                <h3 className={styles.preferenceTitle}>{t('ownerProfile.preferences.passwordTitle')}</h3>
                <p className={styles.preferenceText}>{t('ownerProfile.preferences.passwordDescription')}</p>
              </div>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handlePasswordReset}
                disabled={isSendingReset || isLoading}
              >
                {isSendingReset ? t('ownerProfile.preferences.passwordSending') : t('ownerProfile.preferences.passwordAction')}
              </button>
            </div>

            <AuthNotice kind={passwordBanner.kind} message={passwordBanner.message} />
          </section>
        </div>
      </div>
    </OwnerLayout>
  )
}
