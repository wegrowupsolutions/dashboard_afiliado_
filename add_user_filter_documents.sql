-- ADICIONAR FILTRO POR USUÁRIO NA TABELA DOCUMENTS

-- 1. Adicionar campo cliente_id na tabela documents
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS cliente_id UUID;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_documents_cliente_id ON documents(cliente_id);

-- 3. Adicionar comentário explicativo
COMMENT ON COLUMN documents.cliente_id IS 
'ID do cliente que possui este documento - usado para filtrar documentos por usuário';

-- 4. Verificar estrutura atualizada
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;
