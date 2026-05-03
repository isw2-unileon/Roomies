import { Route } from 'react-router-dom'

import AuthCallbackPage from '@/pages/AuthCallbackPage'
import RegisterPage from '@/pages/RegisterPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'

import LoginRoute from './LoginRoute'
import { paths } from './paths'
import type { AuthSuccessPayload } from './postAuthRedirect'

interface AuthRoutesConfig {
  onAuthSuccess: (payload: AuthSuccessPayload) => void
  onNavigateToLogin: () => void
  onNavigateToRegister: () => void
}

export function getAuthRoutes({ onAuthSuccess, onNavigateToLogin, onNavigateToRegister }: AuthRoutesConfig) {
  return (
    <>
      <Route
        path={paths.login}
        element={<LoginRoute onNavigateToRegister={onNavigateToRegister} onLoginSuccess={onAuthSuccess} />}
      />
      <Route
        path={paths.register}
        element={<RegisterPage onNavigateToLogin={onNavigateToLogin} onRegisterSuccess={onAuthSuccess} />}
      />
      <Route
        path={paths.authCallback}
        element={<AuthCallbackPage onResolved={onAuthSuccess} onNavigateToLogin={onNavigateToLogin} />}
      />
      <Route path={paths.resetPassword} element={<ResetPasswordPage onNavigateToLogin={onNavigateToLogin} />} />
    </>
  )
}
