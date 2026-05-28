import type { TenantGroupAcceptedMember } from '@/types/tenant'
import styles from '@/styles/TenantGroupDetail.module.css'

interface TenantGroupMemberCardProps {
  member: TenantGroupAcceptedMember
}

export default function TenantGroupMemberCard({ member }: TenantGroupMemberCardProps) {
  const roleClass =
    member.role === 'owner' ? styles.roleOwner : styles.roleMember

  return (
    <div className={styles.memberCard}>
      <img
        src={member.avatarUrl || '/placeholder-avatar.png'}
        alt={member.name}
        className={styles.memberAvatar}
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
