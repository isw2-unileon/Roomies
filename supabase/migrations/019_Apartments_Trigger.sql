DROP TRIGGER IF EXISTS update_apartments_updated_at
ON apartments;

CREATE TRIGGER update_apartments_updated_at
BEFORE UPDATE ON apartments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();