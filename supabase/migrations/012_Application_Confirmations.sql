CREATE TABLE IF NOT EXISTS application_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    application_id UUID NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    confirmed_by_user_id UUID REFERENCES users (id) ON DELETE CASCADE,
    confirmed_by_group_id UUID REFERENCES groups (id) ON DELETE CASCADE,
    decision TEXT NOT NULL CHECK (
        decision IN (
            'PENDING',
            'APPROVED',
            'REJECTED'
        )
    ),
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (
        (
            confirmed_by_user_id IS NOT NULL
            AND confirmed_by_group_id IS NULL
        )
        OR (
            confirmed_by_user_id IS NULL
            AND confirmed_by_group_id IS NOT NULL
        )
    )
);