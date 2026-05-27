ALTER TABLE groups
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS apartment_id UUID REFERENCES apartments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_groups_created_by
ON groups(created_by);

CREATE INDEX IF NOT EXISTS idx_groups_status
ON groups(status);

CREATE INDEX IF NOT EXISTS idx_groups_apartment_id
ON groups(apartment_id);

CREATE INDEX IF NOT EXISTS idx_group_members_status
ON group_members(status);

CREATE INDEX IF NOT EXISTS idx_group_members_group_user_status
ON group_members(group_id, user_id, status);

CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id
ON group_invitations(group_id);

CREATE INDEX IF NOT EXISTS idx_group_invitations_invited_user_id
ON group_invitations(invited_user_id);

CREATE INDEX IF NOT EXISTS idx_group_invitations_status
ON group_invitations(status);

CREATE INDEX IF NOT EXISTS idx_group_invitations_group_user_status
ON group_invitations(group_id, invited_user_id, status);