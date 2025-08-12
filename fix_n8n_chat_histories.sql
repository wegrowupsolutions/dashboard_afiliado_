-- CORRIGIR TABELA n8n_chat_histories - ADICIONAR CAMPOS FALTANTES

-- 1. Adicionar campos que o código está tentando usar
ALTER TABLE n8n_chat_histories 
ADD COLUMN IF NOT EXISTS data TEXT,
ADD COLUMN IF NOT EXISTS hora TEXT;

-- 2. Verificar estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'n8n_chat_histories' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar dados existentes
SELECT 
    id,
    session_id,
    CASE 
        WHEN message IS NOT NULL THEN 'HAS_MESSAGE'
        ELSE 'NULL_MESSAGE'
    END as message_status,
    data,
    hora,
    length(message::text) as message_length
FROM n8n_chat_histories 
ORDER BY id DESC 
LIMIT 5;
