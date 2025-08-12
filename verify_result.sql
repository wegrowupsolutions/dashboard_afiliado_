-- Verificar se os campos base_leads foram preenchidos
SELECT 
    cc.cliente_id,
    dc.nome as cliente_nome,
    cc.base_leads,
    CASE 
        WHEN cc.base_leads IS NOT NULL THEN '✅ OK'
        ELSE '❌ NULL'
    END as status
FROM cliente_config cc
JOIN dados_cliente dc ON cc.cliente_id = dc.cliente_id
ORDER BY dc.nome;
