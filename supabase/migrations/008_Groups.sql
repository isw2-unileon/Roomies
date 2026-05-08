CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    created_by UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name TEXT,
    status TEXT NOT NULL CHECK (
        status IN (
            'FORMING',
            'READY',
            'APPLIED',
            'ACCEPTED',
            'REJECTED',
            'CLOSED'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);