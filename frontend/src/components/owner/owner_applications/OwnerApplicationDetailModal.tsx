import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import placeholderAvatar from '@/assets/placeholder-avatar.png'
import { getTenantProfileByUserId, type TenantPublicProfile } from '@/services/tenantService'
import styles from '@/styles/OwnerDashboard.module.css'
import tenantStyles from '@/styles/TenantInterestedTenants.module.css'
import type { OwnerApplicationApplicant, OwnerApplicationGroupMember, OwnerDashboardRequest } from '@/types/owner'

interface OwnerApplicationDetailModalProps {
  request: OwnerDashboardRequest
  actingApplicationKey: string | null
  onApprove: (applicationID: string) => void
  onReject: (applicationID: string) => void
  onClose: () => void
}

type PersonEntry = { userId: string; name: string; email: string; avatarUrl: string; compatibilityScore?: number }

function toPersonEntry(a: OwnerApplicationApplicant | OwnerApplicationGroupMember): PersonEntry {
  return { userId: a.userId, name: a.name, email: a.email, avatarUrl: a.avatarUrl, compatibilityScore: 'compatibilityScore' in a ? a.compatibilityScore : undefined }
}

function formatStatus(status: string) {
  if (status === 'FULLY_CONFIRMED') return 'Aceptada'
  if (status === 'REJECTED_BY_OWNER') return 'Rechazada'
  if (status === 'CANCELLED') return 'Cancelada'
  if (status === 'PENDING_CONFIRMED_TENANTS') return 'Pendiente del grupo'
  return 'Pendiente'
}

function ProfileView({ person, onBack }: { person: PersonEntry; onBack: () => void }) {
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
        ← Volver
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
            {profile.age > 0 ? `${profile.age} años` : ''}
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

export default function OwnerApplicationDetailModal({ request, actingApplicationKey, onApprove, onReject, onClose }: OwnerApplicationDetailModalProps) {
  const [viewingProfile, setViewingProfile] = useState<PersonEntry | null>(null)
  const isPending = request.status === 'PENDING_OWNER'
  const approveKey = `${request.id}:approve`
  const rejectKey = `${request.id}:reject`

  const people: PersonEntry[] = []
  if (request.type === 'group' && request.group) {
    for (const m of request.group.members) {
      people.push(toPersonEntry(m))
    }
  } else if (request.tenant) {
    people.push(toPersonEntry(request.tenant))
  }

  return (
    <div className={styles.ownerModalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.ownerModalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.ownerModalClose} onClick={onClose} aria-label="close">✕</button>

        {viewingProfile ? (
          <ProfileView person={viewingProfile} onBack={() => setViewingProfile(null)} />
        ) : (
          <>
            <h2 className={styles.ownerRequestDetailTitle}>Detalle de la solicitud</h2>
            <p className={styles.ownerRequestDetailMeta}>
              {request.type === 'group' ? 'Solicitud grupal' : 'Solicitud individual'} · {request.propertyTitle}
            </p>
            <p className={styles.ownerRequestDetailMeta}>Dirección: {request.address}</p>
            <p className={styles.ownerRequestDetailMeta}>Estado: {formatStatus(request.status)}</p>
            <p className={styles.ownerRequestDetailMeta}>Fecha: {request.createdAt}</p>
            {request.compatibilityScore != null && request.compatibilityScore > 0 && (
              <p className={styles.ownerRequestDetailMeta}>
                Compatibilidad{request.type === 'group' ? ' media' : ''}: <span className={styles.ownerCompatBadge}>{request.compatibilityScore}%</span>
              </p>
            )}

            {request.group && (
              <>
                <p className={styles.ownerRequestDetailMeta}>Grupo: {request.group.name}</p>
                <p className={styles.ownerRequestDetailMeta}>Creador: {request.group.creator.name} · {request.group.creator.email}</p>
                <p className={styles.ownerRequestDetailMeta}>Miembros totales: {request.group.members.length}</p>
              </>
            )}

            <ul className={styles.ownerRequestMembersList}>
              {people.map((person) => (
                <li key={person.userId} className={styles.ownerRequestMemberItem}>
                  <strong>{person.name}</strong>
                  {person.compatibilityScore != null && person.compatibilityScore > 0 && (
                    <span className={styles.ownerCompatBadge}>{person.compatibilityScore}%</span>
                  )}
                  <button
                    type="button"
                    className={styles.ownerProfileViewButton}
                    onClick={() => setViewingProfile(person)}
                  >
                    Ver perfil
                  </button>
                </li>
              ))}
            </ul>

            {isPending && (
              <div className={styles.ownerActionGroup}>
                <button
                  type="button"
                  className={`${styles.ownerActionButton} ${styles.ownerActionAccept}`}
                  onClick={() => onApprove(request.id)}
                  disabled={actingApplicationKey === approveKey}
                >
                  {actingApplicationKey === approveKey ? 'Aprobando...' : 'Aceptar solicitud'}
                </button>
                <button
                  type="button"
                  className={`${styles.ownerActionButton} ${styles.ownerActionReject}`}
                  onClick={() => onReject(request.id)}
                  disabled={actingApplicationKey === rejectKey}
                >
                  {actingApplicationKey === rejectKey ? 'Rechazando...' : 'Rechazar solicitud'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
