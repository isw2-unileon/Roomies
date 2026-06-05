ALTER TABLE group_join_requests
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'DIRECT_REQUEST'
CHECK (source IN ('DIRECT_REQUEST', 'GROUP_INVITATION'));

UPDATE group_join_requests
SET source = 'DIRECT_REQUEST'
WHERE source IS NULL OR source = '';

CREATE INDEX IF NOT EXISTS idx_group_join_requests_source
ON group_join_requests(source);
