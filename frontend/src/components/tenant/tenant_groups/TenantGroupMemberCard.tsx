import { CheckBadgeIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'

import placeholderAvatar from '@/assets/placeholder-avatar.png'
import type { TenantGroupAcceptedMember } from '@/types/tenant'
import styles from '@/styles/TenantGroupDetail.module.css'

interface TenantGroupMemberCardProps {
  member: TenantGroupAcceptedMember
}

export default function TenantGroupMemberCard({ member }: TenantGroupMemberCardProps) {
  const { t } = useTranslation()
  const [imageFailed, setImageFailed] = useState(false)
  const roleClass =
    member.role === 'owner' ? styles.roleOwner : styles.roleMember
  const avatarSrc = !imageFailed && member.avatarUrl ? member.avatarUrl : placeholderAvatar
  const roleLabel = member.role === 'owner'
    ? t('tenantGroups.detail.members.roleOwner')
    : t('tenantGroups.detail.members.roleMember')

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
        <p className={roleClass}>{roleLabel}</p>
        <p className={member.hasAccepted ? styles.memberAccepted : styles.memberPending}>
          {member.hasAccepted ? (
            <>
              <CheckBadgeIcon className={styles.memberStatusIcon} aria-hidden="true" />
              {t('tenantGroups.status.approved')}
            </>
          ) : (
            <>
              <ClockIcon className={styles.memberStatusIcon} aria-hidden="true" />
              {t('tenantGroups.status.pending')}
            </>
          )}
        </p>
        {member.isCurrentUser && <span className={styles.currentUserBadge}>{t('tenantGroups.detail.members.you')}</span>}
      </div>
    </div>
  )
}
