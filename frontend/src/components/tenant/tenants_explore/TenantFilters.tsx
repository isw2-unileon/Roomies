import { ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from '@/styles/TenantFilters.module.css'

export interface FilterValues {
    area: string
    priceMin: number
    priceMax: number
    totalRoomsMin: number
    totalRoomsMax: number
    availableRoomsMin: number
    availableRoomsMax: number
    availability: string
    sortBy: string
}

interface TenantFiltersProps {
    onFilterChange?: (filters: FilterValues) => void
}

const areas = [
    { value: 'all', labelKey: 'tenantDashboard.areas.all' },
    { value: 'centro', labelKey: 'tenantDashboard.areas.centro' },
    { value: 'vegazana', labelKey: 'tenantDashboard.areas.vegazana' },
    { value: 'chantria', labelKey: 'tenantDashboard.areas.chantria' },
    { value: 'eras', labelKey: 'tenantDashboard.areas.eras' },
    { value: 'campus', labelKey: 'tenantDashboard.areas.campus' },
]
const availabilityOptions = [
    { value: 'available', labelKey: 'tenantDashboard.filters.availability.available' },
    { value: 'soon', labelKey: 'tenantDashboard.filters.availability.soon' },
    { value: 'all', labelKey: 'tenantDashboard.filters.availability.all' },
]
const sortOptions = [
    { value: 'relevance', labelKey: 'tenantDashboard.filters.sort.relevance' },
    { value: 'price_low', labelKey: 'tenantDashboard.filters.sort.priceLow' },
    { value: 'price_high', labelKey: 'tenantDashboard.filters.sort.priceHigh' },
    { value: 'rooms', labelKey: 'tenantDashboard.filters.sort.rooms' },
    { value: 'newest', labelKey: 'tenantDashboard.filters.sort.newest' },
]

export const DEFAULT_FILTER_VALUES: FilterValues = {
    area: 'all',
    priceMin: 0,
    priceMax: 1000,
    totalRoomsMin: 0,
    totalRoomsMax: 10,
    availableRoomsMin: 0,
    availableRoomsMax: 10,
    availability: 'available',
    sortBy: 'relevance',
}

export default function TenantFilters({ onFilterChange = () => {} }: TenantFiltersProps) {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTER_VALUES)

    function updateFilter<K extends keyof FilterValues>(key: K, value: FilterValues[K]) {
        const newFilters = { ...filters, [key]: value }
        setFilters(newFilters)
        onFilterChange(newFilters)
    }

    return (
        <div className={styles.panel}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={styles.toggleButton}
                aria-expanded={isOpen}
            >
                <div className={styles.toggleLabel}>
                    <FunnelIcon className={styles.icon} aria-hidden="true" />
                    <span>{t('tenantDashboard.filters.title')}</span>
                </div>
                <ChevronDownIcon className={styles.icon} aria-hidden="true" />
            </button>

            {isOpen && (
                <div className={styles.fieldsGrid}>
                    <div className={styles.field}>
                        <label className={styles.label}>{t('tenantDashboard.filters.location')}</label>
                        <select
                            value={filters.area}
                            onChange={(e) => updateFilter('area', e.target.value)}
                            className={styles.select}
                        >
                            {areas.map((area) => (
                                <option key={area.value} value={area.value}>
                                    {t(area.labelKey)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>{t('tenantDashboard.filters.price')}</label>
                        <div className={styles.priceInputs}>
                            <input
                                type="number"
                                value={filters.priceMin || ''}
                                onChange={(e) => updateFilter('priceMin', Number(e.target.value))}
                                placeholder={t('tenantDashboard.filters.min')}
                                aria-label={t('tenantDashboard.filters.minPrice')}
                                className={styles.numberInput}
                            />
                            <span className={styles.rangeSeparator} aria-hidden="true">-</span>
                            <input
                                type="number"
                                value={filters.priceMax || ''}
                                onChange={(e) => updateFilter('priceMax', Number(e.target.value))}
                                placeholder={t('tenantDashboard.filters.max')}
                                aria-label={t('tenantDashboard.filters.maxPrice')}
                                className={styles.numberInput}
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>{t('tenantDashboard.filters.totalRooms')}</label>
                        <div className={styles.priceInputs}>
                            <input
                                type="number"
                                min={0}
                                value={filters.totalRoomsMin || ''}
                                onChange={(e) => updateFilter('totalRoomsMin', Number(e.target.value))}
                                placeholder={t('tenantDashboard.filters.min')}
                                aria-label={t('tenantDashboard.filters.minTotalRooms')}
                                className={styles.numberInput}
                            />
                            <span className={styles.rangeSeparator} aria-hidden="true">-</span>
                            <input
                                type="number"
                                min={0}
                                value={filters.totalRoomsMax || ''}
                                onChange={(e) => updateFilter('totalRoomsMax', Number(e.target.value))}
                                placeholder={t('tenantDashboard.filters.max')}
                                aria-label={t('tenantDashboard.filters.maxTotalRooms')}
                                className={styles.numberInput}
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>{t('tenantDashboard.filters.availableRooms')}</label>
                        <div className={styles.buttonGroup}>
                            <input
                                type="number"
                                min={0}
                                value={filters.availableRoomsMin || ''}
                                onChange={(e) => updateFilter('availableRoomsMin', Number(e.target.value))}
                                placeholder={t('tenantDashboard.filters.min')}
                                aria-label={t('tenantDashboard.filters.minAvailableRooms')}
                                className={styles.numberInput}
                            />
                            <span className={styles.rangeSeparator} aria-hidden="true">-</span>
                            <input
                                type="number"
                                min={0}
                                value={filters.availableRoomsMax || ''}
                                onChange={(e) => updateFilter('availableRoomsMax', Number(e.target.value))}
                                placeholder={t('tenantDashboard.filters.max')}
                                aria-label={t('tenantDashboard.filters.maxAvailableRooms')}
                                className={styles.numberInput}
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>{t('tenantDashboard.filters.availabilityLabel')}</label>
                        <select
                            value={filters.availability}
                            onChange={(e) => updateFilter('availability', e.target.value)}
                            className={styles.select}
                        >
                            {availabilityOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {t(opt.labelKey)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.wideField}>
                        <label className={styles.label}>{t('tenantDashboard.filters.sortLabel')}</label>
                        <div className={styles.chipGroup}>
                            {sortOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => updateFilter('sortBy', opt.value)}
                                    className={`${styles.chipButton} ${filters.sortBy === opt.value ? styles.selected : ''}`}
                                >
                                    {t(opt.labelKey)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
