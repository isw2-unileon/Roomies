DROP TRIGGER IF EXISTS update_closure_requests_updated_at
ON closure_requests;

CREATE TRIGGER update_closure_requests_updated_at
BEFORE UPDATE ON closure_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();