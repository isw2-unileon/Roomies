import { useTranslation } from 'react-i18next'

import styles from '@/styles/LanguageSwitcher.module.css'

const SUPPORTED_LANGUAGES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
] as const

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const currentLanguage = i18n.resolvedLanguage ?? i18n.language

  return (
    <div className={styles.wrapper} aria-label={t('common.language.selectorAriaLabel')} role="group">
      {SUPPORTED_LANGUAGES.map((language) => {
        const isActive = currentLanguage === language.code

        return (
          <button
            key={language.code}
            type="button"
            className={`${styles.button} ${isActive ? styles.buttonActive : ''}`}
            onClick={() => {
              void i18n.changeLanguage(language.code)
            }}
            aria-pressed={isActive}
          >
            {language.label}
          </button>
        )
      })}
    </div>
  )
}
