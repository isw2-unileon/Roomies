import type { TenantGroupCurrentJoinRequest } from '@/types/tenant'

export function getCurrentJoinRequestLabel(currentJoinRequest: TenantGroupCurrentJoinRequest | null) {
	if (!currentJoinRequest) {
		return ''
	}

	if (currentJoinRequest.status === 'PENDING') {
		return 'Solicitud enviada'
	}

	if (currentJoinRequest.status === 'REJECTED') {
		return 'Rechazado'
	}

	if (currentJoinRequest.status === 'APPROVED') {
		return 'Aceptado'
	}

	return 'Cancelado'
}

export function canCreateNewJoinRequest(currentJoinRequest: TenantGroupCurrentJoinRequest | null) {
	return !currentJoinRequest || currentJoinRequest.status === 'CANCELLED'
}

export function isRejectedJoinRequest(currentJoinRequest: TenantGroupCurrentJoinRequest | null) {
	return currentJoinRequest?.status === 'REJECTED'
}
