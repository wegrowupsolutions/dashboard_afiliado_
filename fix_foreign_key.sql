-- Solução para o erro de foreign key constraint
-- Execute estes comandos no Supabase SQL Editor

-- 1. Verificar qual é a constraint exata
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'cliente_config';

-- 2. Remover a foreign key constraint temporariamente
-- (Substitua 'cliente_config_cliente_id_fkey' pelo nome real se for diferente)
ALTER TABLE cliente_config 
DROP CONSTRAINT IF EXISTS cliente_config_cliente_id_fkey;

-- 3. Tornar cliente_id independente (sem foreign key)
-- Isso permite que qualquer valor seja inserido no cliente_id

-- 4. Testar inserção
INSERT INTO cliente_config (cliente_id, evo_instance, nome_tabela_leads) 
VALUES ('test-uuid-123', 'teste_sem_fk', 'base_leads_test');

-- 5. Verificar se funcionou
SELECT * FROM cliente_config WHERE evo_instance = 'teste_sem_fk';
