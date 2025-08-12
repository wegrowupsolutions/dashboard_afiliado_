-- PASSO 3: Execute este terceiro
CREATE TRIGGER auto_generate_cliente_id
  BEFORE INSERT ON cliente_config
  FOR EACH ROW
  EXECUTE FUNCTION generate_cliente_id();
