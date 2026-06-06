import { ChangeEvent, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import AuthNotice from '@/components/auth/AuthNotice'
import FormField from '@/components/auth/FormField'
import type { Notice } from '@/hooks/useNotice'
import styles from '@/styles/OwnerProfile.module.css'

export interface OwnerProfileFormData {
  fullName: string
  email: string
  displayName: string
  phone: string
}

interface OwnerProfileFormCardProps {
  isExpanded: boolean
  onToggle: () => void
  isLoading: boolean
  isSaving: boolean
  isUploadingAvatar: boolean
  profileImage: string
  onAvatarLoadFailed: () => void
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void
  data: OwnerProfileFormData
  onFieldChange: <K extends keyof OwnerProfileFormData>(field: K, value: OwnerProfileFormData[K]) => void
  notice: Notice
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function OwnerProfileFormCard({
  isExpanded,
  onToggle,
  isLoading,
  isSaving,
  isUploadingAvatar,
  profileImage,
  onAvatarLoadFailed,
  onAvatarChange,
  data,
  onFieldChange,
  notice,
  onSubmit,
}: OwnerProfileFormCardProps) {
  const { t } = useTranslation()

  return (
    <section className={styles.card} aria-labelledby="owner-profile-personal-title">
      <button
        type="button"
        className={styles.cardToggle}
        aria-expanded={isExpanded}
        aria-controls="owner-profile-personal-panel"
        onClick={onToggle}
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
          <form className={styles.form} noValidate onSubmit={onSubmit}>
            <div className={styles.avatarSection}>
              <img
                src={profileImage}
                alt={t('ownerProfile.personal.avatarAlt')}
                className={styles.avatar}
                onError={onAvatarLoadFailed}
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
                    onChange={onAvatarChange}
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
                value={data.fullName}
                onChange={(event) => onFieldChange('fullName', event.target.value)}
                required
              />

              <div>
                <FormField
                  id="owner-profile-email"
                  label={t('ownerProfile.personal.emailLabel')}
                  type="email"
                  value={data.email}
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
                value={data.displayName}
                onChange={(event) => onFieldChange('displayName', event.target.value)}
              />

              <FormField
                id="owner-profile-phone"
                label={t('ownerProfile.personal.phoneLabel')}
                type="tel"
                value={data.phone}
                onChange={(event) => onFieldChange('phone', event.target.value)}
              />
            </div>

            <AuthNotice kind={notice.kind} message={notice.message} />

            <button type="submit" disabled={isSaving || isUploadingAvatar} className={styles.primaryButton}>
              {isSaving ? t('ownerProfile.personal.saving') : t('ownerProfile.personal.save')}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
