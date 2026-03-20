CREATE TABLE tenant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  budget_min INT,
  budget_max INT,
  preferred_area TEXT,
  move_in_date DATE,
  schedule TEXT CHECK (schedule IN ('morning', 'night', 'flexible')),
  pets BOOLEAN DEFAULT FALSE,
  smoker BOOLEAN DEFAULT FALSE,
  noise_level TEXT CHECK (noise_level IN ('quiet', 'moderate', 'loud')),
  cleanliness TEXT CHECK (cleanliness IN ('very_clean', 'normal', 'relaxed')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);