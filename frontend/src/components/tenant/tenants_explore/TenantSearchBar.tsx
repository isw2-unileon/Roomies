import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import styles from '@/styles/TenantSearchBar.module.css'

interface TenantSearchBarProps {
    placeholder?: string
    onSearch?: (query: string) => void
    onReset?: () => void
}

export default function TenantSearchBar({ placeholder, onSearch = () => {}, onReset = () => {} }: TenantSearchBarProps) {
    const { t } = useTranslation()
    const [query, setQuery] = useState('')

    function handleSubmit(e: FormEvent) {
        e.preventDefault()
        onSearch(query)
    }

    function handleChange(nextValue: string) {
        setQuery(nextValue)
        if (nextValue.trim() === '') {
            onSearch('')
        }
    }

    function handleReset() {
        setQuery('')
        onReset()
        onSearch('')
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
                    onChange={(e) => handleChange(e.target.value)}
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
                onClick={handleReset}
            >
                <span className={styles.secondaryLabel}>{t('tenantDashboard.search.reset')}</span>
            </button>
        </form>
    )
}
