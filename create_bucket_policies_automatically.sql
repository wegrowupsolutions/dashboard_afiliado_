-- Script para criar políticas de segurança automaticamente para buckets de usuário
-- Execute este script no Supabase SQL Editor após criar um bucket

-- Função para criar políticas de segurança para um bucket específico
CREATE OR REPLACE FUNCTION create_user_bucket_policies(bucket_name TEXT)
RETURNS VOID AS $$
BEGIN
  -- Política de LEITURA (SELECT) - Usuário pode ler apenas seus arquivos
  EXECUTE format('
    CREATE POLICY "Users can read their own files_%s" ON storage.objects
    FOR SELECT USING (
      bucket_id = %L AND 
      auth.uid()::text = (
        SELECT id::text FROM dados_cliente 
        WHERE bucket_name = %L
      )
    )
  ', bucket_name, bucket_name, bucket_name);
  
  -- Política de ESCRITA (INSERT) - Usuário pode fazer upload apenas no seu bucket
  EXECUTE format('
    CREATE POLICY "Users can upload to their own bucket_%s" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = %L AND 
      auth.uid()::text = (
        SELECT id::text FROM dados_cliente 
        WHERE bucket_name = %L
      )
    )
  ', bucket_name, bucket_name, bucket_name);
  
  -- Política de ATUALIZAÇÃO (UPDATE) - Usuário pode atualizar apenas seus arquivos
  EXECUTE format('
    CREATE POLICY "Users can update their own files_%s" ON storage.objects
    FOR UPDATE USING (
      bucket_id = %L AND 
      auth.uid()::text = (
        SELECT id::text FROM dados_cliente 
        WHERE bucket_name = %L
      )
    )
  ', bucket_name, bucket_name, bucket_name);
  
  -- Política de DELEÇÃO (DELETE) - Usuário pode deletar apenas seus arquivos
  EXECUTE format('
    CREATE POLICY "Users can delete their own files_%s" ON storage.objects
    FOR DELETE USING (
      bucket_id = %L AND 
      auth.uid()::text = (
        SELECT id::text FROM dados_cliente 
        WHERE bucket_name = %L
      )
    )
  ', bucket_name, bucket_name, bucket_name);
  
  -- Política para n8n (Acesso total via service_role)
  EXECUTE format('
    CREATE POLICY "n8n full access_%s" ON storage.objects
    FOR ALL USING (
      bucket_id = %L
    ) WITH CHECK (
      bucket_id = %L
    )
  ', bucket_name, bucket_name, bucket_name);
  
  RAISE NOTICE 'Políticas criadas com sucesso para o bucket: %', bucket_name;
  
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Políticas já existem para o bucket: %', bucket_name;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar políticas para bucket %: %', bucket_name, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar políticas para todos os buckets existentes
CREATE OR REPLACE FUNCTION create_policies_for_all_buckets()
RETURNS VOID AS $$
DECLARE
  bucket_record RECORD;
BEGIN
  -- Buscar todos os buckets que têm bucket_name na tabela dados_cliente
  FOR bucket_record IN 
    SELECT DISTINCT bucket_name 
    FROM dados_cliente 
    WHERE bucket_name IS NOT NULL
  LOOP
    BEGIN
      PERFORM create_user_bucket_policies(bucket_record.bucket_name);
      RAISE NOTICE 'Políticas criadas para bucket: %', bucket_record.bucket_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao criar políticas para bucket %: %', bucket_record.bucket_name, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Processo de criação de políticas concluído!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar políticas para um bucket específico (uso manual)
CREATE OR REPLACE FUNCTION setup_bucket_security(bucket_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Verificar se o bucket existe
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = bucket_name
  ) THEN
    RETURN format('Bucket %s não encontrado no storage', bucket_name);
  END IF;
  
  -- Criar políticas
  PERFORM create_user_bucket_policies(bucket_name);
  
  RETURN format('Políticas de segurança criadas com sucesso para o bucket %s', bucket_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários de uso:
/*
USO MANUAL:
1. Para criar políticas para um bucket específico:
   SELECT setup_bucket_security('nome-do-bucket');

2. Para criar políticas para todos os buckets existentes:
   SELECT create_policies_for_all_buckets();

3. Para criar políticas para um novo bucket:
   SELECT create_user_bucket_policies('nome-do-novo-bucket');

EXEMPLOS:
-- Para o bucket que você já tem:
SELECT setup_bucket_security('user-viniciushtx-hotmail-com');

-- Para o outro bucket:
SELECT setup_bucket_security('user-rfreitasdc-gmail-com');

-- Para criar políticas para todos os buckets de uma vez:
SELECT create_policies_for_all_buckets();
*/
