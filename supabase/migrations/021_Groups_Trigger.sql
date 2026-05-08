DROP TRIGGER IF EXISTS update_groups_updated_at
ON groups;

CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON groups
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();