import type { TenantGroupListItem } from '@/types/tenant'

export type TenantGroupBadgeTone = 'positive' | 'info' | 'warning' | 'negative' | 'neutral'

function isGroupFull(group: TenantGroupListItem) {
    const totalSpots = group.apartment?.totalSpots ?? 0
    return totalSpots > 0 && group.acceptedMembersCount >= totalSpots
}

export function getGroupBadges(group: TenantGroupListItem): { key: string; labelKey: string; tone: TenantGroupBadgeTone }[] {
    if (isGroupFull(group)) {
        return [{ key: 'full', labelKey: 'tenantGroups.card.statusFull', tone: 'neutral' }]
    }

    if (group.currentJoinRequest?.status === 'REJECTED') {
        return [{ key: 'request-rejected', labelKey: 'tenantGroups.card.requestRejected', tone: 'negative' }]
    }

    if (group.currentJoinRequest?.status === 'PENDING') {
        return [{ key: 'request-sent', labelKey: 'tenantGroups.card.requestSent', tone: 'warning' }]
    }

    if (group.userRelation === 'pending_invitation') {
        return [{ key: 'pending-invitation', labelKey: 'tenantGroups.card.relationPendingInvitation', tone: 'warning' }]
    }

    if (
        group.userRelation === 'creator'
        || group.userRelation === 'member'
        || group.currentJoinRequest?.status === 'APPROVED'
    ) {
        return [{ key: 'accepted', labelKey: 'tenantGroups.card.statusAccepted', tone: 'positive' }]
    }

    return []
}

export function getGroupRequestApprovalProgress(group: TenantGroupListItem) {
    const request = group.currentJoinRequest
    if (request?.status !== 'PENDING' || request.requiredApprovals <= 0) {
        return null
    }

    return {
        approved: Math.min(request.approvalCount, request.requiredApprovals),
        total: request.requiredApprovals,
    }
}
