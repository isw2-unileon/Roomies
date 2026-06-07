import type { FilterValues } from './TenantFilters'

export const DEFAULT_FILTER_VALUES: FilterValues = {
    area: '',
    priceMin: 0,
    priceMax: 1000,
    totalRoomsMin: 0,
    totalRoomsMax: 10,
    availableRoomsMin: 0,
    availableRoomsMax: 10,
    availability: 'available',
    sortBy: 'relevance',
}
