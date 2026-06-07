import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
	inviteUsersToTenantGroup,
	leaveAcceptedApartment,
	getTenantApartmentDetail,
	getTenantPersonalProfile,
	deleteTenantGroup,
	listTenantGroupCandidates,
	listTenantGroups,
	listTenantApplications,
	listTenantApartments,
	saveTenantProfile,
	saveTenantPersonalProfile,
	uploadTenantAvatar,
} from './tenantService'

describe('tenantService', () => {
	beforeEach(() => {
		localStorage.clear()
		vi.restoreAllMocks()
	})

	test('maps available apartment DTOs to tenant properties', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({
				apartments: [
					{
						id: 'apt-1',
						title: 'Piso centro',
						address: 'Calle Ancha 12',
						area: 'Centro',
						total_spots: 3,
						available_spots: 2,
						base_rent: 420,
						status: 'AVAILABLE',
						created_at: '2026-05-21T10:00:00Z',
						image_url: 'https://example.test/apt.jpg',
						image_urls: ['https://example.test/apt.jpg', 'https://example.test/apt-room.jpg'],
						latitude: 42.6,
						longitude: -5.57,
						is_current_tenant_home: true,
					},
				],
			}),
		} as Response)

		await expect(listTenantApartments()).resolves.toEqual([
			{
				id: 'apt-1',
				titleKey: 'Piso centro',
				description: '',
				ownerId: '',
				ownerName: '',
				addressKey: 'Calle Ancha 12',
				areaKey: 'Centro',
				availableRooms: 2,
				totalRooms: 3,
				rent: 420,
				compatibilityScore: 0,
				status: 'available',
				images: ['https://example.test/apt.jpg', 'https://example.test/apt-room.jpg'],
				createdAt: '2026-05-21T10:00:00Z',
				latitude: undefined,
				longitude: undefined,
				bathrooms: 0,
				surfaceM2: 0,
				floor: 0,
				isCurrentTenantHome: true,
			},
		])

		expect(fetch).toHaveBeenCalledWith('/api/tenant/apartments', { credentials: 'include' })
	})

	test('sends search and filter params to apartments endpoint', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({ apartments: [] }),
		} as Response)

		await listTenantApartments({
			query: 'centro',
			area: 'centro',
			priceMin: 300,
			priceMax: 500,
			totalRoomsMin: 2,
			totalRoomsMax: 4,
			availableRoomsMin: 1,
			availableRoomsMax: 2,
			availability: 'soon',
			sortBy: 'price_low',
		})

		expect(fetch).toHaveBeenCalledWith(
			'/api/tenant/apartments?q=centro&area=centro&price_min=300&price_max=500&total_rooms_min=2&total_rooms_max=4&available_rooms_min=1&available_rooms_max=2&availability=soon&sort_by=price_low',
			{ credentials: 'include' },
		)
	})

	test('sends map filter params to /api/apartments/map endpoint', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({
				apartments: [
					{
						id: 'apt-1',
						title: 'Piso centro',
						address: 'Calle Ancha 12',
						area: 'Centro',
						total_spots: 3,
						available_spots: 2,
						base_rent: 420,
						status: 'AVAILABLE',
						created_at: '2026-05-21T10:00:00Z',
						image_url: 'https://example.test/apt.jpg',
						latitude: 42.6,
						longitude: -5.57,
					},
				],
			}),
		} as Response)

		const result = await listTenantApartments({ lat: 42.6, lng: -5.57, radius: 2 })

		expect(fetch).toHaveBeenCalledWith(
			'/api/tenant/apartments/map?lat=42.6&lng=-5.57&radius=2',
			{ credentials: 'include' },
		)
		expect(result[0]!.latitude).toBe(42.6)
		expect(result[0]!.longitude).toBe(-5.57)
	})

	test('parses string permission flags from apartment detail safely', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({
				apartment: {
					id: 'apt-22',
					title: 'Piso norte',
					address: 'Calle Norte 8',
					area: 'Norte',
					total_spots: 4,
					available_spots: 1,
					base_rent: 390,
					status: 'AVAILABLE',
					created_at: '2026-05-21T10:00:00Z',
					image_url: 'https://example.test/apt-22.jpg',
				},
				can_apply: 'false',
				can_cancel: 'false',
				can_leave: 'true',
			}),
		} as Response)

		await expect(getTenantApartmentDetail('apt-22')).resolves.toMatchObject({
			canApply: false,
			canCancel: false,
			canLeave: true,
		})

		expect(fetch).toHaveBeenCalledWith('/api/apartments/apt-22', { credentials: 'include' })
	})

	test('posts accepted apartment leave request', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({ message: 'apartment left' }),
		} as Response)

		await expect(leaveAcceptedApartment('application-1')).resolves.toBe('apartment left')

		expect(fetch).toHaveBeenCalledWith('/api/applications/application-1/leave', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({}),
			credentials: 'include',
		})
	})

	test('loads tenant personal profile data', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({
				user_id: 'user-1',
				full_name: 'Jairo Test',
				email: 'jairo@example.test',
				avatar_url: 'data:image/png;base64,abc',
			}),
		} as Response)

		await expect(getTenantPersonalProfile()).resolves.toEqual({
			userId: 'user-1',
			fullName: 'Jairo Test',
			email: 'jairo@example.test',
			avatarUrl: 'data:image/png;base64,abc',
		})

		expect(fetch).toHaveBeenCalledWith('/api/tenant-profile/personal', { credentials: 'include' })
	})

	test('saves tenant personal profile data', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({ message: 'tenant personal profile saved' }),
		} as Response)

		await expect(saveTenantPersonalProfile({
			fullName: 'Jairo Test',
		})).resolves.toBe('tenant personal profile saved')

		expect(fetch).toHaveBeenCalledWith('/api/tenant-profile/personal', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				full_name: 'Jairo Test',
			}),
			credentials: 'include',
		})
	})

	test('uploads tenant avatar as multipart form data', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({ avatar_url: 'https://example.test/avatar.png' }),
		} as Response)

		const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
		await expect(uploadTenantAvatar(file)).resolves.toBe('https://example.test/avatar.png')

		expect(fetch).toHaveBeenCalledWith('/api/tenant-profile/avatar', expect.objectContaining({
			method: 'POST',
			body: expect.any(FormData),
			credentials: 'include',
		}))
	})

	test('saves tenant onboarding profile with updated fields', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({ message: 'tenant profile saved' }),
		} as Response)

		await expect(saveTenantProfile({
			budgetMax: 650,
			preferredArea: 'Leon',
			pets: true,
			smoking: false,
			age: 23,
			sex: 'female',
			situation: 'student',
			degree: 'Arquitectura',
			socializationLevel: 'medium',
			nightlifeLevel: 'low',
		})).resolves.toBe('tenant profile saved')

		expect(fetch).toHaveBeenCalledWith('/api/tenant-profile', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				budget_max: 650,
				preferred_area: 'Leon',
				pets: true,
				smoking: false,
				age: 23,
				sex: 'female',
				situation: 'student',
				degree: 'Arquitectura',
				profession: undefined,
				socialization_level: 'medium',
				nightlife_level: 'low',
			}),
			credentials: 'include',
		})
	})

	test('maps group applications in tenant applications list', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({
				applications: [
					{
						id: 'app-group-1',
						apartment_id: 'apt-9',
						property_title: 'Piso centro',
						owner_name: 'Maria Owner',
						address: 'Calle Ancha 12',
						image_url: 'https://example.test/apt.jpg',
						places: 4,
						size: 0,
						bathrooms: 0,
						status: 'pending',
						created_at: '2026-05-21',
						date_label: 'Solicitada el 2026-05-21',
						compatibility: 81,
						request_type: 'Solicitud de grupo · Centro Leon',
						status_message: 'Pendiente',
						application_type: 'group',
						is_group_application: true,
						group_id: 'group-1',
						group_name: 'Centro Leon',
						submitted_by_user_id: 'tenant-1',
						submitted_by_name: 'Jairo Test',
						can_cancel: false,
						group_members: [
							{ user_id: 'tenant-1', name: 'Jairo Test', email: 'jairo@example.test', avatar_url: '' },
							{ user_id: 'tenant-2', name: 'Laura Test', email: 'laura@example.test', avatar_url: '' },
						],
					},
				],
			}),
		} as Response)

		await expect(listTenantApplications()).resolves.toEqual([
			{
				id: 'app-group-1',
				propertyId: 'apt-9',
				propertyTitle: 'Piso centro',
				ownerName: 'Maria Owner',
				address: 'Calle Ancha 12',
				image: 'https://example.test/apt.jpg',
				places: 4,
				size: 0,
				bathrooms: 0,
				status: 'pending',
				createdAt: '2026-05-21',
				dateLabel: 'Solicitada el 2026-05-21',
				compatibility: 81,
				requestType: 'Solicitud de grupo · Centro Leon',
				statusMessage: 'Pendiente',
				applicationType: 'group',
				isGroupApplication: true,
				groupId: 'group-1',
				groupName: 'Centro Leon',
				submittedByUserId: 'tenant-1',
				submittedByName: 'Jairo Test',
				canCancel: false,
				groupMembers: [
					{ userId: 'tenant-1', name: 'Jairo Test', email: 'jairo@example.test', avatarUrl: '' },
					{ userId: 'tenant-2', name: 'Laura Test', email: 'laura@example.test', avatarUrl: '' },
				],
			},
		])

		expect(fetch).toHaveBeenCalledWith('/api/tenant/applications', { credentials: 'include' })
	})

	test('maps current join request state in tenant groups list', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({
				groups: [
					{
						id: 'group-1',
						name: 'Centro Leon',
						description: 'Grupo tranquilo',
						status: 'FORMING',
						created_by: 'tenant-9',
						created_at: '2026-06-01T12:00:00Z',
						user_relation: 'viewer',
						invitation_id: '',
						accepted_members_count: 2,
						pending_invitations_count: 0,
						is_fully_accepted: false,
						average_budget_min: 300,
						average_budget_max: 450,
						apartment: null,
						current_apartment_request: null,
						current_join_request: {
							id: 'join-request-1',
							group_id: 'group-1',
							requester_user_id: 'tenant-1',
							status: 'REJECTED',
							created_at: '2026-06-02T10:00:00Z',
							updated_at: '2026-06-03T11:00:00Z',
						},
					},
				],
			}),
		} as Response)

		await expect(listTenantGroups()).resolves.toMatchObject([
			{
				id: 'group-1',
				name: 'Centro Leon',
				description: 'Grupo tranquilo',
				status: 'FORMING',
				createdBy: 'tenant-9',
				createdAt: '2026-06-01T12:00:00Z',
				userRelation: 'viewer',
				invitationId: '',
				acceptedMembersCount: 2,
				pendingInvitationsCount: 0,
				isFullyAccepted: false,
				averageBudgetMax: 450,
				apartment: null,
				currentApartmentRequest: null,
				currentJoinRequest: {
					id: 'join-request-1',
					groupId: 'group-1',
					requesterUserId: 'tenant-1',
					status: 'REJECTED',
					createdAt: '2026-06-02T10:00:00Z',
					updatedAt: '2026-06-03T11:00:00Z',
				},
			},
		])

		expect(fetch).toHaveBeenCalledWith('/api/tenant/groups', { credentials: 'include' })
	})

	test('sends tenant group status filters with normalized values', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({ groups: [] }),
		} as Response)

		await listTenantGroups({
			search: 'centro',
			status: 'request_sent',
			hasApartment: 'false',
			members: 3,
			sort: 'members',
		})

		expect(fetch).toHaveBeenCalledWith(
			'/api/tenant/groups?search=centro&status=request_sent&has_apartment=false&members=3&sort=members',
			{ credentials: 'include' },
		)
	})

	test('deletes tenant group with delete method', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			status: 204,
		} as Response)

		await expect(deleteTenantGroup('group-1')).resolves.toBeUndefined()

		expect(fetch).toHaveBeenCalledWith('/api/tenant/groups/group-1', {
			credentials: 'include',
			method: 'DELETE',
		})
	})

	test('sends group id when loading invitable candidates', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({ candidates: [] }),
		} as Response)

		await listTenantGroupCandidates({ search: 'laura', groupId: 'group-1' })

		expect(fetch).toHaveBeenCalledWith('/api/tenant/group-candidates?search=laura&group_id=group-1', {
			credentials: 'include',
		})
	})

	test('invites users to an existing group', async () => {
		vi.spyOn(global, 'fetch').mockResolvedValue({
			ok: true,
			json: async () => ({ message: 'group invitations created' }),
		} as Response)

		await expect(inviteUsersToTenantGroup('group-1', ['tenant-2', 'tenant-3'])).resolves.toBe('group invitations created')

		expect(fetch).toHaveBeenCalledWith('/api/tenant/groups/group-1/invitations', {
			credentials: 'include',
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ invited_user_ids: ['tenant-2', 'tenant-3'] }),
		})
	})
})
