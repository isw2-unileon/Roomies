import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    MagnifyingGlassIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline'

import TenantLayout from '@/components/tenant/TenantLayout'
import TenantGroupCard from '@/components/tenant/tenant_groups/TenantGroupCard'
import TenantGroupFilters from '@/components/tenant/tenant_groups/TenantGroupFilters'
import type { TenantGroupDisplayStatus } from '@/components/tenant/tenant_groups/groupDisplayStatus'
import {
    acceptTenantGroupInvitation,
    listTenantGroups,
    rejectTenantGroupInvitation,
} from '@/services/tenantService'
import styles from '@/styles/TenantGroups.module.css'
import type { TenantGroupListItem } from '@/types/tenant'
import { paths } from '@/routes/paths'

const FULL_GROUP_ERROR = 'group exceeds apartment available spots'
const SORT_OPTIONS: Array<{ value: string; labelKey: string }> = [
    { value: 'recent', labelKey: 'tenantGroups.page.sortOptions.recent' },
    { value: 'name', labelKey: 'tenantGroups.page.sortOptions.name' },
]

function memberFilterToNumber(value: string) {
    if (value === 'all') {
        return undefined
    }
    if (value === '5+') {
        return 5
    }
    const parsedValue = Number(value)
    return Number.isNaN(parsedValue) ? undefined : parsedValue
}

export default function TenantGroupsPage() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [groups, setGroups] = useState<TenantGroupListItem[]>([])
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState<TenantGroupDisplayStatus>('all')
    const [hasApartment, setHasApartment] = useState('all')
    const [selectedMembers, setSelectedMembers] = useState('all')
    const [sort, setSort] = useState('recent')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [respondingInvitationId, setRespondingInvitationId] = useState<string | null>(null)

    const loadGroups = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const loadedGroups = await listTenantGroups({
                search,
                status,
                hasApartment,
                members: memberFilterToNumber(selectedMembers),
                sort,
            })
            setGroups(loadedGroups)
        } catch (loadError) {
            setGroups([])
            setError(loadError instanceof Error ? loadError.message : t('tenantGroups.detail.errors.generic'))
        } finally {
            setLoading(false)
        }
    }, [hasApartment, search, selectedMembers, sort, status, t])

    useEffect(() => {
        void loadGroups()
    }, [loadGroups])

    function handleClearFilters() {
        setSearch('')
        setStatus('all')
        setHasApartment('all')
        setSelectedMembers('all')
        setSort('recent')
        setNotice('')
    }

    function translateCapacityError(message: string) {
        if (message === FULL_GROUP_ERROR) {
            return t('tenantGroups.detail.errors.capacityFull')
        }
        return message
    }

    async function handleAcceptInvitation(group: TenantGroupListItem) {
        if (!group.invitationId) {
            setError(t('tenantGroups.detail.errors.generic'))
            return
        }
        setRespondingInvitationId(group.invitationId)
        setError('')
        setNotice('')
        try {
            await acceptTenantGroupInvitation(group.invitationId)
            setNotice(t('tenantGroups.detail.viewer.requesting'))
            await loadGroups()
        } catch (acceptError) {
            const message = acceptError instanceof Error ? acceptError.message : t('tenantGroups.detail.errors.generic')
            setError(translateCapacityError(message))
        } finally {
            setRespondingInvitationId(null)
        }
    }

    async function handleRejectInvitation(group: TenantGroupListItem) {
        if (!group.invitationId) {
            setError(t('tenantGroups.detail.errors.generic'))
            return
        }
        setRespondingInvitationId(group.invitationId)
        setError('')
        setNotice('')
        try {
            await rejectTenantGroupInvitation(group.invitationId)
            setNotice(t('tenantGroups.status.rejected'))
            await loadGroups()
        } catch (rejectError) {
            setError(rejectError instanceof Error ? rejectError.message : t('tenantGroups.detail.errors.generic'))
        } finally {
            setRespondingInvitationId(null)
        }
    }

    return (
        <TenantLayout>
            <div className={styles.content}>
                <section className={styles.header}>
                    <div>
                        <h1 className={styles.title}>{t('tenantGroups.page.title')}</h1>
                        <p className={styles.subtitle}>{t('tenantGroups.page.subtitle')}</p>
                    </div>
                </section>

                <div className={styles.pageGrid}>
                    <section className={styles.mainColumn}>
                        <div className={styles.toolbar}>
                            <label className={styles.searchBox}>
                                <MagnifyingGlassIcon
                                    className={styles.iconSmall}
                                    aria-hidden="true"
                                />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder={t('tenantGroups.page.searchPlaceholder')}
                                    aria-label={t('tenantGroups.page.searchPlaceholder')}
                                />
                            </label>

                            <div className={styles.toolbarActions}>
                                <button
                                    type="button"
                                    className={styles.createButton}
                                    onClick={() => navigate(paths.tenantCreateGroup)}
                                >
                                    <UserGroupIcon
                                        className={styles.iconSmall}
                                        aria-hidden="true"
                                    />
                                    {t('tenantGroups.page.createButton')}
                                </button>
                            </div>
                        </div>

                        <div className={styles.resultsBar}>
                            <span>
                                {loading
                                    ? t('tenantGroups.page.loading')
                                    : t('tenantGroups.page.resultsCount', { count: groups.length })}
                            </span>

                            <label className={styles.sortControl}>
                                {t('tenantGroups.page.sortLabel')}
                                <select
                                    className={styles.sortSelect}
                                    value={sort}
                                    onChange={(event) => setSort(event.target.value)}
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {t(option.labelKey)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {notice ? (
                            <div className={styles.statusMessage}>
                                {notice}
                            </div>
                        ) : null}

                        {error ? (
                            <div className={styles.errorState}>
                                {error}
                            </div>
                        ) : null}

                        {loading ? (
                            <div className={styles.loadingState}>
                                {t('tenantGroups.page.loading')}
                            </div>
                        ) : (
                            <div className={styles.groupList}>
                                {groups.length > 0 ? (
                                    groups.map((group) => (
                                        <TenantGroupCard
                                            key={group.id}
                                            group={group}
                                            onAcceptInvitation={handleAcceptInvitation}
                                            onRejectInvitation={handleRejectInvitation}
                                            isRespondingInvitation={respondingInvitationId === group.invitationId}
                                            onMutated={loadGroups}
                                        />
                                    ))
                                ) : (
                                    <div className={styles.empty}>
                                        <div>
                                            <p className={styles.emptyTitle}>
                                                {t('tenantGroups.page.empty.title')}
                                            </p>
                                            <p className={styles.emptySubtitle}>
                                                {t('tenantGroups.page.empty.subtitle')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    <TenantGroupFilters
                        selectedMembers={selectedMembers}
                        onSelectedMembersChange={setSelectedMembers}
                        status={status}
                        onStatusChange={setStatus}
                        hasApartment={hasApartment}
                        onHasApartmentChange={setHasApartment}
                        onClearFilters={handleClearFilters}
                    />
                </div>
            </div>
        </TenantLayout>
    )
}
