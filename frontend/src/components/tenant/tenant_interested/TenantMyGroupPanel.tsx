import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import placeholderAvatar from '@/assets/placeholder-avatar.png'
import { paths } from '@/routes/paths'
import styles from '@/styles/TenantInterestedTenants.module.css'
import type { TenantGroupDetailItem } from '@/types/tenant'

interface TenantMyGroupPanelProps {
  group: TenantGroupDetailItem | null
  propertyId: string
  loading: boolean
}

function MemberSlot({ avatarUrl, name }: { avatarUrl: string; name: string }) {
  const [failed, setFailed] = useState(false)
  const src = !failed && avatarUrl ? avatarUrl : placeholderAvatar
  return (
    <div className={styles.memberSlot}>
      <img src={src} alt={name} className={styles.slotAvatar} onError={() => setFailed(true)} />
      <span className={styles.slotName}>{name}</span>
    </div>
  )
}

function EmptySlot() {
  const { t } = useTranslation()
  return (
    <div className={`${styles.memberSlot} ${styles.memberSlotEmpty}`}>
      <div className={styles.slotAvatarEmpty} />
      <span className={styles.slotNameEmpty}>{t('tenantDashboard.detail.interested.myGroup.emptySlot')}</span>
    </div>
  )
}

export default function TenantMyGroupPanel({ group, propertyId, loading }: TenantMyGroupPanelProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const totalSpots = group?.apartment?.totalSpots ?? group?.acceptedMembersCount ?? 0
  const acceptedMembers = group?.members.filter((m) => m.status === 'ACCEPTED') ?? []
  const emptySlots = Math.max(0, totalSpots - acceptedMembers.length)

  function handleCreate() {
    navigate(paths.tenantCreateGroup, {
      state: { preselectedApartmentId: propertyId },
    })
  }

  return (
    <aside className={styles.myGroupPanel}>
      <h2 className={styles.panelTitle}>{t('tenantDashboard.detail.interested.myGroup.title')}</h2>

      {loading && <p className={styles.panelLoading}>…</p>}

      {!loading && !group && (
        <>
          <p className={styles.panelEmpty}>
            {t('tenantDashboard.detail.interested.myGroup.noGroup')}
          </p>
          <button className={styles.panelButton} onClick={handleCreate}>
            {t('tenantDashboard.detail.interested.myGroup.createGroup')}
          </button>
        </>
      )}

      {!loading && group && (
        <>
          <p className={styles.panelGroupName}>{group.name}</p>

          <div className={styles.memberSlots}>
            {acceptedMembers.map((m) => (
              <MemberSlot
                key={m.userId}
                avatarUrl={m.avatarUrl}
                name={m.isCurrentUser ? t('tenantDashboard.detail.interested.myGroup.you') : m.name}
              />
            ))}
            {Array.from({ length: emptySlots }).map((_, i) => (
              <EmptySlot key={`empty-${i}`} />
            ))}
          </div>

          <Link to={paths.tenantGroups} className={styles.panelButton} style={{ textAlign: 'center', display: 'block', marginTop: '1rem' }}>
            {t('tenantDashboard.detail.interested.myGroup.goToGroup')}
          </Link>
        </>
      )}
    </aside>
  )
}
