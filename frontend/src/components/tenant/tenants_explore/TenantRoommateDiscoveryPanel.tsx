import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserGroupIcon } from '@heroicons/react/24/outline'

import placeholderAvatar from '@/assets/placeholder-avatar.png'
import TenantDetailModal from '@/components/tenant/tenant_interested/TenantDetailModal'
import TenantGroupCard from '@/components/tenant/tenant_groups/TenantGroupCard'
import { canCreateNewJoinRequest } from '@/components/tenant/tenant_groups/joinRequestStatus'
import { listTenantGroups, listTenantProfiles } from '@/services/tenantService'
import type { InterestedTenant, TenantGroupListItem, TenantRoommateProfile } from '@/types/tenant'
import styles from '@/styles/TenantDashboard.module.css'

type RoommateFilter = 'all' | 'tenants' | 'groups'

function canRequestToJoinGroup(group: TenantGroupListItem) {
  const totalSpots = group.apartment?.totalSpots ?? 0
  const hasCapacity = totalSpots <= 0 || group.acceptedMembersCount < totalSpots
  return group.userRelation === 'viewer' && hasCapacity && canCreateNewJoinRequest(group.currentJoinRequest)
}

export default function TenantRoommateDiscoveryPanel() {
  const { t } = useTranslation()
  const [profiles, setProfiles] = useState<TenantRoommateProfile[]>([])
  const [groups, setGroups] = useState<TenantGroupListItem[]>([])
  const [filter, setFilter] = useState<RoommateFilter>('all')
  const [selectedTenant, setSelectedTenant] = useState<InterestedTenant | null>(null)
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [profilesError, setProfilesError] = useState('')
  const [groupsError, setGroupsError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let ignoreResult = false

    async function loadProfiles() {
      setLoadingProfiles(true)
      setProfilesError('')
      try {
        const loadedProfiles = await listTenantProfiles()
        if (!ignoreResult) {
          setProfiles(loadedProfiles)
        }
      } catch (error) {
        if (!ignoreResult) {
          setProfiles([])
          setProfilesError(error instanceof Error ? error.message : t('tenantDashboard.roommates.profilesError'))
        }
      } finally {
        if (!ignoreResult) {
          setLoadingProfiles(false)
        }
      }
    }

    void loadProfiles()

    return () => {
      ignoreResult = true
    }
  }, [t])

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true)
    setGroupsError('')
    try {
      const loadedGroups = await listTenantGroups({ status: 'all', sort: 'recent' })
      setGroups(loadedGroups)
    } catch (error) {
      setGroups([])
      setGroupsError(error instanceof Error ? error.message : t('tenantDashboard.roommates.groupsError'))
    } finally {
      setLoadingGroups(false)
    }
  }, [t])

  useEffect(() => {
    void loadGroups()
  }, [loadGroups])

  const requestableGroups = useMemo(() => groups.filter(canRequestToJoinGroup), [groups])
  const showProfiles = filter === 'all' || filter === 'tenants'
  const showGroups = filter === 'all' || filter === 'groups'

  function roommateProfileToInterestedTenant(profile: TenantRoommateProfile): InterestedTenant {
    return {
      userId: profile.userId,
      name: profile.name,
      age: profile.age,
      studies: profile.degree || profile.profession || profile.situation,
      avatarUrl: profile.avatarUrl,
      compatibility: profile.compatibility,
    }
  }

  return (
    <div className={styles.roommatePanel}>
      {notice ? <p className={styles.successText}>{notice}</p> : null}

      <label className={styles.roommateFilter}>
        <span>{t('tenantDashboard.roommates.filterLabel')}</span>
        <select value={filter} onChange={(event) => setFilter(event.target.value as RoommateFilter)}>
          <option value="all">{t('tenantDashboard.roommates.filterAll')}</option>
          <option value="tenants">{t('tenantDashboard.roommates.filterTenants')}</option>
          <option value="groups">{t('tenantDashboard.roommates.filterGroups')}</option>
        </select>
      </label>

      {showProfiles ? <section className={styles.discoverySection}>
        <div className={styles.discoveryHeader}>
          <div>
            <h2 className={styles.discoveryTitle}>{t('tenantDashboard.roommates.profilesTitle')}</h2>
            <p className={styles.discoverySubtitle}>{t('tenantDashboard.roommates.profilesSubtitle')}</p>
          </div>
        </div>

        {profilesError ? <p role="alert" className={styles.errorText}>{profilesError}</p> : null}
        {loadingProfiles ? (
          <p role="status" className={styles.loadingText}>{t('tenantDashboard.roommates.loadingProfiles')}</p>
        ) : profiles.length > 0 ? (
          <div className={styles.profileGrid}>
            {profiles.map((profile) => (
              <button
                key={profile.userId}
                type="button"
                className={styles.profileCard}
                onClick={() => setSelectedTenant(roommateProfileToInterestedTenant(profile))}
                aria-label={t('tenantDashboard.roommates.viewProfile', { name: profile.name })}
              >
                <img
                  className={styles.profileAvatar}
                  src={profile.avatarUrl || placeholderAvatar}
                  alt={profile.name}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = placeholderAvatar
                  }}
                />
                <div className={styles.profileCardBody}>
                  <div className={styles.profileCardHeader}>
                    <h3 className={styles.profileName}>{profile.name}</h3>
                    <span className={styles.compatibilityPill}>
                      {t('tenantDashboard.roommates.compatibility', { count: profile.compatibility })}
                    </span>
                  </div>
                  <p className={styles.profileMeta}>
                    {profile.age > 0 ? `${profile.age} · ` : ''}{profile.degree || profile.profession || profile.situation}
                  </p>
                  <p className={styles.profileMeta}>{profile.preferredArea}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.emptyDiscoveryText}>{t('tenantDashboard.roommates.noProfiles')}</p>
        )}
      </section> : null}

      {showGroups ? <section className={styles.discoverySection}>
        <div className={styles.discoveryHeader}>
          <div>
            <h2 className={styles.discoveryTitle}>{t('tenantDashboard.roommates.groupsTitle')}</h2>
            <p className={styles.discoverySubtitle}>{t('tenantDashboard.roommates.groupsSubtitle')}</p>
          </div>
          <UserGroupIcon className={styles.discoveryHeaderIcon} aria-hidden="true" />
        </div>

        {groupsError ? <p role="alert" className={styles.errorText}>{groupsError}</p> : null}
        {loadingGroups ? (
          <p role="status" className={styles.loadingText}>{t('tenantDashboard.roommates.loadingGroups')}</p>
        ) : requestableGroups.length > 0 ? (
          <div className={styles.requestableGroupList}>
            {requestableGroups.map((group) => (
              <TenantGroupCard
                key={group.id}
                group={group}
                onAcceptInvitation={() => undefined}
                onRejectInvitation={() => undefined}
                onMutated={loadGroups}
                onNotice={setNotice}
              />
            ))}
          </div>
        ) : (
          <p className={styles.emptyDiscoveryText}>{t('tenantDashboard.roommates.noGroups')}</p>
        )}
      </section> : null}

      {selectedTenant ? (
        <TenantDetailModal tenant={selectedTenant} onClose={() => setSelectedTenant(null)} />
      ) : null}
    </div>
  )
}
