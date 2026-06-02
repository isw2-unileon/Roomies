import TenantGroupSummary from './TenantGroupSummary'
import TenantGroupMembers from './TenantGroupMembers'
import TenantGroupInvitationCard from './TenantGroupInvitationCard'
import type { TenantGroupDetailItem, TenantGroupInvitation, TenantGroupJoinRequest } from '@/types/tenant'
import styles from '@/styles/TenantGroupDetail.module.css'

interface TenantGroupDetailProps {
  group: TenantGroupDetailItem
  onAcceptGroup?: (group: TenantGroupDetailItem) => void
  isAcceptingGroup?: boolean
  onCreateApartmentApplication?: (group: TenantGroupDetailItem) => void
  isCreatingApartmentApplication?: boolean
  onCreateJoinRequest?: (group: TenantGroupDetailItem) => void
  isCreatingJoinRequest?: boolean
  onVoteJoinRequest?: (groupID: string, request: TenantGroupJoinRequest, decision: 'APPROVE' | 'REJECT') => void
  votingJoinRequestKey?: string | null
  onAcceptInvitation?: (invitation: TenantGroupInvitation) => void
  onRejectInvitation?: (invitation: TenantGroupInvitation) => void
  isRespondingInvitation?: string | null
}

function formatApartmentRequestStatus(status: string) {
	if (status === 'FULLY_CONFIRMED') {
		return 'Aceptada por el propietario'
	}
	if (status === 'REJECTED_BY_OWNER') {
		return 'Rechazada por el propietario'
	}
	if (status === 'CANCELLED') {
		return 'Cancelada'
	}
	if (status === 'PENDING_CONFIRMED_TENANTS') {
		return 'Pendiente de confirmacion del grupo'
	}
	return 'Pendiente de revision del propietario'
}

function canResubmitApartmentRequest(status: string) {
	return status === 'REJECTED_BY_OWNER' || status === 'CANCELLED'
}

export default function TenantGroupDetail({
  group,
  onAcceptGroup,
  isAcceptingGroup = false,
  onCreateApartmentApplication,
  isCreatingApartmentApplication = false,
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
	const canCreateApartmentApplication = Boolean(group.apartment)
		&& group.isFullyAccepted
		&& group.userRelation === 'creator'
		&& (!group.currentApartmentRequest || canResubmitApartmentRequest(group.currentApartmentRequest.status))

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

		{group.apartment ? (
			group.currentApartmentRequest ? (
				<>
					<p className={styles.pendingText}>
						Solicitud grupal al piso: {formatApartmentRequestStatus(group.currentApartmentRequest.status)}
					</p>
					{group.currentApartmentRequest.status === 'FULLY_CONFIRMED' ? (
						<p className={styles.acceptedText}>
							El grupo ya ha sido vinculado definitivamente al piso asignado.
						</p>
					) : null}
					{group.currentApartmentRequest.status === 'REJECTED_BY_OWNER' ? (
						<p className={styles.pendingText}>
							La solicitud fue rechazada por el propietario. {group.userRelation === 'creator' ? 'Puedes volver a enviarla si sigue teniendo sentido para el grupo.' : 'Solo la persona creadora puede decidir si reenviarla.'}
						</p>
					) : null}
					{group.currentApartmentRequest.status === 'CANCELLED' ? (
						<p className={styles.pendingText}>
							La solicitud grupal fue cancelada anteriormente.
						</p>
					) : null}
					{canCreateApartmentApplication ? (
						<button
							type="button"
							className={styles.acceptGroupButton}
							onClick={() => onCreateApartmentApplication?.(group)}
							disabled={isCreatingApartmentApplication}
						>
							{isCreatingApartmentApplication ? 'Reenviando solicitud grupal...' : 'Volver a enviar solicitud grupal'}
						</button>
					) : null}
				</>
			) : canCreateApartmentApplication ? (
				<button
					type="button"
					className={styles.acceptGroupButton}
					onClick={() => onCreateApartmentApplication?.(group)}
					disabled={isCreatingApartmentApplication}
				>
					{isCreatingApartmentApplication ? 'Enviando solicitud grupal...' : 'Solicitar unirse al piso'}
				</button>
			) : group.isFullyAccepted ? (
				<p className={styles.pendingText}>
					Solo la persona creadora del grupo puede enviar la solicitud grupal al piso asignado.
				</p>
			) : (
				<p className={styles.pendingText}>
					El grupo debe estar completamente aceptado antes de solicitar el piso asignado.
				</p>
			)
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
