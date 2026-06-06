CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_individual_active_unique
ON applications (apartment_id, tenant_id)
WHERE tenant_id IS NOT NULL
  AND status IN ('PENDING_OWNER', 'PENDING_CONFIRMED_TENANTS');

CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_group_active_unique
ON applications (apartment_id, group_id)
WHERE group_id IS NOT NULL
  AND status IN ('PENDING_OWNER', 'PENDING_CONFIRMED_TENANTS');
