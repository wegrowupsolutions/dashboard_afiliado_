-- ATUALIZAR SISTEMA DE BUCKETS PARA USAR NOMENCLATURA BASEADA EM EMAIL

-- 1. Função para criar nome do bucket baseado no email
CREATE OR REPLACE FUNCTION create_email_based_bucket_name(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    bucket_name TEXT;
    sanitized_email TEXT;
BEGIN
    -- Sanitizar o email: @ vira -, . vira -, remover outros caracteres especiais
    sanitized_email := LOWER(REGEXP_REPLACE(user_email, '[@.]', '-', 'g'));
    sanitized_email := REGEXP_REPLACE(sanitized_email, '[^a-zA-Z0-9\-]', '', 'g');
    
    -- Criar o nome do bucket no padrão: user-email-formato
    bucket_name := 'user-' || sanitized_email;
    
    -- Limitar tamanho se necessário
    bucket_name := LEFT(bucket_name, 63); -- Limite do S3/Supabase
    
    RETURN bucket_name;
END;
$$ LANGUAGE plpgsql;

-- 2. Atualizar função para verificar se bucket existe (sem criar novos)
CREATE OR REPLACE FUNCTION get_existing_user_bucket(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
    bucket_name TEXT;
BEGIN
    bucket_name := create_email_based_bucket_name(user_email);
    
    -- Verificar se o bucket existe
    IF EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = bucket_name
    ) THEN
        RAISE NOTICE 'Bucket encontrado: %', bucket_name;
        RETURN bucket_name;
    ELSE
        RAISE NOTICE 'Bucket não encontrado: %', bucket_name;
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Atualizar trigger para usar email em vez de nome
CREATE OR REPLACE FUNCTION create_bucket_on_config_insert()
RETURNS TRIGGER AS $$
DECLARE
    cliente_email TEXT;
    bucket_name TEXT;
BEGIN
    -- Buscar o email do cliente
    SELECT email INTO cliente_email
    FROM dados_cliente 
    WHERE cliente_id = NEW.cliente_id;
    
    -- Se encontrou o cliente, buscar o bucket existente
    IF cliente_email IS NOT NULL THEN
        bucket_name := get_existing_user_bucket(cliente_email);
        NEW.bucket_name := bucket_name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Preencher bucket_name para registros existentes baseado no email
DO $$
DECLARE
    rec RECORD;
    bucket_name TEXT;
BEGIN
    FOR rec IN 
        SELECT cc.cliente_id, dc.email, dc.nome
        FROM cliente_config cc
        JOIN dados_cliente dc ON cc.cliente_id = dc.cliente_id
        WHERE cc.bucket_name IS NULL
    LOOP
        bucket_name := get_existing_user_bucket(rec.email);
        
        UPDATE cliente_config 
        SET bucket_name = bucket_name 
        WHERE cliente_id = rec.cliente_id;
        
        RAISE NOTICE 'Bucket atualizado para % (%): %', rec.nome, rec.email, bucket_name;
    END LOOP;
END $$;

-- 5. Verificar resultado final
SELECT 
    cc.cliente_id,
    dc.nome as cliente_nome,
    dc.email as cliente_email,
    cc.bucket_name,
    CASE 
        WHEN cc.bucket_name IS NOT NULL THEN '✅ VINCULADO'
        ELSE '❌ SEM BUCKET'
    END as status
FROM cliente_config cc
JOIN dados_cliente dc ON cc.cliente_id = dc.cliente_id
ORDER BY dc.nome;

-- 6. Mostrar buckets existentes no storage
SELECT 
    name as bucket_name,
    public,
    file_size_limit,
    created_at
FROM storage.buckets 
WHERE name LIKE 'user-%'
ORDER BY created_at;
