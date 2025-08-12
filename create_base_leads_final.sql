-- FINALIZAR: Preencher base_leads e criar tabelas

-- Passo 1: Atualizar campo base_leads
UPDATE cliente_config 
SET base_leads = (
    SELECT LOWER(REGEXP_REPLACE(dc.nome, '[^a-zA-Z0-9]', '_', 'g')) || '_base_leads'
    FROM dados_cliente dc 
    WHERE dc.cliente_id = cliente_config.cliente_id
)
WHERE base_leads IS NULL;

-- Passo 2: Criar as tabelas base_leads
-- Vinicius
CREATE TABLE IF NOT EXISTS vinicius_base_leads (
    id SERIAL PRIMARY KEY,
    remotejid TEXT,
    nome TEXT,
    timestamp TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Rodrigo
CREATE TABLE IF NOT EXISTS rodrigo_base_leads (
    id SERIAL PRIMARY KEY,
    remotejid TEXT,
    nome TEXT,
    timestamp TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Passo 3: Verificar resultado final
SELECT 
    cc.cliente_id,
    dc.nome,
    cc.evo_instance,
    cc.base_leads,
    '✅ COMPLETO' as status
FROM cliente_config cc
JOIN dados_cliente dc ON cc.cliente_id = dc.cliente_id;
