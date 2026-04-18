import i18n from '@/i18n'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

beforeEach(async () => {
  localStorage.setItem('roomies.lang', 'es')
  await i18n.changeLanguage('es')
})

afterEach(() => {
  cleanup()
})