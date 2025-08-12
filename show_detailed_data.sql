-- Ver dados detalhados das duas tabelas

-- 1. Dados em cliente_config
SELECT 'CLIENTE_CONFIG' as origem, cliente_id, base_leads, evo_instance 
FROM cliente_config;

-- 2. Dados em dados_cliente
SELECT 'DADOS_CLIENTE' as origem, cliente_id, nome, email 
FROM dados_cliente;

-- 3. Comparar cliente_id lado a lado
SELECT 
    cc.cliente_id as config_cliente_id,
    dc.cliente_id as dados_cliente_id,
    dc.nome,
    cc.base_leads,
    CASE 
        WHEN cc.cliente_id = dc.cliente_id THEN '✅ MATCH'
        ELSE '❌ NO MATCH'
    END as status_match
FROM cliente_config cc
FULL OUTER JOIN dados_cliente dc ON cc.cliente_id = dc.cliente_id;
