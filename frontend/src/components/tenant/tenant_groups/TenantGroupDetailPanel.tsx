import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    ArrowRightIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    CurrencyEuroIcon,
    EnvelopeIcon,
    HomeModernIcon,
    MapPinIcon,
    TrashIcon,
    UserGroupIcon,
    UsersIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { paths } from '@/routes/paths'

import TenantGroupMembers from './TenantGroupMembers'
import TenantGroupApartmentSelector from './TenantGroupApartmentSelector'
import TenantGroupCandidateSelector from './TenantGroupCandidateSelector'
import {
  canCreateNewJoinRequest,
  canCurrentUserApproveJoinRequest,
  getCurrentJoinRequestLabel,
  getJoinRequestApprovalProgress,
  isRejectedJoinRequest,
} from './joinRequestStatus'
import type {
    TenantGroupCandidate,
    TenantGroupDetailItem,
    TenantGroupJoinRequest,
    TenantProperty,
} from '@/types/tenant'
import styles from '@/styles/TenantGroupDetail.module.css'

interface TenantGroupDetailPanelProps {
  group: TenantGroupDetailItem
  onClose?: () => void
  onAcceptGroup?: (group: TenantGroupDetailItem) => void
  isAcceptingGroup?: boolean
  onDeleteGroup?: (group: TenantGroupDetailItem) => void
  isDeletingGroup?: boolean
  onLeaveGroup?: (group: TenantGroupDetailItem) => void
  isLeavingGroup?: boolean
  onCreateApartmentApplication?: (group: TenantGroupDetailItem) => void
  isCreatingApartmentApplication?: boolean
  onCreateJoinRequest?: (group: TenantGroupDetailItem) => void
  isCreatingJoinRequest?: boolean
  onInviteMembers?: (group: TenantGroupDetailItem, invitedUserIDs: string[]) => Promise<void>
  isInvitingMembers?: boolean
  onVoteJoinRequest?: (groupID: string, request: TenantGroupJoinRequest, decision: 'APPROVE' | 'REJECT') => void
  votingJoinRequestKey?: string | null
  onLinkApartment?: (group: TenantGroupDetailItem, apartment: TenantProperty) => void
  isLinkingApartment?: boolean
}

function canResubmitApartmentRequest(status: string) {
  return status === 'REJECTED_BY_OWNER' || status === 'CANCELLED'
}

