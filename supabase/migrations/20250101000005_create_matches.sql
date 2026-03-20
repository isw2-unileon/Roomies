CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES users(id),
  property_id UUID REFERENCES properties(id),
  status TEXT CHECK (status IN (
    'pending',      
    'approved',      
    'rejected'     
  )) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);