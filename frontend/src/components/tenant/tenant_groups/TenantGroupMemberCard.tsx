import { useState } from 'react'
import placeholderAvatar from '@/assets/placeholder-avatar.png'
import type { TenantGroupAcceptedMember } from '@/types/tenant'
import styles from '@/styles/TenantGroupDetail.module.css'

interface TenantGroupMemberCardProps {
  member: TenantGroupAcceptedMember
}

export default function TenantGroupMemberCard({ member }: TenantGroupMemberCardProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const roleClass =
    member.role === 'owner' ? styles.roleOwner : styles.roleMember
  const avatarSrc = !imageFailed && member.avatarUrl ? member.avatarUrl : placeholderAvatar

  return (
    <div className={styles.memberCard}>
      <img
        src={avatarSrc}
        alt={member.name}
        className={styles.memberAvatar}
        onError={() => setImageFailed(true)}
      />
      <div className={styles.memberInfo}>
        <p className={styles.memberName}>{member.name}</p>
        <p className={roleClass}>{member.role}</p>
        <p className={member.hasAccepted ? styles.memberAccepted : styles.memberPending}>
          {member.hasAccepted ? 'Acepto el grupo' : 'Pendiente de aceptar'}
        </p>
        {member.isCurrentUser && <span className={styles.currentUserBadge}>Tú</span>}
      </div>
    </div>
  )
}
