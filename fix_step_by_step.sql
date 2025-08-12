-- PASSO 1: Execute este primeiro
CREATE OR REPLACE FUNCTION generate_cliente_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cliente_id IS NULL OR NEW.cliente_id = '' THEN
    NEW.cliente_id := 'auto_' || NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
