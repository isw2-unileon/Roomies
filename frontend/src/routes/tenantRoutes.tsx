import { Route } from 'react-router-dom'

import TenantDashboardPage from '@/pages/TenantDashboardPage'
import TenantOnboardingPage from '@/pages/TenantOnboardingPage'

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
      <Route path={paths.tenantExplore} element={<TenantDashboardPage />} />
    </>
  )
}
