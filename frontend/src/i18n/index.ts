import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './es'
import en from './en'
import fr from './fr'
import de from './de'
const STORAGE_KEY = 'roomies.lang'
const SUPPORTED_LANGUAGES = ['es', 'en', 'fr', 'de'] as const
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

function isSupportedLanguage(language: string | null): language is SupportedLanguage {
  return language !== null && SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)
}

const savedLanguage = localStorage.getItem(STORAGE_KEY)
const initialLanguage = isSupportedLanguage(savedLanguage) ? savedLanguage : 'es'
void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
    fr: { translation: fr },
    de: { translation: de },
  },
  lng: initialLanguage,
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
})
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
})
export default i18n
