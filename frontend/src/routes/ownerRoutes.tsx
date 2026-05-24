import { Route } from 'react-router-dom'

import OwnerComingSoonPage from '@/pages/owner/OwnerComingSoonPage'
import OwnerDashboardPage from '@/pages/owner/OwnerDashboardPage'
import OwnerPublishPropertyPage from '@/pages/owner/OwnerPublishPropertyPage'
import ProtectedRoleRoute from '@/routes/ProtectedRoleRoute'

import { paths } from './paths'

export function getOwnerRoutes() {
  return (
    <>
      <Route
        path={paths.ownerComingSoon}
        element={(
          <ProtectedRoleRoute requiredRole="owner">
            <OwnerComingSoonPage />
          </ProtectedRoleRoute>
        )}
      />
      <Route
        path={paths.ownerDashboard}
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
    </>
  )
}
