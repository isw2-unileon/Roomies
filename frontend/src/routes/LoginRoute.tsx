import { Navigate, useLocation } from 'react-router-dom'

import LoginPage from '@/pages/LoginPage'

import { resolveLoginRedirect } from './pathUtils'
import type { AuthSuccessPayload } from './postAuthRedirect'

interface LoginRouteProps {
  onNavigateToRegister: () => void
  onLoginSuccess: (payload: AuthSuccessPayload) => void
}

export default function LoginRoute({ onNavigateToRegister, onLoginSuccess }: LoginRouteProps) {
  const location = useLocation()
  const redirectPath = resolveLoginRedirect(location)

  if (redirectPath) {
    return <Navigate to={`${redirectPath}${location.search}${location.hash}`} replace />
  }

  return <LoginPage onNavigateToRegister={onNavigateToRegister} onLoginSuccess={onLoginSuccess} />
}
