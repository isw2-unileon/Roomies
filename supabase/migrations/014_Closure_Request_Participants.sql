CREATE TABLE IF NOT EXISTS closure_request_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    closure_request_id UUID NOT NULL
        REFERENCES closure_requests(id) ON DELETE CASCADE,

    user_id UUID
        REFERENCES users(id) ON DELETE CASCADE,

    group_id UUID
        REFERENCES groups(id) ON DELETE CASCADE,

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
            user_id IS NOT NULL
            AND group_id IS NULL
        )
        OR
        (
            user_id IS NULL
            AND group_id IS NOT NULL
        )
    )
);