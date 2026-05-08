DROP TRIGGER IF EXISTS update_owner_profiles_updated_at
ON owner_profiles;

CREATE TRIGGER update_owner_profiles_updated_at
BEFORE UPDATE ON owner_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();