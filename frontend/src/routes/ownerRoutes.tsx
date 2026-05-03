import { Route } from 'react-router-dom'

import OwnerComingSoonPage from '@/pages/OwnerComingSoonPage'
import OwnerDashboardPage from '@/pages/OwnerDashboardPage'
import OwnerPublishPropertyPage from '@/pages/OwnerPublishPropertyPage'

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
