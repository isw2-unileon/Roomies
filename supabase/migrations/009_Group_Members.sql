CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    group_id UUID NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
    status TEXT NOT NULL CHECK (
        status IN (
            'INVITED',
            'ACCEPTED',
            'REJECTED',
            'LEFT'
        )
    ),
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members (group_id);

CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members (user_id);