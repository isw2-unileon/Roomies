import { Route } from 'react-router-dom'

import OwnerComingSoonPage from '@/pages/owner/OwnerComingSoonPage'
import OwnerDashboardPage from '@/pages/owner/OwnerDashboardPage'
import OwnerPublishPropertyPage from '@/pages/owner/OwnerPublishPropertyPage'

import { paths } from './paths'

export function getOwnerRoutes() {
  return (
    <>
      <Route path={paths.ownerComingSoon} element={<OwnerComingSoonPage />} />
      <Route path={paths.ownerDashboard} element={<OwnerDashboardPage />} />
      <Route path={paths.ownerPublishProperty} element={<OwnerPublishPropertyPage />} />
    </>
  )
}
