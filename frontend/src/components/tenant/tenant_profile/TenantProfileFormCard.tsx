import { ChangeEvent, FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import AuthNotice from '@/components/auth/AuthNotice'
import FormField from '@/components/auth/FormField'
import SegmentedLevelField from '@/components/common/SegmentedLevelField'
import type { Notice } from '@/hooks/useNotice'
import styles from '@/styles/TenantProfile.module.css'

type TenantSituation = 'student' | 'worker' | 'unemployed'
type TenantSex = 'male' | 'female' | 'other' | 'prefer_not_to_say'
type TenantLevel = 'low' | 'medium' | 'high'

export interface TenantProfileFormData {
  fullName: string
  email: string
  age: string
  sex: TenantSex
  situation: TenantSituation
  degree: string
  profession: string
  budgetMax: string
  preferredArea: string
  pets: boolean
  smoking: boolean
  socializationLevel: TenantLevel
  nightlifeLevel: TenantLevel
}

interface TenantProfileFormCardProps {
  isExpanded: boolean
  onToggle: () => void
  isLoading: boolean
  isSaving: boolean
  isUploadingAvatar: boolean
  profileImage: string
  onAvatarLoadFailed: () => void
  onAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void
  data: TenantProfileFormData
  onFieldChange: <K extends keyof TenantProfileFormData>(field: K, value: TenantProfileFormData[K]) => void
  notice: Notice
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function TenantProfileFormCard({
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
}: TenantProfileFormCardProps) {
  const { t } = useTranslation()

  const socializationOptions = [
    { value: 'low', label: t('tenantProfile.tenantData.levelOptions.low'), note: t('tenantProfile.tenantData.socializationNotes.low') },
    { value: 'medium', label: t('tenantProfile.tenantData.levelOptions.medium') },
    { value: 'high', label: t('tenantProfile.tenantData.levelOptions.high'), note: t('tenantProfile.tenantData.socializationNotes.high') },
  ]

  const nightlifeOptions = [
    { value: 'low', label: t('tenantProfile.tenantData.levelOptions.low') },
    { value: 'medium', label: t('tenantProfile.tenantData.levelOptions.medium') },
    { value: 'high', label: t('tenantProfile.tenantData.levelOptions.high') },
  ]

  return (
    <section className={styles.card} aria-labelledby="tenant-profile-personal-title">
      <button
        type="button"
        className={styles.cardToggle}
        aria-expanded={isExpanded}
        aria-controls="tenant-profile-personal-panel"
        onClick={onToggle}
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
          <form className={styles.form} noValidate onSubmit={onSubmit}>
            <div className={styles.avatarSection}>
              <img
                src={profileImage}
                alt={t('tenantProfile.personal.avatarAlt')}
                className={styles.avatar}
                onError={onAvatarLoadFailed}
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
                    onChange={onAvatarChange}
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
                value={data.fullName}
                onChange={(event) => onFieldChange('fullName', event.target.value)}
                required
              />

              <div>
                <FormField
                  id="tenant-profile-email"
                  label={t('tenantProfile.personal.emailLabel')}
                  type="email"
                  value={data.email}
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
                value={data.age}
                onChange={(event) => onFieldChange('age', event.target.value)}
                required
              />

              <div className={styles.field}>
                <label htmlFor="tenant-data-sex" className={styles.fieldLabel}>
                  {t('tenantProfile.tenantData.sexLabel')}
                </label>
                <select
                  id="tenant-data-sex"
                  value={data.sex}
                  onChange={(event) => onFieldChange('sex', event.target.value as TenantSex)}
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
                value={data.situation}
                onChange={(event) => onFieldChange('situation', event.target.value as TenantSituation)}
                className={styles.select}
              >
                <option value="student">{t('tenantProfile.tenantData.situationOptions.student')}</option>
                <option value="worker">{t('tenantProfile.tenantData.situationOptions.worker')}</option>
                <option value="unemployed">{t('tenantProfile.tenantData.situationOptions.unemployed')}</option>
              </select>
            </div>

            {data.situation === 'student' ? (
              <FormField
                id="tenant-data-degree"
                label={t('tenantProfile.tenantData.degreeLabel')}
                type="text"
                value={data.degree}
                onChange={(event) => onFieldChange('degree', event.target.value)}
                required
              />
            ) : null}

            {data.situation === 'worker' ? (
              <FormField
                id="tenant-data-profession"
                label={t('tenantProfile.tenantData.professionLabel')}
                type="text"
                value={data.profession}
                onChange={(event) => onFieldChange('profession', event.target.value)}
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
                value={data.budgetMax}
                onChange={(event) => onFieldChange('budgetMax', event.target.value)}
                required
              />

              <FormField
                id="tenant-data-preferred-area"
                label={t('tenantProfile.tenantData.preferredAreaLabel')}
                type="text"
                value={data.preferredArea}
                onChange={(event) => onFieldChange('preferredArea', event.target.value)}
                placeholder={t('tenantProfile.tenantData.preferredAreaPlaceholder')}
                required
              />
            </div>

            <div className={styles.checkboxGrid}>
              <label className={styles.checkboxCard}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={data.pets}
                  onChange={(event) => onFieldChange('pets', event.target.checked)}
                />
                <span>{t('tenantProfile.tenantData.petsLabel')}</span>
              </label>

              <label className={styles.checkboxCard}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={data.smoking}
                  onChange={(event) => onFieldChange('smoking', event.target.checked)}
                />
                <span>{t('tenantProfile.tenantData.smokerLabel')}</span>
              </label>
            </div>

            <h3 className={styles.sectionTitle}>{t('tenantProfile.tenantData.sections.living')}</h3>

            <SegmentedLevelField
              name="tenant-data-socialization"
              label={t('tenantProfile.tenantData.socializationLabel')}
              value={data.socializationLevel}
              onChange={(v) => onFieldChange('socializationLevel', v as TenantLevel)}
              options={socializationOptions}
            />

            <SegmentedLevelField
              name="tenant-data-nightlife"
              label={t('tenantProfile.tenantData.nightlifeLabel')}
              value={data.nightlifeLevel}
              onChange={(v) => onFieldChange('nightlifeLevel', v as TenantLevel)}
              options={nightlifeOptions}
            />

            <AuthNotice kind={notice.kind} message={notice.message} />

            <button type="submit" disabled={isSaving || isUploadingAvatar} className={styles.primaryButton}>
              {isSaving ? t('tenantProfile.personal.saving') : t('tenantProfile.personal.save')}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
