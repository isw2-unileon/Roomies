import placeholderAvatar from '@/assets/placeholder-avatar.png'
import type { TenantGroupInvitation } from '@/types/tenant'
import styles from '@/styles/TenantGroupDetail.module.css'

interface TenantGroupInvitationCardProps {
  invitation: TenantGroupInvitation
  onAccept?: (invitation: TenantGroupInvitation) => void
  onReject?: (invitation: TenantGroupInvitation) => void
  isResponding?: boolean
}

export default function TenantGroupInvitationCard({
  invitation,
  onAccept,
  onReject,
  isResponding = false,
}: TenantGroupInvitationCardProps) {
  return (
    <div className={styles.invitationCard}>
      <img
        src={invitation.user.avatarUrl || placeholderAvatar}
        alt={invitation.user.name}
        className={styles.memberAvatar}
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = placeholderAvatar
        }}
      />
      <div className={styles.invitationInfo}>
        <p>{invitation.user.name}</p>
        <p>{invitation.user.university}</p>
      </div>
      {onAccept || onReject ? (
        <div className={styles.invitationActions}>
          <button
            disabled={isResponding}
            onClick={() => onAccept && onAccept(invitation)}
            className={styles.acceptButton}
          >
            {isResponding ? 'Aceptando...' : 'Aceptar'}
          </button>
          <button
            disabled={isResponding}
            onClick={() => onReject && onReject(invitation)}
            className={styles.rejectButton}
          >
            {isResponding ? 'Rechazando...' : 'Rechazar'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
