DROP TRIGGER IF EXISTS update_applications_updated_at
ON applications;

CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();