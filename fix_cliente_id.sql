-- SQL para corrigir o problema do cliente_id null
-- Execute este código limpo no Supabase SQL Editor

CREATE OR REPLACE FUNCTION generate_cliente_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cliente_id IS NULL OR NEW.cliente_id = '' THEN
    NEW.cliente_id := 'auto_' || NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_cliente_id ON cliente_config;

CREATE TRIGGER auto_generate_cliente_id
  BEFORE INSERT ON cliente_config
  FOR EACH ROW
  EXECUTE FUNCTION generate_cliente_id();

CREATE OR REPLACE FUNCTION create_cliente_config(
  p_auth_user_id text DEFAULT NULL,
  p_cliente_id text DEFAULT NULL,
  p_evo_instance text DEFAULT NULL,
  p_nome_tabela_leads text DEFAULT NULL,
  p_prompt text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  result_record cliente_config%ROWTYPE;
  final_cliente_id text;
BEGIN
  final_cliente_id := COALESCE(p_cliente_id, p_auth_user_id);
  
  IF final_cliente_id IS NULL OR final_cliente_id = '' THEN
    final_cliente_id := 'auto_' || gen_random_uuid()::text;
  END IF;

  INSERT INTO cliente_config (
    cliente_id, 
    evo_instance, 
    nome_tabela_leads, 
    prompt,
    created_at,
    updated_at
  )
  VALUES (
    final_cliente_id,
    p_evo_instance,
    COALESCE(p_nome_tabela_leads, 'base_leads_' || final_cliente_id),
    p_prompt,
    now(),
    now()
  )
  ON CONFLICT (cliente_id) 
  DO UPDATE SET
    evo_instance = COALESCE(EXCLUDED.evo_instance, cliente_config.evo_instance),
    nome_tabela_leads = COALESCE(EXCLUDED.nome_tabela_leads, cliente_config.nome_tabela_leads),
    prompt = COALESCE(EXCLUDED.prompt, cliente_config.prompt),
    updated_at = now()
  RETURNING * INTO result_record;

  RETURN row_to_json(result_record);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_cliente_config TO anon, authenticated, service_role;
