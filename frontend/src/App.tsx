import { useEffect, useState } from 'react'

import logo from '@/assets/logo.png'
import DashboardPlaceholderPage from './pages/DashboardPlaceholderPage'
import LoginPage from './pages/LoginPage'
import OwnerComingSoonPage from './pages/OwnerComingSoonPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import RegisterPage from './pages/RegisterPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import TenantOnboardingPage from './pages/TenantOnboardingPage'
import OwnerDashboardPage from './pages/OwnerDashboardPage'

function normalizePath(pathname: string) {
  if (!pathname) {
    return '/'
  }

  const normalized = pathname.replace(/\/+$/, '')
  return normalized === '' ? '/' : normalized
}

function resolvePathFromLocation() {
  const pathname = normalizePath(window.location.pathname)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const queryParams = new URLSearchParams(window.location.search)

  const flowType = (hashParams.get('type') || queryParams.get('type') || '').trim().toLowerCase()
  const hasAccessToken = (hashParams.get('access_token') || queryParams.get('access_token') || '').trim().length > 0
  const hasTokenHash = (hashParams.get('token_hash') || queryParams.get('token_hash') || '').trim().length > 0

  if (pathname === '/') {
    if (flowType === 'recovery' && hasAccessToken) {
      return '/reset-password'
    }

    if ((flowType === 'signup' || hasTokenHash) && (hasAccessToken || hasTokenHash)) {
      return '/auth/callback'
    }
  }

  return pathname
}

export default function App() {
  const [path, setPath] = useState(() => resolvePathFromLocation())

  useEffect(() => {
    const resolvedPath = resolvePathFromLocation()
    const currentPath = normalizePath(window.location.pathname)
    if (resolvedPath !== currentPath) {
      window.history.replaceState({}, '', `${resolvedPath}${window.location.search}${window.location.hash}`)
      setPath(resolvedPath)
    }

    document.title = 'Roomies'

    const favicon = document.querySelector("link[rel='icon']") ?? document.createElement('link')
    favicon.setAttribute('rel', 'icon')
    favicon.setAttribute('type', 'image/png')
    favicon.setAttribute('href', logo)

    if (!favicon.parentElement) {
      document.head.appendChild(favicon)
    }

    const handlePopState = () => {
      setPath(resolvePathFromLocation())
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  function navigateTo(nextPath: string) {
    const normalizedPath = normalizePath(nextPath)
    if (normalizePath(window.location.pathname) === normalizedPath) {
      return
    }

    window.history.pushState({}, '', normalizedPath)
    setPath(normalizedPath)
  }

  function handleAuthSuccess(payload: { role?: 'tenant' | 'owner'; needsOnboarding?: boolean }) {
    if (payload.role === 'tenant' && payload.needsOnboarding) {
      navigateTo('/onboarding/tenant')
      return
    }

    if (payload.role === 'owner') {
      navigateTo('/owner/dashboard')
      return
    }

    navigateTo('/app')
  }

  if (path === '/register') {
    return <RegisterPage onNavigateToLogin={() => navigateTo('/')} onRegisterSuccess={handleAuthSuccess} />
  }

  if (path === '/auth/callback') {
    return <AuthCallbackPage onResolved={handleAuthSuccess} onNavigateToLogin={() => navigateTo('/')} />
  }

  if (path === '/reset-password') {
    return <ResetPasswordPage onNavigateToLogin={() => navigateTo('/')} />
  }

  if (path === '/onboarding/tenant') {
    return <TenantOnboardingPage onCompleted={() => navigateTo('/app')} />
  }

  if (path === '/owner/coming-soon') {
    return <OwnerComingSoonPage />
  }

  if (path === '/owner/dashboard') {
    return <OwnerDashboardPage />
  }

  if (path === '/app') {
    return <DashboardPlaceholderPage />
  }

  return <LoginPage onNavigateToRegister={() => navigateTo('/register')} onLoginSuccess={handleAuthSuccess} />
}
