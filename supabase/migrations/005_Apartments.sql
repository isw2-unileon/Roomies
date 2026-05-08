CREATE TABLE IF NOT EXISTS apartments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    owner_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    area TEXT,
    total_spots INT NOT NULL,
    occupied_spots INT NOT NULL DEFAULT 0,
    available_spots INT NOT NULL,
    base_rent INT NOT NULL,
    current_rent INT NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN (
            'AVAILABLE',
            'PARTIALLY_OCCUPIED',
            'FULL',
            'CLOSED',
            'HIDDEN'
        )
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apartments_owner_id ON apartments (owner_id);