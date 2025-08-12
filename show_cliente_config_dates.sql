-- Ver dados de cliente_config com datas para mapear corretamente
SELECT 
    'CLIENTE_CONFIG' as tabela,
    cliente_id,
    evo_instance,
    created_at
FROM cliente_config
ORDER BY created_at;
