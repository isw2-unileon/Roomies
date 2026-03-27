import { useEffect, useState } from 'react'

import logo from '@/assets/logo.png'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname)

  useEffect(() => {
    document.title = 'Roomies'

    const favicon = document.querySelector("link[rel='icon']") ?? document.createElement('link')
    favicon.setAttribute('rel', 'icon')
    favicon.setAttribute('type', 'image/png')
    favicon.setAttribute('href', logo)

    if (!favicon.parentElement) {
      document.head.appendChild(favicon)
    }

    const handlePopState = () => {
      setPath(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  function navigateTo(nextPath: string) {
    if (window.location.pathname === nextPath) {
      return
    }

    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }

  if (path === '/register') {
    return <RegisterPage onNavigateToLogin={() => navigateTo('/')} />
  }

  return <LoginPage onNavigateToRegister={() => navigateTo('/register')} />
}
