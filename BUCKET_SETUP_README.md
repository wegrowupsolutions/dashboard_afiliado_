# 🗂️ Configuração do Sistema de Buckets por Usuário

## 📋 Visão Geral

Este sistema permite que cada usuário tenha seu próprio bucket no Supabase Storage para armazenar:
- 📄 Documentos (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT)
- 🖼️ Imagens (JPG, PNG, GIF, etc.)
- 🎥 Vídeos (MP4, AVI, MOV, etc.)
- 🎵 Áudios (MP3, WAV, AAC, etc.)

## 🚀 Como Funciona

### 1. **Criação Automática de Buckets**
- Quando um usuário tenta fazer upload pela primeira vez, o sistema:
  - Gera um nome único para o bucket baseado no email
  - Cria automaticamente o bucket no Supabase Storage
  - Salva o nome do bucket na tabela `dados_cliente`

### 2. **Nomenclatura dos Buckets**
- Formato: `user-{email-sanitizado}`
- Exemplo: `user-john-doe-example-com`
- O email é sanitizado removendo caracteres especiais

### 3. **Segurança**
- Cada usuário só pode acessar seu próprio bucket
- Buckets são privados por padrão
- Políticas RLS (Row Level Security) controlam o acesso

## ⚙️ Configuração Necessária

### Passo 1: Executar SQL de Configuração
Execute o arquivo `setup_bucket_policies.sql` no Supabase SQL Editor:

```sql
-- Executar no Supabase SQL Editor
\i setup_bucket_policies.sql
```

### Passo 2: Configurar Políticas de Storage
Para cada bucket criado, configure as seguintes políticas no Supabase Dashboard:

#### A. Acessar Storage > Policies
#### B. Selecionar o bucket do usuário
#### C. Adicionar as políticas:

**Política de Leitura:**
- Nome: `Users can read their own files`
- Operation: `SELECT`
- Target roles: `authenticated`
- Using expression:
```sql
bucket_id = 'nome-do-bucket' AND auth.uid()::text = (
  SELECT id::text FROM auth.users WHERE email = (
    SELECT email FROM dados_cliente WHERE bucket_name = 'nome-do-bucket'
  )
)
```

**Política de Escrita:**
- Nome: `Users can upload to their own bucket`
- Operation: `INSERT`
- Target roles: `authenticated`
- Using expression: (mesma da leitura)

**Política de Deleção:**
- Nome: `Users can delete their own files`
- Operation: `DELETE`
- Target roles: `authenticated`
- Using expression: (mesma da leitura)

**Política de Atualização:**
- Nome: `Users can update their own files`
- Operation: `UPDATE`
- Target roles: `authenticated`
- Using expression: (mesma da leitura)

## 🔧 Configurações do Bucket

### Limites Configurados:
- **Tamanho máximo por arquivo**: 50MB
- **Tipos de arquivo permitidos**: Todos os tipos comuns de documento, imagem, vídeo e áudio
- **Visibilidade**: Privado (não público)

### Estrutura do Bucket:
```
user-email-bucket/
├── documento.pdf
├── imagem.jpg
├── video.mp4
├── audio.mp3
└── planilha.xlsx
```

## 📊 Monitoramento

### Verificar Buckets Existentes:
```sql
SELECT 
  bucket_name,
  email,
  id,
  created_at
FROM dados_cliente 
WHERE bucket_name IS NOT NULL
ORDER BY created_at DESC;
```

### Verificar Uso de Storage:
```sql
-- Esta query pode ser executada para ver o uso de cada bucket
-- (Implementar conforme necessário)
```

## 🚨 Solução de Problemas

### Erro: "Bucket not found"
**Causa**: Bucket não foi criado automaticamente
**Solução**: 
1. Verificar se o usuário está autenticado
2. Verificar logs do console para erros de criação
3. Executar manualmente a criação do bucket

### Erro: "Access denied"
**Causa**: Políticas de segurança não configuradas
**Solução**: 
1. Verificar se as políticas RLS estão ativas
2. Configurar as políticas conforme o Passo 2
3. Verificar se o usuário está autenticado

### Erro: "File size limit exceeded"
**Causa**: Arquivo maior que 50MB
**Solução**: 
1. Comprimir o arquivo
2. Dividir em partes menores
3. Ajustar o limite no código se necessário

## 🔄 Atualizações Automáticas

O sistema agora:
- ✅ Cria buckets automaticamente
- ✅ Configura limites de arquivo
- ✅ Salva nomes de bucket na tabela
- ✅ Verifica existência antes de operações
- ✅ Trata erros graciosamente

## 📝 Notas Importantes

1. **Primeiro Upload**: Pode ser mais lento pois cria o bucket
2. **Segurança**: Buckets são privados por padrão
3. **Backup**: Considere implementar backup automático dos buckets
4. **Limpeza**: Implemente limpeza automática de arquivos antigos se necessário

## 🆘 Suporte

Se encontrar problemas:
1. Verificar logs do console do navegador
2. Verificar logs do Supabase
3. Executar queries de diagnóstico
4. Verificar configuração das políticas RLS
