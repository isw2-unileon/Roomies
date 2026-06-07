import { useState } from 'react'

import TenantProfileView from '@/components/owner/TenantProfileView'
import styles from '@/styles/OwnerDashboard.module.css'
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
          <TenantProfileView person={viewingProfile} onBack={() => setViewingProfile(null)} />
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
