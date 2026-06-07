import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import placeholderAvatar from '@/assets/placeholder-avatar.png'
import { getTenantProfileByUserId, type TenantPublicProfile } from '@/services/tenantService'
import styles from '@/styles/OwnerDashboard.module.css'
import tenantStyles from '@/styles/TenantInterestedTenants.module.css'

export interface TenantProfilePerson {
  userId: string
  name: string
  email: string
  avatarUrl: string
}

interface TenantProfileViewProps {
  person: TenantProfilePerson
  onBack: () => void
}

export default function TenantProfileView({ person, onBack }: TenantProfileViewProps) {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<TenantPublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    getTenantProfileByUserId(person.userId)
      .then((p) => { if (!cancelled) { setProfile(p); setLoading(false) } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [person.userId])

  const avatarSrc = !avatarFailed && person.avatarUrl ? person.avatarUrl : placeholderAvatar

  function situationLabel(s: string) {
    if (s === 'student') return t('tenantDashboard.detail.interested.modal.situationStudent')
    if (s === 'worker') return t('tenantDashboard.detail.interested.modal.situationWorker')
    if (s === 'unemployed') return t('tenantDashboard.detail.interested.modal.situationUnemployed')
    return s
  }

  function levelLabel(v: string) {
    if (v === 'low') return t('tenantDashboard.detail.interested.modal.levelLow')
    if (v === 'medium') return t('tenantDashboard.detail.interested.modal.levelMedium')
    if (v === 'high') return t('tenantDashboard.detail.interested.modal.levelHigh')
    return v
  }

  return (
    <>
      <button type="button" className={styles.ownerModalBack} onClick={onBack}>
        ← {t('ownerDashboard.propertyCard.tenantsBack')}
      </button>

      <div className={tenantStyles.modalHeader}>
        <img
          src={avatarSrc}
          alt={person.name}
          className={tenantStyles.modalAvatar}
          onError={() => setAvatarFailed(true)}
        />
        <div>
          <p className={tenantStyles.modalName}>{person.name}</p>
          <p className={tenantStyles.modalMeta}>{person.email}</p>
        </div>
      </div>

      {loading && <p className={tenantStyles.modalStatus}>{t('tenantDashboard.detail.interested.modal.loading')}</p>}
      {error && <p className={tenantStyles.modalStatus}>{t('tenantDashboard.detail.interested.modal.error')}</p>}

      {profile && !loading && (
        <>
          <p className={tenantStyles.modalMeta} style={{ marginBottom: '0.75rem' }}>
            {profile.age > 0 ? `${profile.age} ${t('ownerDashboard.propertyCard.tenantsYears')}` : ''}
            {profile.situation ? ` · ${situationLabel(profile.situation)}` : ''}
          </p>
          <dl className={tenantStyles.modalFields}>
            <div className={tenantStyles.modalField}>
              <dt>{t('tenantDashboard.detail.interested.modal.budget')}</dt>
              <dd>{profile.budgetMax} €</dd>
            </div>
            <div className={tenantStyles.modalField}>
              <dt>{t('tenantDashboard.detail.interested.modal.area')}</dt>
              <dd>{profile.preferredArea}</dd>
            </div>
            <div className={tenantStyles.modalField}>
              <dt>{t('tenantDashboard.detail.interested.modal.situation')}</dt>
              <dd>{situationLabel(profile.situation)}</dd>
            </div>
            {profile.situation === 'student' && profile.degree && (
              <div className={tenantStyles.modalField}>
                <dt>{t('tenantDashboard.detail.interested.modal.degree')}</dt>
                <dd>{profile.degree}</dd>
              </div>
            )}
            {profile.situation === 'worker' && profile.profession && (
              <div className={tenantStyles.modalField}>
                <dt>{t('tenantDashboard.detail.interested.modal.profession')}</dt>
                <dd>{profile.profession}</dd>
              </div>
            )}
            <div className={tenantStyles.modalField}>
              <dt>{t('tenantDashboard.detail.interested.modal.socialization')}</dt>
              <dd>{levelLabel(profile.socializationLevel)}</dd>
            </div>
            <div className={tenantStyles.modalField}>
              <dt>{t('tenantDashboard.detail.interested.modal.nightlife')}</dt>
              <dd>{levelLabel(profile.nightlifeLevel)}</dd>
            </div>
            <div className={tenantStyles.modalField}>
              <dt>{t('tenantDashboard.detail.interested.modal.pets')}</dt>
              <dd>{profile.pets ? t('tenantDashboard.detail.interested.modal.yes') : t('tenantDashboard.detail.interested.modal.no')}</dd>
            </div>
            <div className={tenantStyles.modalField}>
              <dt>{t('tenantDashboard.detail.interested.modal.smoking')}</dt>
              <dd>{profile.smoking ? t('tenantDashboard.detail.interested.modal.yes') : t('tenantDashboard.detail.interested.modal.no')}</dd>
            </div>
          </dl>
        </>
      )}
    </>
  )
}
