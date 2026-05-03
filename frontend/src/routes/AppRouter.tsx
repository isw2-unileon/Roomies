import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import { paths } from './paths'
import { getAuthRoutes } from './authRoutes'
import { getOwnerRoutes } from './ownerRoutes'
import { resolvePostAuthPath, type AuthSuccessPayload } from './postAuthRedirect'
import { getTenantRoutes } from './tenantRoutes'

function AppRoutes() {
  const navigate = useNavigate()

  function handleAuthSuccess(payload: AuthSuccessPayload) {
    navigate(resolvePostAuthPath(payload))
  }

  return (
    <Routes>
      {getAuthRoutes({
        onAuthSuccess: handleAuthSuccess,
        onNavigateToLogin: () => navigate(paths.login),
        onNavigateToRegister: () => navigate(paths.register),
      })}
      {getTenantRoutes({ onTenantOnboardingCompleted: () => navigate(paths.tenantExplore) })}
      {getOwnerRoutes()}
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
