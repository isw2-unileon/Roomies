import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import AuthCallbackPage from '@/pages/auth/AuthCallbackPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import OwnerDashboardPage from '@/pages/owner/OwnerDashboardPage'
import OwnerPublishPropertyPage from '@/pages/owner/OwnerPublishPropertyPage'
import TenantApplicationsPage from '@/pages/tenant/TenantApplicationsPage'
import TenantExploreDetailPage from '@/pages/tenant/TenantExploreDetailPage'
import TenantExplorePage from '@/pages/tenant/TenantExplorePage'
import TenantGroupsPage from '@/pages/tenant/TenantGroupsPage'
import TenantMessagesPage from '@/pages/tenant/TenantMessagesPage'
import TenantNotificationsPage from '@/pages/tenant/TenantNotificationsPage'
import TenantOnboardingPage from '@/pages/tenant/TenantOnboardingPage'
import TenantProfilePage from '@/pages/tenant/TenantProfilePage'

import ProtectedRoleRoute from './ProtectedRoleRoute'
import { paths } from './paths'
import { resolvePostAuthPath, type AuthSuccessPayload } from './postAuthRedirect'

function resolveLoginRedirect(search: string, hash: string) {
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''))
  const queryParams = new URLSearchParams(search)
  const flowType = (hashParams.get('type') || queryParams.get('type') || '').trim().toLowerCase()
  const hasAccessToken = (hashParams.get('access_token') || queryParams.get('access_token') || '').trim().length > 0
  const hasTokenHash = (hashParams.get('token_hash') || queryParams.get('token_hash') || '').trim().length > 0

  if (flowType === 'recovery' && hasAccessToken) {
    return paths.resetPassword
  }
  if ((flowType === 'signup' || hasTokenHash) && (hasAccessToken || hasTokenHash)) {
    return paths.authCallback
  }
  return null
}

interface LoginRouteProps {
  onNavigateToRegister: () => void
  onLoginSuccess: (payload: AuthSuccessPayload) => void
}

function LoginRoute({ onNavigateToRegister, onLoginSuccess }: LoginRouteProps) {
  const location = useLocation()
  const redirectPath = resolveLoginRedirect(location.search, location.hash)

  if (redirectPath) {
    return <Navigate to={`${redirectPath}${location.search}${location.hash}`} replace />
  }

  return <LoginPage onNavigateToRegister={onNavigateToRegister} onLoginSuccess={onLoginSuccess} />
}

function AppRoutes() {
  const navigate = useNavigate()

  function handleAuthSuccess(payload: AuthSuccessPayload) {
    navigate(resolvePostAuthPath(payload))
  }

  return (
    
    <Routes>

      // Login and register routes ----------------------------------------------------------------
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

      // Tenant routes ---------------------------------------------------------------------------
      <Route
        path={paths.tenantOnboarding}
        element={(
          <ProtectedRoleRoute requiredRole="tenant">
            <TenantOnboardingPage onCompleted={() => navigate(paths.tenantExplore)} />
          </ProtectedRoleRoute>
        )}
      />
      <Route
        path={paths.tenantExplore}
        element={(
          <ProtectedRoleRoute requiredRole="tenant">
            <TenantExplorePage />
          </ProtectedRoleRoute>
        )}
      />
      <Route
        path={paths.tenantExploreDetail}
        element={(
          <ProtectedRoleRoute requiredRole="tenant">
            <TenantExploreDetailPage />
          </ProtectedRoleRoute>
        )}
      />
      <Route
        path={paths.tenantApplications}
        element={(
          <ProtectedRoleRoute requiredRole="tenant">
            <TenantApplicationsPage />
          </ProtectedRoleRoute>
        )}
      />
      <Route
        path={paths.tenantGroups}
        element={(
          <ProtectedRoleRoute requiredRole="tenant">
            <TenantGroupsPage />
          </ProtectedRoleRoute>
        )}
      />
      <Route
        path={paths.tenantMessages}
        element={(
          <ProtectedRoleRoute requiredRole="tenant">
            <TenantMessagesPage />
          </ProtectedRoleRoute>
        )}
      />
      <Route
        path={paths.tenantNotifications}
        element={(
          <ProtectedRoleRoute requiredRole="tenant">
            <TenantNotificationsPage />
          </ProtectedRoleRoute>
        )}
      />
      <Route
        path={paths.tenantProfile}
        element={(
          <ProtectedRoleRoute requiredRole="tenant">
            <TenantProfilePage />
          </ProtectedRoleRoute>
        )}
      />


      // Owner routes ----------------------------------------------------------------------------
      <Route
        path={paths.ownerProperties}
        element={(
          <ProtectedRoleRoute requiredRole="owner">
            <OwnerDashboardPage />
          </ProtectedRoleRoute>
        )}
      />
      <Route
        path={paths.ownerPublishProperty}
        element={(
          <ProtectedRoleRoute requiredRole="owner">
            <OwnerPublishPropertyPage />
          </ProtectedRoleRoute>
        )}
      />

      <Route path="*" element={<Navigate to={paths.login} replace />} />
    </Routes>
  )
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
