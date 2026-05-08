CREATE TABLE IF NOT EXISTS tenant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    budget_min INT,
    budget_max INT,
    preferred_area TEXT,
    move_in_date DATE,
    cleanliness TEXT CHECK (
        cleanliness IN (
            'very_clean',
            'normal',
            'relaxed'
        )
    ),
    noise_level TEXT CHECK (
        noise_level IN ('quiet', 'moderate', 'loud')
    ),
    smoking BOOLEAN DEFAULT FALSE,
    pets BOOLEAN DEFAULT FALSE,
    sleep_schedule TEXT CHECK (
        sleep_schedule IN ('early', 'night', 'flexible')
    ),
    social_lifestyle TEXT CHECK (
        social_lifestyle IN (
            'introvert',
            'balanced',
            'social'
        )
    ),
    study_habits TEXT CHECK (
        study_habits IN ('quiet', 'moderate', 'group')
    ),
    work_schedule TEXT CHECK (
        work_schedule IN (
            'morning',
            'night',
            'flexible'
        )
    ),
    language TEXT,
    university TEXT,
    age INT,
    guest_preferences TEXT,
    party_frequency TEXT CHECK (
        party_frequency IN ('never', 'sometimes', 'often')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);