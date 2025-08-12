-- Alternativa: Criar entrada na tabela users primeiro
-- Execute estes comandos no Supabase SQL Editor

-- 1. Função para criar cliente_config COM usuário na tabela auth.users
CREATE OR REPLACE FUNCTION create_cliente_config_with_user(
  p_user_id text,
  p_email text DEFAULT NULL,
  p_evo_instance text DEFAULT NULL,
  p_nome_tabela_leads text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  result_record cliente_config%ROWTYPE;
  user_uuid uuid;
BEGIN
  -- Converter string para UUID
  user_uuid := p_user_id::uuid;
  
  -- Criar ou verificar se usuário existe na tabela auth.users
  INSERT INTO auth.users (
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
  )
  VALUES (
    user_uuid,
    COALESCE(p_email, p_user_id || '@generated.local'),
    now(),
    now(),
    now(),
    '{"provider": "generated", "providers": ["generated"]}',
    '{}'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Agora inserir na cliente_config
  INSERT INTO cliente_config (
    cliente_id, 
    evo_instance, 
    nome_tabela_leads,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_evo_instance,
    COALESCE(p_nome_tabela_leads, 'base_leads_' || p_user_id),
    now(),
    now()
  )
  ON CONFLICT (cliente_id) 
  DO UPDATE SET
    evo_instance = COALESCE(EXCLUDED.evo_instance, cliente_config.evo_instance),
    nome_tabela_leads = COALESCE(EXCLUDED.nome_tabela_leads, cliente_config.nome_tabela_leads),
    updated_at = now()
  RETURNING * INTO result_record;

  RETURN row_to_json(result_record);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar cliente_config: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Dar permissões
GRANT EXECUTE ON FUNCTION create_cliente_config_with_user TO service_role;
