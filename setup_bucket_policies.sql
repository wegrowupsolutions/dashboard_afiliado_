-- Configuração de políticas de segurança para buckets de usuário
-- Este arquivo deve ser executado no Supabase SQL Editor

-- 1. Criar função para gerar nomes de bucket baseados no email
CREATE OR REPLACE FUNCTION generate_user_bucket_name(user_email TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Transformar email no padrão: user-email-formato
  RETURN 'user-' || LOWER(REPLACE(REPLACE(user_email, '@', '-'), '.', '-'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Política para permitir que usuários acessem apenas seus próprios buckets
-- Esta política deve ser aplicada em cada bucket criado

-- Exemplo de política para um bucket específico (substitua 'bucket-name' pelo nome real):
-- CREATE POLICY "Users can access their own bucket" ON storage.objects
--   FOR ALL USING (
--     bucket_id = 'bucket-name' AND 
--     auth.uid()::text = (
--       SELECT id::text FROM auth.users WHERE email = (
--         SELECT email FROM dados_cliente WHERE bucket_name = 'bucket-name'
--       )
--     )
--   );

-- 3. Função para criar bucket e configurar políticas automaticamente
CREATE OR REPLACE FUNCTION setup_user_bucket(user_id UUID, user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  bucket_name TEXT;
  bucket_id TEXT;
BEGIN
  -- Gerar nome do bucket
  bucket_name := generate_user_bucket_name(user_email);
  
  -- Criar bucket se não existir (isso deve ser feito via API do Supabase)
  -- Aqui apenas retornamos o nome sugerido
  
  -- Atualizar dados_cliente com o nome do bucket
  UPDATE dados_cliente 
  SET bucket_name = bucket_name 
  WHERE id = user_id;
  
  RETURN bucket_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Comentários sobre como configurar as políticas manualmente:
/*
Para configurar as políticas de segurança de um bucket:

1. No Supabase Dashboard, vá para Storage > Policies
2. Selecione o bucket do usuário
3. Adicione as seguintes políticas:

POLÍTICA DE LEITURA:
- Nome: "Users can read their own files"
- Operation: SELECT
- Target roles: authenticated
- Using expression: bucket_id = 'nome-do-bucket' AND auth.uid()::text = (
  SELECT id::text FROM auth.users WHERE email = (
    SELECT email FROM dados_cliente WHERE bucket_name = 'nome-do-bucket'
  )
)

POLÍTICA DE ESCRITA:
- Nome: "Users can upload to their own bucket"
- Operation: INSERT
- Target roles: authenticated
- Using expression: bucket_id = 'nome-do-bucket' AND auth.uid()::text = (
  SELECT id::text FROM auth.users WHERE email = (
    SELECT email FROM dados_cliente WHERE bucket_name = 'nome-do-bucket'
  )
)

POLÍTICA DE DELEÇÃO:
- Nome: "Users can delete their own files"
- Operation: DELETE
- Target roles: authenticated
- Using expression: bucket_id = 'nome-do-bucket' AND auth.uid()::text = (
  SELECT id::text FROM auth.users WHERE email = (
    SELECT email FROM dados_cliente WHERE bucket_name = 'nome-do-bucket'
  )
)

POLÍTICA DE ATUALIZAÇÃO:
- Nome: "Users can update their own files"
- Operation: UPDATE
- Target roles: authenticated
- Using expression: bucket_id = 'nome-do-bucket' AND auth.uid()::text = (
  SELECT id::text FROM auth.users WHERE email = (
    SELECT email FROM dados_cliente WHERE bucket_name = 'nome-do-bucket'
  )
)
*/

-- 5. Verificar buckets existentes
SELECT 
  bucket_name,
  email,
  id
FROM dados_cliente 
WHERE bucket_name IS NOT NULL;
