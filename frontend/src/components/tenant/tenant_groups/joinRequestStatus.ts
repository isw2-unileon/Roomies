import { TFunction } from 'i18next'
import type { TenantGroupCurrentJoinRequest, TenantGroupJoinRequest } from '@/types/tenant'

export function getCurrentJoinRequestLabel(
	currentJoinRequest: TenantGroupCurrentJoinRequest | null,
	t: TFunction,
): string {
	if (!currentJoinRequest) {
		return ''
	}

	if (currentJoinRequest.status === 'PENDING') {
		return t('tenantGroups.status.pending')
	}

	if (currentJoinRequest.status === 'REJECTED') {
		return t('tenantGroups.status.rejected')
	}

	if (currentJoinRequest.status === 'APPROVED') {
		return t('tenantGroups.status.approved')
	}

	return t('tenantGroups.status.cancelled')
}

export function canCreateNewJoinRequest(currentJoinRequest: TenantGroupCurrentJoinRequest | null) {
	return !currentJoinRequest || currentJoinRequest.status === 'CANCELLED'
}

export function isRejectedJoinRequest(currentJoinRequest: TenantGroupCurrentJoinRequest | null) {
	return currentJoinRequest?.status === 'REJECTED'
}

export function getJoinRequestApprovalProgress(request: TenantGroupJoinRequest) {
	const total = request.requiredApprovals > 0 ? request.requiredApprovals : request.votes.length
	const approved = request.approvalCount > 0
		? request.approvalCount
		: request.votes.filter((vote) => vote.decision === 'APPROVE').length

	return {
		approved: Math.min(approved, total),
		total,
	}
}

export function canCurrentUserApproveJoinRequest(request: TenantGroupJoinRequest) {
	return !request.hasCurrentUserApproved && !request.hasCurrentUserRejected
}
