CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('tenant', 'owner')) NOT NULL,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);