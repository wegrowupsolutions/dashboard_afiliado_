-- DIAGNÓSTICO: Verificar dados nas tabelas

-- 1. Verificar dados em cliente_config
SELECT 'CLIENTE_CONFIG' as tabela, cliente_id, base_leads, evo_instance 
FROM cliente_config 
LIMIT 5;

-- 2. Verificar dados em dados_cliente  
SELECT 'DADOS_CLIENTE' as tabela, id, cliente_id, nome, email 
FROM dados_cliente 
LIMIT 5;

-- 3. Verificar se há problema no relacionamento
SELECT 
    'RELACIONAMENTO' as tipo,
    cc.cliente_id as cc_cliente_id,
    dc.cliente_id as dc_cliente_id,
    dc.nome,
    cc.base_leads
FROM cliente_config cc
FULL OUTER JOIN dados_cliente dc ON cc.cliente_id = dc.cliente_id;

-- 4. Contar registros
SELECT 
    (SELECT COUNT(*) FROM cliente_config) as total_cliente_config,
    (SELECT COUNT(*) FROM dados_cliente) as total_dados_cliente;
