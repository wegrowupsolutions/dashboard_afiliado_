-- CORREÇÃO DOS RELACIONAMENTOS cliente_id

-- Atualizar cliente_config para fazer match com dados_cliente
-- teste2 (primeiro) → Vinicius
UPDATE cliente_config 
SET cliente_id = 'bca722ec-3cad-4eb5-9ce1-167d1013df4e' 
WHERE cliente_id = '0a90d9be-08b5-4882-9f92-0067503e4e60' 
AND evo_instance = 'teste2';

-- teste (segundo) → Rodrigo  
UPDATE cliente_config 
SET cliente_id = 'c9ce492b-8a79-41e1-8b1c-8b2146a2b53f' 
WHERE cliente_id = '151c880d-0c84-4073-a33d-bcc5b38b9902' 
AND evo_instance = 'teste';

-- Verificar resultado
SELECT 
    cc.cliente_id,
    dc.nome,
    cc.evo_instance,
    cc.base_leads,
    CASE 
        WHEN cc.cliente_id = dc.cliente_id THEN '✅ MATCH'
        ELSE '❌ NO MATCH'
    END as status
FROM cliente_config cc
JOIN dados_cliente dc ON cc.cliente_id = dc.cliente_id;
