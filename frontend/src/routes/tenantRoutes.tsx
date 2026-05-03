import { Navigate, Route } from 'react-router-dom'

import TenantApplicationsPage from '@/pages/tenant/TenantApplicationsPage'
import TenantExplorePage from '@/pages/tenant/TenantExplorePage'
import TenantGroupsPage from '@/pages/tenant/TenantGroupsPage'
import TenantMessagesPage from '@/pages/tenant/TenantMessagesPage'
import TenantNotificationsPage from '@/pages/tenant/TenantNotificationsPage'
import TenantOnboardingPage from '@/pages/tenant/TenantOnboardingPage'
import TenantProfilePage from '@/pages/tenant/TenantProfilePage'

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
      <Route path={paths.tenantExplore} element={<TenantExplorePage />} />
      <Route path={paths.tenantApplications} element={<TenantApplicationsPage />} />
      <Route path={paths.tenantGroups} element={<TenantGroupsPage />} />
      <Route path={paths.tenantMessages} element={<TenantMessagesPage />} />
      <Route path={paths.tenantNotifications} element={<TenantNotificationsPage />} />
      <Route path={paths.tenantProfile} element={<TenantProfilePage />} />
    </>
  )
}
