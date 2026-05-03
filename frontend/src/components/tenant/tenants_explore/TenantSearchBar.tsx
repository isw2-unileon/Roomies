import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import styles from '@/styles/TenantSearchBar.module.css'

interface TenantSearchBarProps {
    placeholder?: string
    onSearch?: (query: string) => void
}

export default function TenantSearchBar({ placeholder, onSearch = () => {} }: TenantSearchBarProps) {
    const { t } = useTranslation()
    const [query, setQuery] = useState('')

    function handleSubmit(e: FormEvent) {
        e.preventDefault()
        onSearch(query)
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputWrap}>
                <div className={styles.searchIcon}>
                    <MagnifyingGlassIcon className={styles.icon} aria-hidden="true" />
                </div>
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder ?? t('tenantDashboard.search.placeholder')}
                    aria-label={t('tenantDashboard.search.ariaLabel')}
                    className={styles.input}
                />
            </div>

            <button
                type="submit"
                className={styles.submitButton}
            >
                {t('tenantDashboard.search.submit')}
            </button>

            <button
                type="button"
                className={styles.secondaryButton}
                aria-label={t('tenantDashboard.search.location')}
            >
                <MapPinIcon className={styles.icon} aria-hidden="true" />
                <span className={styles.secondaryLabel}>{t('tenantDashboard.search.location')}</span>
            </button>

            <button
                type="button"
                className={styles.secondaryButton}
                aria-label={t('tenantDashboard.search.filters')}
            >
                <AdjustmentsHorizontalIcon className={styles.icon} aria-hidden="true" />
                <span className={styles.secondaryLabel}>{t('tenantDashboard.search.filters')}</span>
            </button>
        </form>
    )
}
