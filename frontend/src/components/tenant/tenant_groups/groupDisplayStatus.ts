export type TenantGroupDisplayStatus = 'all' | 'full' | 'accepted' | 'pending' | 'rejected'
export type TenantGroupMemberCountFilter = 'all' | '2' | '3' | '4' | '5+'

export const GROUP_STATUS_FILTER_OPTIONS: { value: TenantGroupDisplayStatus; labelKey: string }[] = [
	{ value: 'all', labelKey: 'tenantGroups.filters.all' },
	{ value: 'full', labelKey: 'tenantGroups.filters.full' },
	{ value: 'accepted', labelKey: 'tenantGroups.filters.statusOptions.accepted' },
	{ value: 'pending', labelKey: 'tenantGroups.status.pending' },
	{ value: 'rejected', labelKey: 'tenantGroups.status.rejected' },
]

export const GROUP_MEMBER_COUNT_FILTER_OPTIONS: { value: TenantGroupMemberCountFilter; labelKey: string }[] = [
	{ value: 'all', labelKey: 'tenantGroups.filters.all' },
	{ value: '2', labelKey: 'tenantGroups.filters.twoMembers' },
	{ value: '3', labelKey: 'tenantGroups.filters.threeMembers' },
	{ value: '4', labelKey: 'tenantGroups.filters.fourMembers' },
	{ value: '5+', labelKey: 'tenantGroups.filters.fiveOrMore' },
]

