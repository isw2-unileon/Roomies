import { useEffect, useState, type ReactElement } from 'react'
import { Navigate } from 'react-router-dom'

import { paths } from '@/routes/paths'
import { getProfileStatus, type UserRole } from '@/services/authService'
import { clearAuthSession } from '@/session/authSession'

interface ProtectedRoleRouteProps {
  requiredRole: UserRole
  children: ReactElement
}

export default function ProtectedRoleRoute({ requiredRole, children }: ProtectedRoleRouteProps) {
  const [status, setStatus] = useState<'checking' | 'allowed' | 'blocked'>('checking')
  const [resolvedRole, setResolvedRole] = useState<UserRole | ''>('')

  useEffect(() => {
    let ignoreResult = false

    async function verifyAccess() {
      try {
        const profile = await getProfileStatus()
        if (ignoreResult) {
          return
        }

        const role = profile.role ?? ''
        setResolvedRole(role)
        setStatus(role === requiredRole ? 'allowed' : 'blocked')
      } catch {
        if (!ignoreResult) {
          clearAuthSession()
          setResolvedRole('')
          setStatus('blocked')
        }
      }
    }

    void verifyAccess()

    return () => {
      ignoreResult = true
    }
  }, [requiredRole])

  if (status === 'checking') {
    return <p role="status">Validando sesion...</p>
  }

  if (status === 'allowed') {
    return children
  }

  if (requiredRole === 'tenant' && resolvedRole === 'owner') {
    return <Navigate to={paths.ownerDashboard} replace />
  }

  if (requiredRole === 'owner' && resolvedRole === 'tenant') {
    return <Navigate to={paths.tenantExplore} replace />
  }

  return <Navigate to={paths.login} replace />
}
