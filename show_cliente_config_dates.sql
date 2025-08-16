-- Ver dados de cliente_config com datas para mapear corretamente
SELECT 
    'dados_cliente' as tabela,
    cliente_id,
    evo_instance,
    created_at
FROM dados_cliente
ORDER BY created_at;
