-- CORREÇÃO RÁPIDA: Atualizar registros existentes com base_leads NULL

-- Passo 1: Atualizar campo base_leads para registros existentes
UPDATE cliente_config 
SET base_leads = (
    SELECT LOWER(REGEXP_REPLACE(dc.nome, '[^a-zA-Z0-9]', '_', 'g')) || '_base_leads'
    FROM dados_cliente dc 
    WHERE dc.cliente_id = cliente_config.cliente_id
)
WHERE base_leads IS NULL;

-- Passo 2: Criar as tabelas que faltam
DO $$
DECLARE
    rec RECORD;
    table_name TEXT;
    sanitized_name TEXT;
BEGIN
    FOR rec IN 
        SELECT cc.cliente_id, cc.base_leads, dc.nome
        FROM cliente_config cc
        JOIN dados_cliente dc ON cc.cliente_id = dc.cliente_id
        WHERE cc.base_leads IS NOT NULL
    LOOP
        -- Criar a tabela se não existir
        EXECUTE format('
            CREATE TABLE IF NOT EXISTS %I (
                id SERIAL PRIMARY KEY,
                remotejid TEXT,
                nome TEXT,
                timestamp TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )', rec.base_leads);
        
        RAISE NOTICE 'Tabela verificada/criada: %', rec.base_leads;
    END LOOP;
END $$;

-- Passo 3: Verificar resultado
SELECT 
    cc.cliente_id,
    dc.nome as cliente_nome,
    cc.base_leads
FROM cliente_config cc
JOIN dados_cliente dc ON cc.cliente_id = dc.cliente_id;
