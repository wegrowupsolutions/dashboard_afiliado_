-- Teste das funções do Supabase
-- Execute este SQL para testar se tudo está funcionando

-- 1. Testar a função create_cliente_config
SELECT create_cliente_config(
  p_auth_user_id := '123',
  p_cliente_id := NULL, -- deixar null para testar auto-geração
  p_evo_instance := 'teste_manual',
  p_nome_tabela_leads := NULL, -- será auto-gerado
  p_prompt := NULL
);

-- 2. Verificar se foi inserido
SELECT * FROM cliente_config WHERE evo_instance = 'teste_manual';

-- 3. Testar inserção direta (simulando backend)
INSERT INTO cliente_config (cliente_id, evo_instance, nome_tabela_leads)
VALUES ('teste_456', 'instancia_teste', 'base_leads_teste_456');

-- 4. Verificar todas as configurações
SELECT 
  cliente_id,
  evo_instance,
  nome_tabela_leads,
  created_at
FROM cliente_config 
ORDER BY created_at DESC;

-- 5. Limpar dados de teste (opcional)
-- DELETE FROM cliente_config WHERE cliente_id LIKE 'teste_%' OR cliente_id LIKE 'auto_%';
