-- Solução definitiva para o erro UUID
-- Execute estes comandos em ordem no Supabase

-- 1. Primeiro, remover o trigger atual
DROP TRIGGER IF EXISTS auto_generate_cliente_id ON cliente_config;

-- 2. Criar função que funciona com UUID ou TEXT
CREATE OR REPLACE FUNCTION generate_cliente_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Só verificar se é NULL, sem comparar com string vazia
  IF NEW.cliente_id IS NULL THEN
    -- Usar o ID da linha como cliente_id (ambos são UUID)
    NEW.cliente_id := NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recriar o trigger
CREATE TRIGGER auto_generate_cliente_id
  BEFORE INSERT ON cliente_config
  FOR EACH ROW
  EXECUTE FUNCTION generate_cliente_id();

-- 4. Testar se funciona
INSERT INTO cliente_config (evo_instance, nome_tabela_leads) 
VALUES ('teste_uuid', 'base_leads_teste');

-- 5. Verificar resultado
SELECT id, cliente_id, evo_instance FROM cliente_config WHERE evo_instance = 'teste_uuid';
