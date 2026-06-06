import { useState } from 'react'
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
  const [imageFailed, setImageFailed] = useState(false)
  const avatarSrc = !imageFailed && invitation.user.avatarUrl ? invitation.user.avatarUrl : placeholderAvatar

  return (
    <div className={styles.invitationCard}>
      <img
        src={avatarSrc}
        alt={invitation.user.name}
        className={styles.memberAvatar}
        onError={() => setImageFailed(true)}
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
