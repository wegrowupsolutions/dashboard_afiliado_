-- Versão corrigida para UUID
-- Execute este comando no Supabase

CREATE OR REPLACE FUNCTION generate_cliente_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Para UUID, só verificamos se é NULL (não string vazia)
  IF NEW.cliente_id IS NULL THEN
    -- Gerar um UUID válido baseado no ID do registro
    NEW.cliente_id := NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