function apartmentRequestStatusKey(status: string): string {
  if (status === 'FULLY_CONFIRMED') return 'tenantGroups.status.fullyConfirmed'
  if (status === 'REJECTED_BY_OWNER') return 'tenantGroups.status.rejectedByOwner'
  if (status === 'CANCELLED') return 'tenantGroups.status.cancelled'
  if (status === 'PENDING_CONFIRMED_TENANTS') return 'tenantGroups.status.pendingConfirmedTenants'
  return 'tenantGroups.status.pending'
}

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function TenantGroupDetailPanel({
  group,
  onClose,
  onAcceptGroup,
  isAcceptingGroup = false,
  onDeleteGroup,
  isDeletingGroup = false,
  onLeaveGroup,
  isLeavingGroup = false,
  onCreateApartmentApplication,
  isCreatingApartmentApplication = false,
  onCreateJoinRequest,
  isCreatingJoinRequest = false,
  onInviteMembers,
  isInvitingMembers = false,
  onVoteJoinRequest,
  votingJoinRequestKey,
  onLinkApartment,
  isLinkingApartment = false,
}: TenantGroupDetailPanelProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [selectedApartment, setSelectedApartment] = useState<TenantProperty | null>(null)
  const [selectedCandidates, setSelectedCandidates] = useState<TenantGroupCandidate[]>([])
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)

  useEffect(() => {
    setSelectedApartment(null)
    setSelectedCandidates([])
  }, [group.id])

  const isOwner = group.userRelation === 'creator'
  const canLeaveGroup = group.userRelation === 'member'
  const isOnlyMember = group.members.length === 1
  const canAcceptGroup =
     !group.isFullyAccepted
    && !(isOwner && isOnlyMember)
    && (group.userRelation === 'creator'
      || (group.userRelation === 'member' && group.members.some((member) => member.isCurrentUser && !member.hasAccepted)))

  const currentJoinRequestLabel = getCurrentJoinRequestLabel(group.currentJoinRequest, t)
  const canCreateJoinRequest = group.userRelation === 'viewer' && canCreateNewJoinRequest(group.currentJoinRequest)
  const hasRejectedJoinRequest = isRejectedJoinRequest(group.currentJoinRequest)
  const canInviteMembers = group.userRelation === 'creator' || group.userRelation === 'member'
  const canLinkApartment = group.userRelation === 'creator' && !group.apartment
  const canCreateApartmentApplication = Boolean(group.apartment)
    && group.isFullyAccepted
    && group.userRelation === 'creator'
    && (!group.currentApartmentRequest || canResubmitApartmentRequest(group.currentApartmentRequest.status))
  const acceptedMembers = group.members.filter(
    (member) => member.status === 'ACCEPTED',
  )
  const apartmentCapacity = group.apartment?.totalSpots ?? 0
  const isGroupFull = apartmentCapacity > 0 && acceptedMembers.length >= apartmentCapacity
  const ownerName = group.members.find((member) => member.role === 'owner')?.name ?? ''
  const locale = i18n.language ?? 'es'
  const formattedDate = group.createdAt ? formatDate(group.createdAt, locale) : ''
  const hasImage = Boolean(group.apartment?.imageUrl)

  async function handleInviteMembers() {
    if (!onInviteMembers || selectedCandidates.length === 0) {
      return
    }

    try {
      await onInviteMembers(group, selectedCandidates.map((candidate) => candidate.userId))
      setSelectedCandidates([])
    } catch {
      // The handler in the parent card already surfaces the error message.
    }
  }

  function handleDeleteGroup() {
    if (!onDeleteGroup) return
    if (typeof window !== 'undefined' && !window.confirm(t('tenantGroups.detail.actions.confirmDelete'))) {
      return
    }
    onDeleteGroup(group)
  }

  function handleConfirmLeaveGroup() {
    if (!onLeaveGroup) return
    onLeaveGroup(group)
  }

  return (
    <div className={styles.detailContainer}>
      <header className={styles.detailHeader}>
        <div className={styles.detailTitleWrap}>
          <div className={styles.detailTitleRow}>
            <h2 className={styles.detailTitle}>{group.name}</h2>
            <span style={{ flex: 1 }} />
            {onClose ? (
              <button
                type="button"
                className={styles.closeButton}
                onClick={onClose}
                aria-label="close"
              >
                <XMarkIcon className={styles.closeButtonIcon} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>

        <div className={styles.detailActions}>
          {canAcceptGroup ? (
            <button
              type="button"
              className={styles.acceptGroupButton}
              onClick={() => onAcceptGroup?.(group)}
              disabled={isAcceptingGroup}
            >
              {isAcceptingGroup
                ? t('tenantGroups.detail.actions.acceptingGroup')
                : t('tenantGroups.detail.actions.acceptGroup')}
            </button>
          ) : null}

          {isOwner ? (
            <button
              type="button"
              className={styles.deleteGroupButton}
              onClick={handleDeleteGroup}
              disabled={isDeletingGroup}
            >
              <TrashIcon className={styles.iconSmall} aria-hidden="true" />
              {isDeletingGroup
                ? t('tenantGroups.detail.actions.deletingGroup')
                : t('tenantGroups.detail.actions.deleteGroup')}
            </button>
          ) : null}

          {canLeaveGroup ? (
            <button
              type="button"
              className={styles.leaveGroupButton}
              onClick={() => setShowLeaveDialog(true)}
              disabled={isLeavingGroup}
            >
              {isLeavingGroup
                ? t('tenantGroups.detail.actions.leavingGroup')
                : t('tenantGroups.detail.actions.leaveGroup')}
            </button>
          ) : null}
        </div>
      </header>

      {showLeaveDialog ? (
        <div className={styles.confirmOverlay} role="dialog" aria-modal="true" aria-labelledby="leave-group-title">
          <div className={styles.confirmDialog}>
            <h3 id="leave-group-title" className={styles.confirmTitle}>
              {t('tenantGroups.detail.actions.confirmLeaveTitle')}
            </h3>
            <p className={styles.confirmDescription}>
              {t('tenantGroups.detail.actions.confirmLeaveDescription')}
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.confirmCancelButton}
                onClick={() => setShowLeaveDialog(false)}
                disabled={isLeavingGroup}
              >
                {t('tenantGroups.detail.actions.confirmLeaveCancel')}
              </button>
              <button
                type="button"
                className={styles.confirmDangerButton}
                onClick={handleConfirmLeaveGroup}
                disabled={isLeavingGroup}
              >
                {isLeavingGroup
                  ? t('tenantGroups.detail.actions.leavingGroup')
                  : t('tenantGroups.detail.actions.confirmLeaveConfirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className={styles.apartmentHeroSection}>
        <h3 className={styles.sectionTitle}>{t('tenantGroups.detail.sections.apartment')}</h3>
        {group.apartment ? (
          <div className={styles.apartmentHero}>
            {hasImage ? (
              <img
                className={styles.apartmentHeroImage}
                src={group.apartment?.imageUrl}
                alt={group.apartment?.title ?? group.name}
                loading="lazy"
              />
            ) : (
              <div className={styles.apartmentHeroPlaceholder}>
                <HomeModernIcon className={styles.apartmentHeroIcon} aria-hidden="true" />
              </div>
            )}
            <div className={styles.apartmentHeroBody}>
              <p className={styles.apartmentTitle}>{group.apartment.title}</p>
              <p className={styles.apartmentAddress}>
                <MapPinIcon className={styles.iconTiny} aria-hidden="true" />
                {group.apartment.area} · {group.apartment.address}
              </p>
              <div className={styles.summaryChips}>
                <span className={styles.chip}>
                  <UserGroupIcon className={styles.chipIcon} aria-hidden="true" />
                  {t('tenantGroups.detail.apartment.capacity', { count: group.apartment.totalSpots })}
                </span>
                {group.apartment.totalSpots > 0 ? (
                  <span className={styles.chip}>
                    <CheckCircleIcon className={styles.chipIcon} aria-hidden="true" />
                    {t('tenantGroups.detail.apartment.capacityAvailable', {
                      count: Math.max(0, group.apartment.totalSpots - acceptedMembers.length),
                    })}
                  </span>
                ) : null}
                <span className={styles.chip}>
                  <CurrencyEuroIcon className={styles.chipIcon} aria-hidden="true" />
                  {t('tenantGroups.detail.apartment.rent', { amount: group.apartment.baseRent })}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.apartmentEmptyCard}>
            <HomeModernIcon className={styles.apartmentEmptyIcon} aria-hidden="true" />
            <p>{t('tenantGroups.detail.apartment.noApartment')}</p>
          </div>
        )}

        {group.apartment ? (
          <button
            type="button"
            className={styles.apartmentDetailButton}
            onClick={() => navigate(paths.tenantExploreDetail.replace(':propertyId', group.apartment!.id))}
          >
            <span>{t('tenantGroups.detail.actions.viewApartment')}</span>
            <ArrowRightIcon className={styles.apartmentDetailButtonIcon} aria-hidden="true" />
          </button>
        ) : null}
      </section>

      <section className={styles.generalCard}>
        <h3 className={styles.sectionTitle}>{t('tenantGroups.detail.sections.general')}</h3>

        {group.currentApartmentRequest ? (
          <div className={styles.generalStatusRow}>
            <CheckCircleIcon className={styles.generalStatusIcon} aria-hidden="true" />
            <span className={styles.generalStatusText}>
              {t('tenantGroups.status.active')}: {t(apartmentRequestStatusKey(group.currentApartmentRequest.status))}
            </span>
          </div>
        ) : null}

        {group.description ? (
          <p className={styles.generalDescription}>{group.description}</p>
        ) : null}

        <hr className={styles.generalDivider} />

        <div className={styles.generalGrid}>
          {ownerName ? (
            <div className={styles.generalItem}>
              <UsersIcon className={styles.generalItemIcon} aria-hidden="true" />
              <span className={styles.generalItemValue}>
                {t('tenantGroups.detail.general.owner', { name: ownerName })}
              </span>
            </div>
          ) : null}

          {formattedDate ? (
            <div className={styles.generalItem}>
              <CalendarDaysIcon className={styles.generalItemIcon} aria-hidden="true" />
              <span className={styles.generalItemValue}>
                {t('tenantGroups.detail.general.createdOn', { date: formattedDate })}
              </span>
            </div>
          ) : null}

          <div className={styles.generalItem}>
            <UserGroupIcon className={styles.generalItemIcon} aria-hidden="true" />
            <span className={styles.generalItemValue}>
              {t('tenantGroups.detail.members.count', { count: acceptedMembers.length, total: apartmentCapacity || acceptedMembers.length })}
            </span>
          </div>
        </div>

      </section>

      {group.userRelation === 'viewer' && currentJoinRequestLabel ? (
        <p className={hasRejectedJoinRequest ? styles.rejectedText : styles.pendingText}>
          {hasRejectedJoinRequest
            ? t('tenantGroups.detail.viewer.rejectedNotice', { status: currentJoinRequestLabel })
            : t('tenantGroups.detail.viewer.pendingNotice', { status: currentJoinRequestLabel })}
        </p>
      ) : null}

      {canCreateJoinRequest ? (
        <button
          type="button"
          className={styles.acceptGroupButton}
          onClick={() => onCreateJoinRequest?.(group)}
          disabled={isCreatingJoinRequest}
        >
          {isCreatingJoinRequest
            ? t('tenantGroups.detail.viewer.requesting')
            : t('tenantGroups.detail.viewer.requestButton')}
        </button>
      ) : null}

      {canLinkApartment ? (
        <section className={styles.apartmentLinkSection}>
          <h3 className={styles.sectionTitle}>{t('tenantGroups.detail.actions.linkApartment')}</h3>
          <p className={styles.sectionHint}>{t('tenantGroups.detail.actions.selectApartment')}</p>
          <TenantGroupApartmentSelector
            selected={selectedApartment}
            onChange={setSelectedApartment}
            allowEmptySelection={false}
          />
          <button
            type="button"
            className={styles.acceptGroupButton}
            onClick={() => selectedApartment && onLinkApartment?.(group, selectedApartment)}
            disabled={!selectedApartment || isLinkingApartment}
          >
            {isLinkingApartment
              ? t('tenantGroups.detail.actions.linking')
              : t('tenantGroups.detail.actions.linkApartment')}
          </button>
        </section>
      ) : null}

      {group.apartment && canCreateApartmentApplication ? (
        <section className={styles.apartmentRequestSection}>
          <button
            type="button"
            className={styles.acceptGroupButton}
            onClick={() => onCreateApartmentApplication?.(group)}
            disabled={isCreatingApartmentApplication}
          >
            {isCreatingApartmentApplication
              ? t('tenantGroups.detail.actions.creatingApartmentApplication')
              : t('tenantGroups.detail.actions.createApartmentApplication')}
          </button>
        </section>
      ) : null}

      {group.apartment && !group.currentApartmentRequest && !canCreateApartmentApplication && group.userRelation !== 'creator' ? (
        <p className={styles.pendingText}>
          {group.isFullyAccepted
            ? t('tenantGroups.detail.actions.onlyCreatorCanApply')
            : t('tenantGroups.detail.actions.groupNotFullyAccepted')}
        </p>
      ) : null}

      <section className={styles.membersSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>{t('tenantGroups.detail.sections.members')}</h3>
          {apartmentCapacity > 0 ? (
            <span className={styles.memberCount}>
              {t('tenantGroups.detail.members.count', { count: acceptedMembers.length, total: apartmentCapacity })}
            </span>
          ) : null}
        </div>
        <TenantGroupMembers members={acceptedMembers} />
        {acceptedMembers.length === 0 && canInviteMembers ? (
          <p className={styles.sectionHint}>{t('tenantGroups.detail.members.addPrompt')}</p>
        ) : null}
      </section>

      {canInviteMembers ? (
        <section className={styles.apartmentLinkSection}>
          <h3 className={styles.sectionTitle}>{t('tenantGroups.detail.actions.inviteMembers')}</h3>
          <p className={styles.sectionHint}>
            {t('tenantGroups.detail.apartment.capacityAvailable', {
              count: apartmentCapacity > 0
                ? Math.max(0, apartmentCapacity - acceptedMembers.length)
                : 0,
            })}
          </p>
          {isGroupFull ? (
            <p className={styles.pendingText}>{t('tenantGroups.detail.fullGroup')}</p>
          ) : null}
          <TenantGroupCandidateSelector
            selected={selectedCandidates}
            onChange={setSelectedCandidates}
            groupId={group.id}
            disabled={isGroupFull || isInvitingMembers}
          />
          <button
            type="button"
            className={styles.acceptGroupButton}
            onClick={() => void handleInviteMembers()}
            disabled={isGroupFull || selectedCandidates.length === 0 || isInvitingMembers}
          >
            {isInvitingMembers
              ? t('tenantGroups.detail.actions.inviting')
              : t('tenantGroups.detail.actions.inviteMembers')}
          </button>
        </section>
      ) : null}



      {(group.userRelation === 'creator' || group.userRelation === 'member') && group.joinRequests.length > 0 ? (
        <section className={styles.invitationsSection}>
          <h3 className={styles.sectionTitle}>{t('tenantGroups.detail.requests.title')}</h3>
          <div className={styles.invitationsList}>
            {group.joinRequests.map((request) => {
              const approvalProgress = getJoinRequestApprovalProgress(request)
              const canApproveRequest = canCurrentUserApproveJoinRequest(request)
              return (
                <div key={request.id} className={styles.invitationCard}>
                  <div className={styles.invitationInfo}>
                    <p className={styles.requesterName}>{request.requester.name}</p>
                    <p className={styles.requesterEmail}>
                      <EnvelopeIcon className={styles.iconTiny} aria-hidden="true" />
                      {request.requester.email}
                    </p>
                    {request.source === 'GROUP_INVITATION' ? (
                      <span className={styles.requestSourceBadge}>
                        {t('tenantGroups.detail.requests.sourceInvitation')}
                      </span>
                    ) : (
                      <span className={styles.requestSourceBadgeMuted}>
                        {t('tenantGroups.detail.requests.sourceDirect')}
                      </span>
                    )}
                    <p className={styles.approvalsCount}>
                      {t('tenantGroups.detail.requests.approvalProgress', approvalProgress)}
                    </p>
                  </div>
                  <div className={styles.invitationActions}>
                    {canApproveRequest ? (
                      <button
                        type="button"
                        disabled={votingJoinRequestKey === `${request.id}:APPROVE`}
                        onClick={() => onVoteJoinRequest?.(group.id, request, 'APPROVE')}
                        className={styles.acceptButton}
                      >
                        {votingJoinRequestKey === `${request.id}:APPROVE`
                          ? t('tenantGroups.detail.requests.approving')
                          : t('tenantGroups.detail.requests.approve')}
                      </button>
                    ) : (
                      <span className={styles.approvedByYouBadge}>
                        {t('tenantGroups.detail.requests.approvedByYou')}
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={votingJoinRequestKey === `${request.id}:REJECT`}
                      onClick={() => onVoteJoinRequest?.(group.id, request, 'REJECT')}
                      className={styles.rejectButton}
                    >
                      {votingJoinRequestKey === `${request.id}:REJECT`
                        ? t('tenantGroups.detail.requests.rejecting')
                        : t('tenantGroups.detail.requests.reject')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
