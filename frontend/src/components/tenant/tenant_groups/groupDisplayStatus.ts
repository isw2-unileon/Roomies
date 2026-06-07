export type TenantGroupDisplayStatus = 'all' | 'request_sent' | 'accepted' | 'rejected' | 'closed'

export const tenantGroupStatusFilterOptions: { value: TenantGroupDisplayStatus; labelKey: string }[] = [
	{ value: 'all', labelKey: 'tenantGroups.filters.all' },
	{ value: 'request_sent', labelKey: 'tenantGroups.status.pending' },
	{ value: 'accepted', labelKey: 'tenantGroups.status.approved' },
	{ value: 'rejected', labelKey: 'tenantGroups.status.rejected' },
	{ value: 'closed', labelKey: 'tenantGroups.filters.statusOptions.forming' },
]


