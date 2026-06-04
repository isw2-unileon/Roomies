import { useLocation, useNavigate } from 'react-router-dom'

import TenantGroupForm from '@/components/tenant/tenant_groups/TenantGroupForm'
import TenantLayout from '@/components/tenant/TenantLayout'
import { paths } from '@/routes/paths'
import styles from '@/styles/TenantCreateGroup.module.css'

interface CreateGroupLocationState {
  preselectedUserId?: string
  preselectedApartmentId?: string
}

export default function TenantCreateGroupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as CreateGroupLocationState

  return (
    <TenantLayout>
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>Crear nuevo grupo</h1>
        <TenantGroupForm
          onSuccess={() => navigate(paths.tenantGroups)}
          preselectedUserId={state.preselectedUserId}
          preselectedApartmentId={state.preselectedApartmentId}
        />
      </div>
    </TenantLayout>
  )
}
