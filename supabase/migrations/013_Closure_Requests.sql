CREATE TABLE IF NOT EXISTS closure_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    apartment_id UUID NOT NULL REFERENCES apartments (id) ON DELETE CASCADE,
    requested_by_user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    requested_by_group_id UUID REFERENCES groups (id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (
        status IN (
            'PENDING_PARTICIPANTS',
            'PENDING_OWNER',
            'APPROVED_BY_OWNER',
            'REJECTED_BY_OWNER',
            'FULLY_CLOSED',
            'CANCELLED'
        )
    ),
    owner_decision TEXT CHECK (
        owner_decision IN ('APPROVED', 'REJECTED')
    ),
    owner_decided_at TIMESTAMPTZ,
    fully_closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (
            requested_by_user_id IS NOT NULL
            AND requested_by_group_id IS NULL
        )
        OR (
            requested_by_user_id IS NULL
            AND requested_by_group_id IS NOT NULL
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_closure_requests_apartment_id ON closure_requests (apartment_id);