import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './es'
import en from './en'
const STORAGE_KEY = 'roomies.lang'
const savedLanguage = localStorage.getItem(STORAGE_KEY)
const initialLanguage = savedLanguage === 'en' || savedLanguage === 'es' ? savedLanguage : 'es'
void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
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