import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import placeholderAvatar from '@/assets/placeholder-avatar.png'
import { getTenantProfileByUserId, type TenantPublicProfile } from '@/services/tenantService'
import styles from '@/styles/TenantInterestedTenants.module.css'
import type { InterestedTenant } from '@/types/tenant'

interface TenantDetailModalProps {
  tenant: InterestedTenant
  onClose: () => void
}

export default function TenantDetailModal({ tenant, onClose }: TenantDetailModalProps) {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<TenantPublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)
    getTenantProfileByUserId(tenant.userId)
      .then((p) => { if (!cancelled) { setProfile(p); setLoading(false) } })
      .catch(() => { if (!cancelled) { setError(true); setLoading(false) } })
    return () => { cancelled = true }
  }, [tenant.userId])

  const avatarSrc = !avatarFailed && tenant.avatarUrl ? tenant.avatarUrl : placeholderAvatar

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
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="close">✕</button>

        <div className={styles.modalHeader}>
          <img
            src={avatarSrc}
            alt={tenant.name}
            className={styles.modalAvatar}
            onError={() => setAvatarFailed(true)}
          />
          <div>
            <p className={styles.modalName}>{tenant.name}</p>
            <p className={styles.modalMeta}>
              {t('tenantDashboard.detail.interested.meta', { age: tenant.age, studies: tenant.studies })}
            </p>
            <div className={styles.modalRing} style={{ '--compatibility': tenant.compatibility } as React.CSSProperties}>
              <span className={styles.ringValue}>{tenant.compatibility}%</span>
            </div>
          </div>
        </div>

        {loading && <p className={styles.modalStatus}>{t('tenantDashboard.detail.interested.modal.loading')}</p>}
        {error && <p className={styles.modalStatus}>{t('tenantDashboard.detail.interested.modal.error')}</p>}

        {profile && !loading && (
          <dl className={styles.modalFields}>
            <div className={styles.modalField}>
              <dt>{t('tenantDashboard.detail.interested.modal.budget')}</dt>
              <dd>{profile.budgetMax} €</dd>
            </div>
            <div className={styles.modalField}>
              <dt>{t('tenantDashboard.detail.interested.modal.area')}</dt>
              <dd>{profile.preferredArea}</dd>
            </div>
            <div className={styles.modalField}>
              <dt>{t('tenantDashboard.detail.interested.modal.situation')}</dt>
              <dd>{situationLabel(profile.situation)}</dd>
            </div>
            {profile.situation === 'student' && profile.degree && (
              <div className={styles.modalField}>
                <dt>{t('tenantDashboard.detail.interested.modal.degree')}</dt>
                <dd>{profile.degree}</dd>
              </div>
            )}
            {profile.situation === 'worker' && profile.profession && (
              <div className={styles.modalField}>
                <dt>{t('tenantDashboard.detail.interested.modal.profession')}</dt>
                <dd>{profile.profession}</dd>
              </div>
            )}
            <div className={styles.modalField}>
              <dt>{t('tenantDashboard.detail.interested.modal.socialization')}</dt>
              <dd>{levelLabel(profile.socializationLevel)}</dd>
            </div>
            <div className={styles.modalField}>
              <dt>{t('tenantDashboard.detail.interested.modal.nightlife')}</dt>
              <dd>{levelLabel(profile.nightlifeLevel)}</dd>
            </div>
            <div className={styles.modalField}>
              <dt>{t('tenantDashboard.detail.interested.modal.pets')}</dt>
              <dd>{profile.pets ? t('tenantDashboard.detail.interested.modal.yes') : t('tenantDashboard.detail.interested.modal.no')}</dd>
            </div>
            <div className={styles.modalField}>
              <dt>{t('tenantDashboard.detail.interested.modal.smoking')}</dt>
              <dd>{profile.smoking ? t('tenantDashboard.detail.interested.modal.yes') : t('tenantDashboard.detail.interested.modal.no')}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  )
}
