import { CalendarDaysIcon, ShieldCheckIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import styles from '@/styles/TenantGroups.module.css'
import {
    GROUP_MEMBER_COUNT_FILTER_OPTIONS,
    GROUP_STATUS_FILTER_OPTIONS,
    type TenantGroupDisplayStatus,
    type TenantGroupMemberCountFilter,
} from './groupDisplayStatus'

interface TenantGroupFiltersProps {
    selectedMembers: TenantGroupMemberCountFilter
    onSelectedMembersChange: (value: TenantGroupMemberCountFilter) => void
    status: TenantGroupDisplayStatus
    onStatusChange: (value: TenantGroupDisplayStatus) => void
    hasApartment: string
    onHasApartmentChange: (value: string) => void
    onClearFilters: () => void
}

export default function TenantGroupFilters({
    selectedMembers,
    onSelectedMembersChange,
    status,
    onStatusChange,
    hasApartment,
    onHasApartmentChange,
    onClearFilters,
}: TenantGroupFiltersProps) {
    const { t } = useTranslation()
    return (
        <aside className={styles.sidebar} aria-label={t('tenantGroups.filters.title')}>
            <section className={styles.sideCard}>
                <div className={styles.sideHeader}>
                    <h2 className={styles.sideTitle}>{t('tenantGroups.filters.title')}</h2>
                    <button type="button" className={styles.clearButton} onClick={onClearFilters}>
                        {t('tenantGroups.filters.reset')}
                    </button>
                </div>

                {/* Keep labels and option text in i18n so the sidebar follows the active locale. */}
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel} htmlFor="status-filter">{t('tenantGroups.filters.status')}</label>
                    <select
                        id="status-filter"
                        className={styles.filterSelect}
                        value={status}
                        onChange={(event) => onStatusChange(event.target.value as TenantGroupDisplayStatus)}
                    >
                        {GROUP_STATUS_FILTER_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel} htmlFor="apartment-filter">{t('tenantGroups.filters.hasApartment')}</label>
                    <select
                        id="apartment-filter"
                        className={styles.filterSelect}
                        value={hasApartment}
                        onChange={(event) => onHasApartmentChange(event.target.value)}
                    >
                        <option value="all">{t('tenantGroups.filters.all')}</option>
                        <option value="true">{t('tenantGroups.filters.yes')}</option>
                        <option value="false">{t('tenantGroups.filters.no')}</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel} htmlFor="members-filter">{t('tenantGroups.filters.members')}</label>
                    <select
                        id="members-filter"
                        className={styles.filterSelect}
                        value={selectedMembers}
                        onChange={(event) => onSelectedMembersChange(event.target.value as TenantGroupMemberCountFilter)}
                    >
                        {GROUP_MEMBER_COUNT_FILTER_OPTIONS.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                            >
                                {t(option.labelKey)}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            <section className={styles.sideCard}>
                <h2 className={styles.sideTitle}>{t('tenantGroups.page.createButton')}</h2>

                <div className={styles.tipsList}>
                    <div className={styles.tipItem}>
                        <span className={`${styles.tipIcon} ${styles.greenSoft}`}>
                            <ShieldCheckIcon className={styles.iconSmall} aria-hidden="true" />
                        </span>
                        <div>
                            <p className={styles.tipTitle}>{t('tenantGroups.filters.tipInvitationsTitle')}</p>
                            <p className={styles.tipText}>{t('tenantGroups.filters.tipInvitationsText')}</p>
                        </div>
                    </div>

                    <div className={styles.tipItem}>
                        <span className={`${styles.tipIcon} ${styles.purpleSoft}`}>
                            <UserGroupIcon className={styles.iconSmall} aria-hidden="true" />
                        </span>
                        <div>
                            <p className={styles.tipTitle}>{t('tenantGroups.filters.tipMultipleGroupsTitle')}</p>
                            <p className={styles.tipText}>{t('tenantGroups.filters.tipMultipleGroupsText')}</p>
                        </div>
                    </div>

                    <div className={styles.tipItem}>
                        <span className={`${styles.tipIcon} ${styles.orangeSoft}`}>
                            <CalendarDaysIcon className={styles.iconSmall} aria-hidden="true" />
                        </span>
                        <div>
                            <p className={styles.tipTitle}>{t('tenantGroups.filters.tipApartmentOptionalTitle')}</p>
                            <p className={styles.tipText}>{t('tenantGroups.filters.tipApartmentOptionalText')}</p>
                        </div>
                    </div>
                </div>
            </section>
        </aside>
    )
}
