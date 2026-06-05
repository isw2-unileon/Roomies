import { useTranslation } from 'react-i18next'

import TenantGroupMemberCard from './TenantGroupMemberCard'
import styles from '@/styles/TenantGroupDetail.module.css'
import type { TenantGroupAcceptedMember } from '@/types/tenant'

interface TenantGroupMembersProps {
  members: TenantGroupAcceptedMember[]
}

export default function TenantGroupMembers({ members }: TenantGroupMembersProps) {
  const { t } = useTranslation()
  if (members.length === 0) {
    return <p className={styles.emptyState}>{t('tenantGroups.detail.members.empty')}</p>
  }

  return (
    <div className={styles.membersList}>
      {members.map((member) => (
        <TenantGroupMemberCard key={member.userId} member={member} />
      ))}
    </div>
  )
}
