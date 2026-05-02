import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import styles from '@/styles/TenantSearchBar.module.css'

interface TenantSearchBarProps {
    placeholder?: string
    onSearch?: (query: string) => void
}

function SearchIcon() {
    return (
        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
    )
}

function MapPinIcon() {
    return (
        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
    )
}

function AdjustmentsIcon() {
    return (
        <svg className={styles.icon} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM10.5 6v12a2.25 2.25 0 01-2.25 2.25H5.25a2.25 2.25 0 01-2.25-2.25V6m3.75 9v6m3-3l-3 1.5m0 0l-3-1.5m3 1.5v-6m-3-3l3-1.5m0 0l-3 1.5" />
        </svg>
    )
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
                    <SearchIcon />
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
                <MapPinIcon />
                <span className={styles.secondaryLabel}>{t('tenantDashboard.search.location')}</span>
            </button>

            <button
                type="button"
                className={styles.secondaryButton}
                aria-label={t('tenantDashboard.search.filters')}
            >
                <AdjustmentsIcon />
                <span className={styles.secondaryLabel}>{t('tenantDashboard.search.filters')}</span>
            </button>
        </form>
    )
}
