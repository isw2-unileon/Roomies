DROP TRIGGER IF EXISTS update_apartment_rules_updated_at
ON apartment_rules;

CREATE TRIGGER update_apartment_rules_updated_at
BEFORE UPDATE ON apartment_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();