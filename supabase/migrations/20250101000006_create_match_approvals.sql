CREATE TABLE match_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES users(id),
  approver_role TEXT CHECK (approver_role IN ('owner', 'roommate')),
  decision TEXT CHECK (decision IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  decided_at TIMESTAMPTZ
);