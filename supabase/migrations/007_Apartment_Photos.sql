CREATE TABLE IF NOT EXISTS apartment_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    apartment_id UUID NOT NULL REFERENCES Apartments (id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    position INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);