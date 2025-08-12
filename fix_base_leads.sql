-- DIAGNÓSTICO E CORREÇÃO DO CAMPO base_leads

-- 1. Verificar se o trigger existe
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'cliente_config';

-- 2. Verificar se a função existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'create_user_leads_table';

-- 3. Se o trigger não existir, executar novamente:
-- (Cole o conteúdo do arquivo create_leads_table_trigger.sql)

-- 4. CORREÇÃO MANUAL: Preencher base_leads para registros existentes
UPDATE cliente_config 
SET base_leads = (
    SELECT LOWER(REGEXP_REPLACE(dc.nome, '[^a-zA-Z0-9]', '_', 'g')) || '_base_leads'
    FROM dados_cliente dc 
    WHERE dc.cliente_id = cliente_config.cliente_id
)
WHERE base_leads IS NULL;

-- 5. Criar tabelas para registros existentes (executar linha por linha)
DO $$
DECLARE
    rec RECORD;
    cliente_nome TEXT;
    table_name TEXT;
    sanitized_name TEXT;
BEGIN
    FOR rec IN 
        SELECT cc.cliente_id, dc.nome
        FROM cliente_config cc
        JOIN dados_cliente dc ON cc.cliente_id = dc.cliente_id
        WHERE cc.base_leads IS NULL OR cc.base_leads = ''
    LOOP
        -- Sanitizar o nome
        sanitized_name := LOWER(REGEXP_REPLACE(rec.nome, '[^a-zA-Z0-9]', '_', 'g'));
        sanitized_name := LEFT(sanitized_name, 40);
        table_name := sanitized_name || '_base_leads';
        
        -- Criar a tabela
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I (
                id SERIAL PRIMARY KEY,
                remotejid TEXT,
                nome TEXT,
                timestamp TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )', table_name);
        
        -- Atualizar o campo base_leads
        UPDATE cliente_config 
        SET base_leads = table_name 
        WHERE cliente_id = rec.cliente_id;
        
        RAISE NOTICE 'Tabela criada e atualizada: %', table_name;
    END LOOP;
END $$;

-- 6. Verificar resultado final
SELECT 
    cc.cliente_id,
    dc.nome as cliente_nome,
    cc.base_leads,
    CASE 
        WHEN cc.base_leads IS NOT NULL THEN 'OK'
        ELSE 'PENDENTE'
    END as status
FROM cliente_config cc
JOIN dados_cliente dc ON cc.cliente_id = dc.cliente_id;
