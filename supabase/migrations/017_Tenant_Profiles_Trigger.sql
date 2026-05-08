DROP TRIGGER IF EXISTS update_tenant_profiles_updated_at ON tenant_profiles;

CREATE TRIGGER update_tenant_profiles_updated_at
BEFORE UPDATE ON tenant_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();