CREATE TABLE IF NOT EXISTS apartment_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    apartment_id UUID NOT NULL UNIQUE REFERENCES apartments (id) ON DELETE CASCADE,
    smoking_allowed BOOLEAN,
    pets_allowed BOOLEAN,
    max_noise_level TEXT CHECK (
        max_noise_level IN ('quiet', 'moderate', 'loud')
    ),
    cleanliness_expectation TEXT CHECK (
        cleanliness_expectation IN (
            'very_clean',
            'normal',
            'relaxed'
        )
    ),
    guests_allowed BOOLEAN,
    parties_allowed BOOLEAN,
    preferred_schedule TEXT CHECK (
        preferred_schedule IN (
            'morning',
            'night',
            'flexible'
        )
    ),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);