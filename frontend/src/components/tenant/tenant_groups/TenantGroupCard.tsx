import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    BanknotesIcon,
    ChevronDownIcon,
    EnvelopeIcon,
    HomeIcon,
    MapPinIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline'

import TenantGroupDetailPanel from './TenantGroupDetailPanel'
import TenantGroupDetailSkeleton from './TenantGroupDetailSkeleton'
import { getGroupBadges, getGroupRequestApprovalProgress, type TenantGroupBadgeTone } from './groupBadges'
import {
    acceptTenantGroup,
    createTenantGroupApartmentApplication,
    createTenantGroupJoinRequest,
    deleteTenantGroup,
    getTenantGroup,
    inviteUsersToTenantGroup,
    leaveTenantGroup,
    listTenantGroupJoinRequests,
    updateTenantGroupApartment,
    voteTenantGroupJoinRequest,
} from '@/services/tenantService'
import styles from '@/styles/TenantGroups.module.css'
import type {
    TenantGroupDetailItem,
    TenantGroupListItem,
    TenantProperty,
} from '@/types/tenant'

interface TenantGroupCardProps {
    group: TenantGroupListItem
    onAcceptInvitation: (group: TenantGroupListItem) => void
    onRejectInvitation: (group: TenantGroupListItem) => void
    isRespondingInvitation?: boolean
    onMutated?: () => void
    onNotice?: (message: string) => void
    mode?: 'management' | 'discovery'
}

const FULL_GROUP_ERROR = 'group exceeds apartment available spots'

function badgeClassName(tone: TenantGroupBadgeTone) {
    switch (tone) {
        case 'positive':
            return `${styles.statusBadge} ${styles.badgePositive}`
        case 'info':
            return `${styles.statusBadge} ${styles.badgeInfo}`
        case 'warning':
            return `${styles.statusBadge} ${styles.badgeWarning}`
        case 'negative':
            return `${styles.statusBadge} ${styles.badgeNegative}`
        case 'neutral':
        default:
            return `${styles.statusBadge} ${styles.badgeNeutral}`
    }
}

function apartmentRequestStatusLabelKey(status: string): string {
    switch (status) {
        case 'FULLY_CONFIRMED':
            return 'tenantGroups.status.fullyConfirmed'
        case 'REJECTED_BY_OWNER':
            return 'tenantGroups.status.rejectedByOwner'
        case 'CANCELLED':
            return 'tenantGroups.status.cancelled'
        case 'PENDING_CONFIRMED_TENANTS':
            return 'tenantGroups.status.pendingConfirmedTenants'
        default:
            return 'tenantGroups.status.pending'
    }
}

