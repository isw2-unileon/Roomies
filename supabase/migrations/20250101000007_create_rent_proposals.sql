CREATE TABLE rent_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  proposed_by UUID REFERENCES users(id),
  proposed_rooms INT NOT NULL,      
  proposed_rent INT NOT NULL,       
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);