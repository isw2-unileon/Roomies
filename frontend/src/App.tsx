import { useEffect, useState } from 'react'

import logo from '@/assets/logo.png'
import DashboardPlaceholderPage from './pages/DashboardPlaceholderPage'
import LoginPage from './pages/LoginPage'
import OwnerComingSoonPage from './pages/OwnerComingSoonPage'
import RegisterPage from './pages/RegisterPage'
import TenantOnboardingPage from './pages/TenantOnboardingPage'

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

  function handleAuthSuccess(payload: { role?: 'tenant' | 'owner'; needsOnboarding?: boolean }) {
    if (payload.role === 'tenant' && payload.needsOnboarding) {
      navigateTo('/onboarding/tenant')
      return
    }

    if (payload.role === 'owner') {
      navigateTo('/owner/coming-soon')
      return
    }

    navigateTo('/app')
  }

  if (path === '/register') {
    return <RegisterPage onNavigateToLogin={() => navigateTo('/')} onRegisterSuccess={handleAuthSuccess} />
  }

  if (path === '/onboarding/tenant') {
    return <TenantOnboardingPage onCompleted={() => navigateTo('/app')} />
  }

  if (path === '/owner/coming-soon') {
    return <OwnerComingSoonPage />
  }

  if (path === '/app') {
    return <DashboardPlaceholderPage />
  }

  return <LoginPage onNavigateToRegister={() => navigateTo('/register')} onLoginSuccess={handleAuthSuccess} />
}
