import TenantGroupSummary from './TenantGroupSummary'
import TenantGroupMembers from './TenantGroupMembers'
import TenantGroupInvitationCard from './TenantGroupInvitationCard'
import type { TenantGroupDetailItem, TenantGroupInvitation, TenantGroupJoinRequest } from '@/types/tenant'
import styles from '@/styles/TenantGroupDetail.module.css'

interface TenantGroupDetailProps {
  group: TenantGroupDetailItem
  onAcceptGroup?: (group: TenantGroupDetailItem) => void
  isAcceptingGroup?: boolean
  onCreateJoinRequest?: (group: TenantGroupDetailItem) => void
  isCreatingJoinRequest?: boolean
  onVoteJoinRequest?: (groupID: string, request: TenantGroupJoinRequest, decision: 'APPROVE' | 'REJECT') => void
  votingJoinRequestKey?: string | null
  onAcceptInvitation?: (invitation: TenantGroupInvitation) => void
  onRejectInvitation?: (invitation: TenantGroupInvitation) => void
  isRespondingInvitation?: string | null
}

export default function TenantGroupDetail({
  group,
  onAcceptGroup,
  isAcceptingGroup = false,
  onCreateJoinRequest,
  isCreatingJoinRequest = false,
  onVoteJoinRequest,
  votingJoinRequestKey,
  onAcceptInvitation,
  onRejectInvitation,
  isRespondingInvitation,
}: TenantGroupDetailProps) {
  const canAcceptGroup =
    !group.isFullyAccepted
    && (group.userRelation === 'creator'
      || (group.userRelation === 'member' && group.members.some((member) => member.isCurrentUser && !member.hasAccepted)))

  const canCreateJoinRequest = group.userRelation === 'viewer'

  return (
    <div className={styles.detailContainer}>
      <TenantGroupSummary group={group} />

      {canAcceptGroup ? (
        <button
          type="button"
          className={styles.acceptGroupButton}
          onClick={() => onAcceptGroup?.(group)}
          disabled={isAcceptingGroup}
        >
          {isAcceptingGroup ? 'Aceptando grupo...' : 'Aceptar grupo'}
        </button>
      ) : null}

      {canCreateJoinRequest ? (
        <button
          type="button"
          className={styles.acceptGroupButton}
          onClick={() => onCreateJoinRequest?.(group)}
          disabled={isCreatingJoinRequest}
        >
          {isCreatingJoinRequest ? 'Enviando solicitud...' : 'Solicitar unirme'}
        </button>
      ) : null}

      <section className={styles.membersSection}>
        <h3>Miembros</h3>
        <TenantGroupMembers members={group.members} />
      </section>

      {group.pendingInvitations.length > 0 && (
        <section className={styles.invitationsSection}>
          <h3>Invitaciones pendientes</h3>
          <div className={styles.invitationsList}>
            {group.pendingInvitations.map((inv) => (
              <TenantGroupInvitationCard
                key={inv.id}
                invitation={inv}
                onAccept={group.userRelation === 'pending_invitation' ? onAcceptInvitation : undefined}
                onReject={group.userRelation === 'pending_invitation' ? onRejectInvitation : undefined}
                isResponding={isRespondingInvitation === inv.id}
              />
            ))}
          </div>
        </section>
      )}

      {(group.userRelation === 'creator' || group.userRelation === 'member') && group.joinRequests.length > 0 ? (
        <section className={styles.invitationsSection}>
          <h3>Solicitudes de union</h3>
          <div className={styles.invitationsList}>
            {group.joinRequests.map((request) => (
              <div key={request.id} className={styles.invitationCard}>
                <div className={styles.invitationInfo}>
                  <p>{request.requester.name}</p>
                  <p>{request.requester.email}</p>
                  <p>
                    Aprobaciones: {request.votes.filter((vote) => vote.decision === 'APPROVE').length}/{group.members.length}
                  </p>
                </div>
                <div className={styles.invitationActions}>
                  <button
                    type="button"
                    disabled={votingJoinRequestKey === `${request.id}:APPROVE`}
                    onClick={() => onVoteJoinRequest?.(group.id, request, 'APPROVE')}
                    className={styles.acceptButton}
                  >
                    {votingJoinRequestKey === `${request.id}:APPROVE` ? 'Aprobando...' : 'Aprobar'}
                  </button>
                  <button
                    type="button"
                    disabled={votingJoinRequestKey === `${request.id}:REJECT`}
                    onClick={() => onVoteJoinRequest?.(group.id, request, 'REJECT')}
                    className={styles.rejectButton}
                  >
                    {votingJoinRequestKey === `${request.id}:REJECT` ? 'Rechazando...' : 'Rechazar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
