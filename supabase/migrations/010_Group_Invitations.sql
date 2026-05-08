CREATE TABLE IF NOT EXISTS group_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    group_id UUID NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (
        status IN (
            'PENDING',
            'ACCEPTED',
            'REJECTED',
            'EXPIRED'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);