import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import AuthCallbackPage from '@/pages/AuthCallbackPage'
import LoginPage from '@/pages/LoginPage'
import OwnerComingSoonPage from '@/pages/OwnerComingSoonPage'
import OwnerDashboardPage from '@/pages/OwnerDashboardPage'
import RegisterPage from '@/pages/RegisterPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import TenantDashboardPage from '@/pages/TenantDashboardPage'
import TenantOnboardingPage from '@/pages/TenantOnboardingPage'

import { legacyPaths, paths } from './paths'
import { resolveLoginRedirect } from './pathUtils'

interface AuthSuccessPayload {
  role?: 'tenant' | 'owner'
  needsOnboarding?: boolean
}

function AppRoutes() {
  const navigate = useNavigate()

  function handleAuthSuccess(payload: AuthSuccessPayload) {
    if (payload.role === 'tenant' && payload.needsOnboarding) {
      navigate(paths.tenantOnboarding)
      return
    }

    if (payload.role === 'owner') {
      navigate(paths.ownerDashboard)
      return
    }

    navigate(paths.tenantDashboard)
  }

  return (
    <Routes>
      <Route
        path={paths.login}
        element={<LoginRoute onNavigateToRegister={() => navigate(paths.register)} onLoginSuccess={handleAuthSuccess} />}
      />
      <Route
        path={paths.register}
        element={<RegisterPage onNavigateToLogin={() => navigate(paths.login)} onRegisterSuccess={handleAuthSuccess} />}
      />
      <Route
        path={paths.authCallback}
        element={<AuthCallbackPage onResolved={handleAuthSuccess} onNavigateToLogin={() => navigate(paths.login)} />}
      />
      <Route path={paths.resetPassword} element={<ResetPasswordPage onNavigateToLogin={() => navigate(paths.login)} />} />
      <Route path={paths.tenantOnboarding} element={<TenantOnboardingPage onCompleted={() => navigate(paths.tenantDashboard)} />} />
      <Route path={paths.tenantDashboard} element={<TenantDashboardPage />} />
      <Route path={paths.ownerComingSoon} element={<OwnerComingSoonPage />} />
      <Route path={paths.ownerDashboard} element={<OwnerDashboardPage />} />
      <Route path={legacyPaths.tenantDashboard} element={<Navigate to={paths.tenantDashboard} replace />} />
      <Route path="*" element={<Navigate to={paths.login} replace />} />
    </Routes>
  )
}

interface LoginRouteProps {
  onNavigateToRegister: () => void
  onLoginSuccess: (payload: AuthSuccessPayload) => void
}

function LoginRoute({ onNavigateToRegister, onLoginSuccess }: LoginRouteProps) {
  const location = useLocation()
  const redirectPath = resolveLoginRedirect(location)

  if (redirectPath) {
    return <Navigate to={`${redirectPath}${location.search}${location.hash}`} replace />
  }

  return <LoginPage onNavigateToRegister={onNavigateToRegister} onLoginSuccess={onLoginSuccess} />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
