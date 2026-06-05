import type { TenantGroupCurrentJoinRequest, TenantGroupListItem } from '@/types/tenant'

export type TenantGroupDisplayStatus = 'all' | 'request_sent' | 'accepted' | 'rejected' | 'closed'

export interface TenantGroupStatusFilterOption {
	value: TenantGroupDisplayStatus
	labelKey: string
}

export const tenantGroupStatusFilterOptions: TenantGroupStatusFilterOption[] = [
	{ value: 'all', labelKey: 'tenantGroups.filters.all' },
	{ value: 'request_sent', labelKey: 'tenantGroups.status.pending' },
	{ value: 'accepted', labelKey: 'tenantGroups.status.approved' },
	{ value: 'rejected', labelKey: 'tenantGroups.status.rejected' },
	{ value: 'closed', labelKey: 'tenantGroups.filters.statusOptions.forming' },
]

function isAcceptedJoinRequest(currentJoinRequest: TenantGroupCurrentJoinRequest | null) {
	return currentJoinRequest?.status === 'APPROVED'
}

function isRejectedJoinRequest(currentJoinRequest: TenantGroupCurrentJoinRequest | null) {
	return currentJoinRequest?.status === 'REJECTED'
}

function isPendingJoinRequest(currentJoinRequest: TenantGroupCurrentJoinRequest | null) {
	return currentJoinRequest?.status === 'PENDING'
}

export function getTenantGroupDisplayStatus(group: TenantGroupListItem): Exclude<TenantGroupDisplayStatus, 'all'> | null {
	if (group.status === 'CLOSED') {
		return 'closed'
	}

	if (group.userRelation === 'creator' || group.userRelation === 'member' || isAcceptedJoinRequest(group.currentJoinRequest)) {
		return 'accepted'
	}

	if (isRejectedJoinRequest(group.currentJoinRequest)) {
		return 'rejected'
	}

	if (isPendingJoinRequest(group.currentJoinRequest)) {
		return 'request_sent'
	}

	return null
}
