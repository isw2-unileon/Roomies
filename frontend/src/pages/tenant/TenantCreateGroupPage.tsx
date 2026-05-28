import { useNavigate } from 'react-router-dom'
import TenantLayout from '@/components/tenant/TenantLayout'
import TenantGroupForm from '@/components/tenant/tenant_groups/TenantGroupForm'
import styles from '@/styles/TenantCreateGroup.module.css'
import { paths } from '@/routes/paths'

export default function TenantCreateGroupPage() {
  const navigate = useNavigate()

  return (
    <TenantLayout>
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>Crear nuevo grupo</h1>
        <TenantGroupForm
          onSuccess={() => navigate(paths.tenantGroups)}
        />
      </div>
    </TenantLayout>
  )
}
