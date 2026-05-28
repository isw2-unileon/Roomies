import TenantGroupMemberCard from './TenantGroupMemberCard'
import styles from '@/styles/TenantGroupDetail.module.css'
import type { TenantGroupAcceptedMember } from '@/types/tenant'

interface TenantGroupMembersProps {
  members: TenantGroupAcceptedMember[]
}

export default function TenantGroupMembers({ members }: TenantGroupMembersProps) {
  if (members.length === 0) {
    return <p>No hay miembros en este grupo aun.</p>
  }

  return (
    <div className={styles.membersList}>
      {members.map((member) => (
        <TenantGroupMemberCard key={member.userId} member={member} />
      ))}
    </div>
  )
}
