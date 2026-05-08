CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    apartment_id UUID NOT NULL REFERENCES apartments (id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES users (id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups (id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (
        type IN ('individual', 'group')
    ),
    status TEXT NOT NULL CHECK (
        status IN (
            'PENDING_OWNER',
            'REJECTED_BY_OWNER',
            'PENDING_CONFIRMED_TENANTS',
            'REJECTED_BY_CONFIRMED_TENANTS',
            'FULLY_CONFIRMED',
            'CANCELLED'
        )
    ),
    owner_confirmed_at TIMESTAMPTZ,
    fully_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (
            tenant_id IS NOT NULL
            AND group_id IS NULL
        )
        OR (
            tenant_id IS NULL
            AND group_id IS NOT NULL
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_applications_apartment_id ON applications (apartment_id);

CREATE INDEX IF NOT EXISTS idx_applications_tenant_id ON applications (tenant_id);

CREATE INDEX IF NOT EXISTS idx_applications_group_id ON applications (group_id);