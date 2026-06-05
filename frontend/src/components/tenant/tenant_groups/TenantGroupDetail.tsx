import { useEffect, useState } from 'react'

import TenantGroupSummary from './TenantGroupSummary'
import TenantGroupMembers from './TenantGroupMembers'
import TenantGroupInvitationCard from './TenantGroupInvitationCard'
import TenantGroupApartmentSelector from './TenantGroupApartmentSelector'
import { canCreateNewJoinRequest, getCurrentJoinRequestLabel, isRejectedJoinRequest } from './joinRequestStatus'
import type { TenantGroupDetailItem, TenantGroupInvitation, TenantGroupJoinRequest, TenantProperty } from '@/types/tenant'
import styles from '@/styles/TenantGroupDetail.module.css'

interface TenantGroupDetailProps {
  group: TenantGroupDetailItem
  onAcceptGroup?: (group: TenantGroupDetailItem) => void
  isAcceptingGroup?: boolean
  onDeleteGroup?: (group: TenantGroupDetailItem) => void
  isDeletingGroup?: boolean
  onCreateApartmentApplication?: (group: TenantGroupDetailItem) => void
  isCreatingApartmentApplication?: boolean
  onCreateJoinRequest?: (group: TenantGroupDetailItem) => void
  isCreatingJoinRequest?: boolean
  onVoteJoinRequest?: (groupID: string, request: TenantGroupJoinRequest, decision: 'APPROVE' | 'REJECT') => void
  votingJoinRequestKey?: string | null
  onAcceptInvitation?: (invitation: TenantGroupInvitation) => void
  onRejectInvitation?: (invitation: TenantGroupInvitation) => void
  isRespondingInvitation?: string | null
  onLinkApartment?: (group: TenantGroupDetailItem, apartment: TenantProperty) => void
  isLinkingApartment?: boolean
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
  onDeleteGroup,
  isDeletingGroup = false,
  onCreateApartmentApplication,
  isCreatingApartmentApplication = false,
  onCreateJoinRequest,
  isCreatingJoinRequest = false,
  onVoteJoinRequest,
  votingJoinRequestKey,
  onAcceptInvitation,
  onRejectInvitation,
  isRespondingInvitation,
  onLinkApartment,
  isLinkingApartment = false,
}: TenantGroupDetailProps) {
  const [selectedApartment, setSelectedApartment] = useState<TenantProperty | null>(null)

  useEffect(() => {
    setSelectedApartment(null)
  }, [group.id])

  const isOwner = group.userRelation === 'creator'
  const isOnlyMember = group.members.length === 1
  const canAcceptGroup =
     !group.isFullyAccepted
    && !(isOwner && isOnlyMember)
    && (group.userRelation === 'creator'
      || (group.userRelation === 'member' && group.members.some((member) => member.isCurrentUser && !member.hasAccepted)))

	const currentJoinRequestLabel = getCurrentJoinRequestLabel(group.currentJoinRequest)
	const canCreateJoinRequest = group.userRelation === 'viewer' && canCreateNewJoinRequest(group.currentJoinRequest)
	const hasRejectedJoinRequest = isRejectedJoinRequest(group.currentJoinRequest)
	const canLinkApartment = group.userRelation === 'creator' && !group.apartment
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

      {isOwner ? (
        <button
          type="button"
          className={styles.deleteGroupButton}
          onClick={() => onDeleteGroup?.(group)}
          disabled={isDeletingGroup}
        >
          {isDeletingGroup ? 'Eliminando grupo...' : 'Eliminar grupo'}
        </button>
      ) : null}

      {group.userRelation === 'viewer' && currentJoinRequestLabel ? (
		<p className={hasRejectedJoinRequest ? styles.rejectedText : styles.pendingText}>
			Estado de tu solicitud para unirte a este grupo: {currentJoinRequestLabel}.
			{hasRejectedJoinRequest ? ' No puedes volver a solicitar plaza en este grupo.' : ''}
		</p>
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

	  {canLinkApartment ? (
		<section className={styles.apartmentLinkSection}>
			<h3>Vincular vivienda</h3>
			<p className={styles.sectionHint}>
				Selecciona una vivienda para asociarla a este grupo. Esta accion solo puede hacerse una vez.
			</p>
			<TenantGroupApartmentSelector
				selected={selectedApartment}
				onChange={setSelectedApartment}
				allowEmptySelection={false}
			/>
			<button
				type="button"
				className={styles.acceptGroupButton}
				onClick={() => selectedApartment && onLinkApartment?.(group, selectedApartment)}
				disabled={!selectedApartment || isLinkingApartment}
			>
				{isLinkingApartment ? 'Vinculando vivienda...' : 'Vincular vivienda'}
			</button>
		</section>
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
