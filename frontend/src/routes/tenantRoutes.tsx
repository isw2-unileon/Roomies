import { Navigate, Route } from 'react-router-dom'

import TenantApplicationsPage from '@/pages/tenant/TenantApplicationsPage'
import TenantExploreDetailPage from '@/pages/tenant/TenantExploreDetailPage'
import TenantExplorePage from '@/pages/tenant/TenantExplorePage'
import TenantGroupsPage from '@/pages/tenant/TenantGroupsPage'
import TenantMessagesPage from '@/pages/tenant/TenantMessagesPage'
import TenantNotificationsPage from '@/pages/tenant/TenantNotificationsPage'
import TenantOnboardingPage from '@/pages/tenant/TenantOnboardingPage'
import TenantProfilePage from '@/pages/tenant/TenantProfilePage'
import ProtectedRoleRoute from '@/routes/ProtectedRoleRoute'

import { paths } from './paths'

interface TenantRoutesConfig {
  onTenantOnboardingCompleted: () => void
}

export function getTenantRoutes({ onTenantOnboardingCompleted }: TenantRoutesConfig) {
  return (
    <>
      <Route
        path={paths.tenantOnboarding}
        element={<TenantOnboardingPage onCompleted={onTenantOnboardingCompleted} />}
      />
      <Route path="/tenant" element={<Navigate to={paths.tenantExplore} replace />} />
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
    </>
  )
}
