ALTER TABLE groups
ADD COLUMN IF NOT EXISTS owner_accepted BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE group_members
ADD COLUMN IF NOT EXISTS member_accepted BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE groups g
SET owner_accepted = TRUE
WHERE g.created_by IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM group_members gm
    WHERE gm.group_id = g.id
      AND gm.user_id = g.created_by
      AND gm.role = 'owner'
      AND gm.status = 'ACCEPTED'
  );

UPDATE group_members
SET member_accepted = TRUE
WHERE status = 'ACCEPTED';
