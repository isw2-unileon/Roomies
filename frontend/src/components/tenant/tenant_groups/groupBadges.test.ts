import { describe, expect, test } from 'vitest'

import { getGroupBadges, getGroupRequestApprovalProgress } from './groupBadges'
import type { TenantGroupListItem } from '@/types/tenant'

function makeGroup(overrides: Partial<TenantGroupListItem> = {}): TenantGroupListItem {
    return {
        id: 'group-1',
        name: 'Roomies',
        description: '',
        status: 'FORMING',
        createdBy: 'user-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        userRelation: 'viewer',
        invitationId: '',
        acceptedMembersCount: 1,
        pendingInvitationsCount: 0,
        isFullyAccepted: false,
        averageBudgetMin: 0,
        averageBudgetMax: 0,
        apartment: null,
        currentApartmentRequest: null,
        currentJoinRequest: null,
        ...overrides,
    }
}

describe('getGroupBadges', () => {
    test('shows full when apartment spots are filled', () => {
        const badges = getGroupBadges(makeGroup({
            acceptedMembersCount: 2,
            apartment: {
                id: 'apartment-1',
                title: 'Centro',
                address: 'Main St',
                area: 'Centro',
                totalSpots: 2,
                occupiedSpots: 0,
                availableSpots: 0,
                baseRent: 400,
                imageUrl: '',
            },
        }))

        expect(badges).toEqual([
            { key: 'full', labelKey: 'tenantGroups.card.statusFull', tone: 'neutral' },
        ])
    })

    test('shows request rejected', () => {
        const badges = getGroupBadges(makeGroup({
            currentJoinRequest: {
                id: 'request-1',
                groupId: 'group-1',
                requesterUserId: 'user-2',
                source: 'DIRECT_REQUEST',
                status: 'REJECTED',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
                approvalCount: 0,
                requiredApprovals: 2,
            },
        }))

        expect(badges[0]?.labelKey).toBe('tenantGroups.card.requestRejected')
    })

    test('shows request sent', () => {
        const badges = getGroupBadges(makeGroup({
            currentJoinRequest: {
                id: 'request-1',
                groupId: 'group-1',
                requesterUserId: 'user-2',
                source: 'DIRECT_REQUEST',
                status: 'PENDING',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
                approvalCount: 1,
                requiredApprovals: 2,
            },
        }))

        expect(badges[0]?.labelKey).toBe('tenantGroups.card.requestSent')
    })

    test('shows pending invitation', () => {
        const badges = getGroupBadges(makeGroup({ userRelation: 'pending_invitation' }))

        expect(badges[0]?.labelKey).toBe('tenantGroups.card.relationPendingInvitation')
    })

    test('shows accepted for members and creators', () => {
        expect(getGroupBadges(makeGroup({ userRelation: 'member' }))[0]?.labelKey).toBe('tenantGroups.card.statusAccepted')
        expect(getGroupBadges(makeGroup({ userRelation: 'creator' }))[0]?.labelKey).toBe('tenantGroups.card.statusAccepted')
    })

    test('does not show available or acceptance badges for viewers', () => {
        expect(getGroupBadges(makeGroup())).toEqual([])
    })

    test('returns approval progress for pending current user requests', () => {
        expect(getGroupRequestApprovalProgress(makeGroup({
            currentJoinRequest: {
                id: 'request-1',
                groupId: 'group-1',
                requesterUserId: 'user-2',
                source: 'DIRECT_REQUEST',
                status: 'PENDING',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
                approvalCount: 1,
                requiredApprovals: 2,
            },
        }))).toEqual({ approved: 1, total: 2 })
    })

    test('does not return approval progress for rejected requests', () => {
        expect(getGroupRequestApprovalProgress(makeGroup({
            currentJoinRequest: {
                id: 'request-1',
                groupId: 'group-1',
                requesterUserId: 'user-2',
                source: 'DIRECT_REQUEST',
                status: 'REJECTED',
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
                approvalCount: 1,
                requiredApprovals: 2,
            },
        }))).toBeNull()
    })
})
