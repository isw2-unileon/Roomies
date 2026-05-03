import { useState } from 'react'
import OwnerDashboardLayout from '@/components/owner/OwnerDashboardLayout'
import OwnerPropertyPublishForm from '@/components/owner/OwnerPropertyPublishForm'
import type { OwnerNavTab } from '@/types/owner'

export default function OwnerPublishPropertyPage() {
  const [activeTab, setActiveTab] = useState<OwnerNavTab>('properties')

  return (
    <OwnerDashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <OwnerPropertyPublishForm />
    </OwnerDashboardLayout>
  )
}
