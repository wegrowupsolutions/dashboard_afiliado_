-- CORREÇÃO: Ajustar cliente_id em cliente_config para fazer match com dados_cliente

-- Primeiro, vamos ver qual usuário corresponde a qual baseado no contexto
-- (você pode me dizer qual cliente_config pertence a qual usuário)

-- OPÇÃO 1: Se soubermos o mapeamento exato
-- UPDATE cliente_config SET cliente_id = 'bca722ec-3cad-4eb5-9ce1-167d1013df4e' WHERE cliente_id = '0a90d9be-08b5-4882-9f92-0067503e4e60';
-- UPDATE cliente_config SET cliente_id = 'c9ce492b-8a79-41e1-8b1c-8b2146a2b53f' WHERE cliente_id = '151c880d-0c84-4073-a33d-bcc5b38b9902';

-- OPÇÃO 2: Vamos primeiro identificar qual é qual baseado em algum critério
SELECT 
    'CLIENTE_CONFIG' as tabela,
    cliente_id,
    evo_instance,
    created_at
FROM cliente_config
ORDER BY created_at;

SELECT 
    'DADOS_CLIENTE' as tabela, 
    cliente_id,
    nome,
    created_at
FROM dados_cliente
ORDER BY created_at;
