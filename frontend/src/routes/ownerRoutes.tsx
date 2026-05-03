import { Route } from 'react-router-dom'

import OwnerComingSoonPage from '@/pages/OwnerComingSoonPage'
import OwnerDashboardPage from '@/pages/OwnerDashboardPage'

import { paths } from './paths'

export function getOwnerRoutes() {
  return (
    <>
      <Route path={paths.ownerComingSoon} element={<OwnerComingSoonPage />} />
      <Route path={paths.ownerDashboard} element={<OwnerDashboardPage />} />
    </>
  )
}