export default function TenantGroupCard({
    group,
    onAcceptInvitation,
    onRejectInvitation,
    isRespondingInvitation = false,
    onMutated,
    onNotice,
    mode = 'management',
}: TenantGroupCardProps) {
    const { t } = useTranslation()
    const cardRef = useRef<HTMLElement | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)
    const [detail, setDetail] = useState<TenantGroupDetailItem | null>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [detailError, setDetailError] = useState('')

    const [acceptingGroup, setAcceptingGroup] = useState(false)
    const [deletingGroup, setDeletingGroup] = useState(false)
    const [leavingGroup, setLeavingGroup] = useState(false)
    const [creatingApartmentApplication, setCreatingApartmentApplication] = useState(false)
    const [creatingJoinRequest, setCreatingJoinRequest] = useState(false)
    const [invitingMembers, setInvitingMembers] = useState(false)
    const [linkingApartment, setLinkingApartment] = useState(false)
    const [votingJoinRequestKey, setVotingJoinRequestKey] = useState<string | null>(null)

    const hasPendingInvitation = group.userRelation === 'pending_invitation'
    const isDiscoveryMode = mode === 'discovery'
    const badges = getGroupBadges(group)
    const approvalProgress = getGroupRequestApprovalProgress(group)

    const hasBudget = group.averageBudgetMax > 0
    const hasImage = Boolean(group.apartment?.imageUrl)

    const loadDetail = useCallback(async () => {
        setLoadingDetail(true)
        setDetailError('')
        try {
            const fetched = await getTenantGroup(group.id)
            setDetail(fetched)
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : t('tenantGroups.detail.errors.load'))
        } finally {
            setLoadingDetail(false)
        }
    }, [group.id, t])

    useEffect(() => {
        if (isExpanded && !detail && !loadingDetail) {
            void loadDetail()
        }
    }, [isExpanded, detail, loadingDetail, loadDetail])

    useEffect(() => {
        setIsExpanded(false)
        setDetail(null)
        setDetailError('')
        setVotingJoinRequestKey(null)
    }, [group.id])

    useEffect(() => {
        if (isExpanded && cardRef.current) {
            window.requestAnimationFrame(() => {
                cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            })
        }
    }, [isExpanded])

    function toggleExpanded() {
        setIsExpanded((prev) => !prev)
    }

    function translateError(message: string) {
        if (message === FULL_GROUP_ERROR) {
            return t('tenantGroups.detail.errors.capacityFull')
        }
        return message
    }

    async function handleAcceptGroup(target: TenantGroupDetailItem) {
        setAcceptingGroup(true)
        try {
            await acceptTenantGroup(target.id)
            const refreshed = await getTenantGroup(target.id)
            setDetail(refreshed)
            onMutated?.()
        } catch (err) {
            setDetailError(err instanceof Error ? translateError(err.message) : t('tenantGroups.detail.errors.generic'))
        } finally {
            setAcceptingGroup(false)
        }
    }

    async function handleDeleteGroup(target: TenantGroupDetailItem) {
        setDeletingGroup(true)
        try {
            await deleteTenantGroup(target.id)
            setIsExpanded(false)
            setDetail(null)
            onMutated?.()
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : t('tenantGroups.detail.errors.generic'))
        } finally {
            setDeletingGroup(false)
        }
    }

    async function handleLeaveGroup(target: TenantGroupDetailItem) {
        setLeavingGroup(true)
        setDetailError('')
        try {
            await leaveTenantGroup(target.id)
            setIsExpanded(false)
            setDetail(null)
            onNotice?.(t('tenantGroups.detail.actions.leaveSuccess'))
            onMutated?.()
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : t('tenantGroups.detail.errors.generic'))
        } finally {
            setLeavingGroup(false)
        }
    }

    async function handleCreateApartmentApplication(target: TenantGroupDetailItem) {
        setCreatingApartmentApplication(true)
        try {
            await createTenantGroupApartmentApplication(target.id)
            const refreshed = await getTenantGroup(target.id)
            setDetail(refreshed)
            onMutated?.()
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : t('tenantGroups.detail.errors.generic'))
        } finally {
            setCreatingApartmentApplication(false)
        }
    }

    async function handleCreateJoinRequest(target: TenantGroupDetailItem) {
        setCreatingJoinRequest(true)
        try {
            await createTenantGroupJoinRequest(target.id)
            const refreshed = await getTenantGroup(target.id)
            setDetail(refreshed)
            onMutated?.()
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : t('tenantGroups.detail.errors.generic'))
        } finally {
            setCreatingJoinRequest(false)
        }
    }

    async function handleLinkApartment(target: TenantGroupDetailItem, apartment: TenantProperty) {
        setLinkingApartment(true)
        try {
            await updateTenantGroupApartment(target.id, apartment.id)
            const refreshed = await getTenantGroup(target.id)
            setDetail(refreshed)
            onMutated?.()
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : t('tenantGroups.detail.errors.generic'))
        } finally {
            setLinkingApartment(false)
        }
    }

    async function handleInviteMembers(target: TenantGroupDetailItem, invitedUserIDs: string[]) {
        setInvitingMembers(true)
        try {
            await inviteUsersToTenantGroup(target.id, invitedUserIDs)
            const refreshed = await getTenantGroup(target.id)
            setDetail(refreshed)
            onMutated?.()
        } catch (err) {
            setDetailError(err instanceof Error ? translateError(err.message) : t('tenantGroups.detail.errors.generic'))
            throw err
        } finally {
            setInvitingMembers(false)
        }
    }

    async function handleVoteJoinRequest(groupID: string, requestID: string, decision: 'APPROVE' | 'REJECT') {
        setVotingJoinRequestKey(`${requestID}:${decision}`)
        try {
            await voteTenantGroupJoinRequest(groupID, requestID, decision)
            const [refreshed, joinRequests] = await Promise.all([
                getTenantGroup(groupID),
                listTenantGroupJoinRequests(groupID),
            ])
            setDetail({ ...refreshed, joinRequests })
            onMutated?.()
        } catch (err) {
            setDetailError(err instanceof Error ? err.message : t('tenantGroups.detail.errors.generic'))
        } finally {
            setVotingJoinRequestKey(null)
        }
    }

    return (
        <article
            ref={cardRef}
            className={`${styles.groupCard} ${isExpanded ? styles.groupCardExpanded : ''}`}
        >
            <div className={styles.groupImageWrapper}>
                {hasImage ? (
                    <img
                        className={styles.groupImage}
                        src={group.apartment?.imageUrl}
                        alt={group.apartment?.title ?? group.name}
                        loading="lazy"
                    />
                ) : (
                    <div className={styles.groupPlaceholderImage}>
                        <HomeIcon className={styles.iconMedium} aria-hidden="true" />
                        <span>{t('tenantGroups.card.noApartment')}</span>
                    </div>
                )}
            </div>

            <div className={styles.groupInfo}>
                <div className={styles.groupTitleRow}>
                    <h2 className={styles.groupTitle}>{group.name}</h2>
                    {badges.map((badge) => (
                        <span key={badge.key} className={badgeClassName(badge.tone)}>
                            {t(badge.labelKey)}
                        </span>
                    ))}
                    {approvalProgress ? (
                        <span className={`${styles.statusBadge} ${styles.badgeInfo}`}>
                            {t('tenantGroups.card.approvalProgress', approvalProgress)}
                        </span>
                    ) : null}
                </div>

                {group.apartment ? (
                    <p className={styles.location}>
                        <MapPinIcon className={styles.iconTiny} aria-hidden="true" />
                        {group.apartment.area} · {group.apartment.address}
                    </p>
                ) : (
                    <p className={styles.apartmentEmpty}>
                        <HomeIcon className={styles.iconTiny} aria-hidden="true" />
                        {t('tenantGroups.card.noApartment')}
                    </p>
                )}

                {group.description ? (
                    <p className={styles.description}>{group.description}</p>
                ) : null}

                <div className={styles.groupStats}>
                    <span className={styles.chip}>
                        <UserGroupIcon className={styles.chipIcon} aria-hidden="true" />
                        {t('tenantGroups.card.members', { count: group.acceptedMembersCount })}
                    </span>
                    {group.pendingInvitationsCount > 0 ? (
                        <span className={styles.chip}>
                            <EnvelopeIcon className={styles.chipIcon} aria-hidden="true" />
                            {t('tenantGroups.card.pendingInvitations', { count: group.pendingInvitationsCount })}
                        </span>
                    ) : null}
                </div>
            </div>

            <aside className={styles.groupMeta}>
                <span className={styles.metaItem}>
                    <BanknotesIcon className={styles.iconSmall} aria-hidden="true" />
                    {hasBudget
                        ? t('tenantGroups.card.budgetAverage', { max: group.averageBudgetMax })
                        : t('tenantGroups.detail.budget.notAvailable')}
                </span>

                {group.apartment ? (
                    <span className={styles.metaItem}>
                        <HomeIcon className={styles.iconSmall} aria-hidden="true" />
                        {group.apartment.title} · {group.apartment.baseRent}€/mes
                    </span>
                ) : null}

                {group.currentApartmentRequest ? (
                    <span className={styles.metaItem}>
                        {t(apartmentRequestStatusLabelKey(group.currentApartmentRequest.status))}
                    </span>
                ) : null}

                <div className={styles.cardButtonRow}>
                    <button
                        type="button"
                        className={styles.viewButton}
                        onClick={toggleExpanded}
                        aria-expanded={isExpanded}
                    >
                        <span>
                            {isExpanded
                                ? t('tenantGroups.card.viewGroupOpen')
                                : t('tenantGroups.card.viewGroup')}
                        </span>
                        <ChevronDownIcon
                            className={`${styles.viewButtonChevron} ${isExpanded ? styles.viewButtonChevronOpen : ''}`}
                            aria-hidden="true"
                        />
                    </button>

                    {hasPendingInvitation && !isDiscoveryMode ? (
                        <div className={styles.invitationActions}>
                            <button
                                type="button"
                                className={styles.secondaryButton}
                                onClick={() => onAcceptInvitation(group)}
                                disabled={isRespondingInvitation}
                            >
                                {isRespondingInvitation
                                    ? t('tenantGroups.detail.viewer.requesting')
                                    : t('tenantGroups.detail.actions.acceptGroup')}
                            </button>

                            <button
                                type="button"
                                className={styles.dangerButton}
                                onClick={() => onRejectInvitation(group)}
                                disabled={isRespondingInvitation}
                            >
                                {t('tenantGroups.detail.requests.reject')}
                            </button>
                        </div>
                    ) : null}
                </div>
            </aside>

            {isExpanded ? (
                <div className={styles.modalOverlay} onClick={toggleExpanded} role="dialog" aria-modal="true">
                    <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalContent}>
                            {loadingDetail ? (
                                <TenantGroupDetailSkeleton />
                            ) : detailError ? (
                                <div className={styles.errorState}>{detailError}</div>
                            ) : detail ? (
                                <TenantGroupDetailPanel
                                    group={detail}
                                    onClose={toggleExpanded}
                                    onAcceptGroup={handleAcceptGroup}
                                    isAcceptingGroup={acceptingGroup}
                                    onDeleteGroup={handleDeleteGroup}
                                    isDeletingGroup={deletingGroup}
                                    onLeaveGroup={handleLeaveGroup}
                                    isLeavingGroup={leavingGroup}
                                    onCreateApartmentApplication={handleCreateApartmentApplication}
                                    isCreatingApartmentApplication={creatingApartmentApplication}
                                    onCreateJoinRequest={handleCreateJoinRequest}
                                    isCreatingJoinRequest={creatingJoinRequest}
                                    onInviteMembers={handleInviteMembers}
                                    isInvitingMembers={invitingMembers}
                                    onVoteJoinRequest={(groupID, request, decision) =>
                                        handleVoteJoinRequest(groupID, request.id, decision)
                                    }
                                    votingJoinRequestKey={votingJoinRequestKey}
                                    onLinkApartment={handleLinkApartment}
                                    isLinkingApartment={linkingApartment}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </article>
    )
}
