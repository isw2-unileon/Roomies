CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    sender_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    apartment_id UUID REFERENCES apartments (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_apartment_id ON messages (apartment_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
ON messages (apartment_id, sender_id, receiver_id, created_at DESC);
