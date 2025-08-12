-- Configurações do Supabase para tabela cliente_config
-- Execute estes comandos no SQL Editor do Supabase

-- 1. Modificar a tabela cliente_config para permitir inserção via backend
-- Remover a constraint NOT NULL temporariamente ou ajustar conforme necessário

-- 2. Criar ou ajustar as políticas RLS (Row Level Security)

-- Política para permitir que o backend (service_role) insira dados
CREATE POLICY "Backend can insert cliente_config" 
ON cliente_config FOR INSERT 
WITH CHECK (true);

-- Política para permitir que usuários vejam apenas suas próprias configurações
CREATE POLICY "Users can view own config" 
ON cliente_config FOR SELECT 
USING (cliente_id = auth.uid()::text);

-- Política para permitir que usuários atualizem apenas suas próprias configurações
CREATE POLICY "Users can update own config" 
ON cliente_config FOR UPDATE 
USING (cliente_id = auth.uid()::text)
WITH CHECK (cliente_id = auth.uid()::text);

-- 3. Habilitar RLS na tabela
ALTER TABLE cliente_config ENABLE ROW LEVEL SECURITY;

-- 4. Criar função para gerar cliente_id automaticamente (OBRIGATÓRIO para resolver o erro)
CREATE OR REPLACE FUNCTION generate_cliente_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Se cliente_id não foi fornecido, gerar um baseado no ID do registro
  IF NEW.cliente_id IS NULL OR NEW.cliente_id = '' THEN
    NEW.cliente_id := 'auto_' || NEW.id;
    RAISE NOTICE 'Auto-generated cliente_id: %', NEW.cliente_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para auto-gerar cliente_id (opcional)
DROP TRIGGER IF EXISTS auto_generate_cliente_id ON cliente_config;
CREATE TRIGGER auto_generate_cliente_id
  BEFORE INSERT ON cliente_config
  FOR EACH ROW
  EXECUTE FUNCTION generate_cliente_id();

-- 6. Criar função para o backend inserir dados (COM VALIDAÇÃO)
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
  -- Determinar o cliente_id a usar (prioridade: p_cliente_id, depois p_auth_user_id)
  final_cliente_id := COALESCE(p_cliente_id, p_auth_user_id);
  
  -- Se ainda for NULL, gerar um ID único
  IF final_cliente_id IS NULL OR final_cliente_id = '' THEN
    final_cliente_id := 'auto_' || gen_random_uuid()::text;
  END IF;

  RAISE NOTICE 'Inserindo cliente_config com cliente_id: %', final_cliente_id;

  -- Inserir ou atualizar configuração do cliente
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

  -- Retornar o resultado como JSON
  RETURN row_to_json(result_record);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar cliente_config: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Dar permissões para a função
GRANT EXECUTE ON FUNCTION create_cliente_config TO anon, authenticated, service_role;

-- 8. Criar index para performance
CREATE INDEX IF NOT EXISTS idx_cliente_config_cliente_id ON cliente_config(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_config_evo_instance ON cliente_config(evo_instance);

-- 9. Verificar se a estrutura está correta
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'cliente_config';
