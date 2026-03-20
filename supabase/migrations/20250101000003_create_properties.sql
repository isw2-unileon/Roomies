CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  area TEXT,
  total_rooms INT NOT NULL,
  available_rooms INT NOT NULL,
  base_rent INT NOT NULL,       
  current_rent INT NOT NULL,    
  status TEXT CHECK (status IN ('open', 'closed', 'full')) DEFAULT 'open',
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);