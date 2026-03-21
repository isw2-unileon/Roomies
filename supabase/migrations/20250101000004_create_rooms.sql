CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  room_number INT,
  is_available BOOLEAN DEFAULT TRUE,
  tenant_id UUID REFERENCES users(id) ON DELETE SET NULL
);