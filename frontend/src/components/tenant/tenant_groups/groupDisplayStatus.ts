import type { TenantGroupCurrentJoinRequest, TenantGroupListItem } from '@/types/tenant'

export type TenantGroupDisplayStatus = 'all' | 'request_sent' | 'accepted' | 'rejected' | 'closed'

export const tenantGroupStatusFilterOptions: Array<{ value: TenantGroupDisplayStatus; label: string }> = [
	{ value: 'all', label: 'Todos' },
	{ value: 'request_sent', label: 'Solicitud enviada' },
	{ value: 'accepted', label: 'Aceptado' },
	{ value: 'rejected', label: 'Rechazado' },
	{ value: 'closed', label: 'Cerrado' },
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
