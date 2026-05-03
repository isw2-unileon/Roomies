import { useTranslation } from 'react-i18next'

import styles from '@/styles/LanguageSwitcher.module.css'

const SUPPORTED_LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
] as const

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code']

function isSupportedLanguage(language: string): language is SupportedLanguage {
  return SUPPORTED_LANGUAGES.some((supportedLanguage) => supportedLanguage.code === language)
}

interface LanguageSwitcherProps {
  showLabel?: boolean
}

export default function LanguageSwitcher({ showLabel = true }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language
  const selectedLanguage = isSupportedLanguage(currentLanguage) ? currentLanguage : 'es'
  const selectLabel = t('common.language.selectLabel')

  return (
    <div className={styles.wrapper}>
      {showLabel ? (
        <label className={styles.label} htmlFor="language-select">
          {selectLabel}
        </label>
      ) : null}
      <select
        id="language-select"
        className={styles.select}
        aria-label={showLabel ? undefined : selectLabel}
        value={selectedLanguage}
        onChange={(event) => {
          void i18n.changeLanguage(event.target.value)
        }}
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
    </div>
  )
}
