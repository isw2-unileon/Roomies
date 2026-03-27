import { useEffect } from 'react'

import logo from '@/assets/logo.png'
import LoginPage from './pages/LoginPage'

export default function App() {
  useEffect(() => {
    document.title = 'Roomies'

    const favicon = document.querySelector("link[rel='icon']") ?? document.createElement('link')
    favicon.setAttribute('rel', 'icon')
    favicon.setAttribute('type', 'image/png')
    favicon.setAttribute('href', logo)

    if (!favicon.parentElement) {
      document.head.appendChild(favicon)
    }
  }, [])

  return <LoginPage />
}
