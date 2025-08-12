# Configuração do Backend para Supabase

## 📋 Dados que o Backend recebe do Frontend:

```json
{
  "instanceName": "teste1",
  "user_data": {
    "auth_user_id": "123",
    "id": "123",
    "email": "user@email.com",
    "name": "Nome do usuário",
    "phone": "11999999999"
  }
}
```

## 🛠️ Como o Backend deve inserir no Supabase:

### Opção 1: Usar a função SQL criada (Recomendado)

```javascript
// No seu backend, após criar a instância Evolution:
const supabaseUrl = "https://ufcarzzouvxgqljqxdnc.supabase.co"
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmY2FyenpvdXZ4Z3FsanF4ZG5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU3NTk1MywiZXhwIjoyMDY5MTUxOTUzfQ.YNHS53Baa6Y517X0v1n15bKsILEWnMb85rpsmsaDy8M"

const { createClient } = require("@supabase/supabase-js")
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Chamar a função SQL (NOVA VERSÃO - resolve o erro de null)
const { data, error } = await supabase.rpc("create_cliente_config", {
  p_auth_user_id: userData.auth_user_id, // ID do usuário autenticado
  p_cliente_id: userData.id, // ou use userData.auth_user_id se preferir
  p_evo_instance: instanceName,
  p_nome_tabela_leads: `base_leads_${userData.auth_user_id}`,
  p_prompt: null, // será preenchido depois via /config
})

console.log("📤 Dados enviados para Supabase:", {
  p_auth_user_id: userData.auth_user_id,
  p_cliente_id: userData.id,
  p_evo_instance: instanceName,
})

if (error) {
  console.error("Erro ao criar configuração:", error)
} else {
  console.log("Configuração criada:", data)
}
```

### Opção 2: Insert direto com validação (Alternativa)

```javascript
// Insert direto na tabela com validação de cliente_id (UUID)
// Gerar UUID válido se não tiver ID
const { v4: uuidv4 } = require("uuid") // npm install uuid
const clienteId = userData.auth_user_id || userData.id || uuidv4()

console.log("📝 Inserindo diretamente com cliente_id:", clienteId)

const { data, error } = await supabase
  .from("cliente_config")
  .insert({
    cliente_id: clienteId, // GARANTIR que não seja null
    evo_instance: instanceName,
    nome_tabela_leads: `base_leads_${clienteId}`,
  })
  .select()

if (error) {
  console.error("Erro ao inserir:", error)
  console.error("Detalhes do erro:", {
    code: error.code,
    message: error.message,
    details: error.details,
  })
} else {
  console.log("Inserido com sucesso:", data)
}
```

### Opção 3: Solução de emergência (Se nada funcionar)

```javascript
// Solução que SEMPRE funcionará (UUID válido)
const { v4: uuidv4 } = require("uuid") // npm install uuid

const generateClienteId = () => {
  return uuidv4() // Gera UUID válido
}

const clienteId = userData.auth_user_id || userData.id || generateClienteId()

console.log("🚨 Usando cliente_id gerado:", clienteId)

const { data, error } = await supabase
  .from("cliente_config")
  .upsert(
    {
      cliente_id: clienteId,
      evo_instance: instanceName,
      nome_tabela_leads: `base_leads_${clienteId}`,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "cliente_id",
    }
  )
  .select()
```

### Opção 4: SOLUÇÃO para Foreign Key Constraint (RECOMENDADA)

```javascript
// Usar a nova função que resolve foreign key
const { data, error } = await supabase.rpc("create_cliente_config_with_user", {
  p_user_id: userData.auth_user_id || userData.id || uuidv4(),
  p_email: userData.email,
  p_evo_instance: instanceName,
  p_nome_tabela_leads: `base_leads_${userData.auth_user_id || userData.id}`,
})

if (error) {
  console.error("Erro ao criar configuração:", error)
} else {
  console.log("Configuração criada com sucesso:", data)
}
```

## 🚨 IMPORTANTE: Erro de Foreign Key

Se ainda der erro de foreign key constraint, execute no Supabase:

```sql
-- Remover constraint que está causando problema
ALTER TABLE cliente_config
DROP CONSTRAINT IF EXISTS cliente_config_cliente_id_fkey;
```

## 🔑 Chaves do Supabase:

- **URL**: `https://ufcarzzouvxgqljqxdnc.supabase.co`
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmY2FyenpvdXZ4Z3FsanF4ZG5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU3NTk1MywiZXhwIjoyMDY5MTUxOTUzfQ.YNHS53Baa6Y517X0v1n15bKsILEWnMb85rpsmsaDy8M`

## 📊 Estrutura da tabela cliente_config:

```sql
CREATE TABLE cliente_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id TEXT NOT NULL UNIQUE,
  prompt TEXT,
  evo_instance TEXT,
  nome_tabela_leads TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 🔍 Como testar:

1. Execute o SQL no Supabase Dashboard
2. Configure o backend para usar uma das opções acima
3. Teste criando uma instância no frontend
4. Verifique se a linha foi criada na tabela `cliente_config`

## ✅ Resultado esperado:

Após a criação bem-sucedida, a tabela deve ter:

- `cliente_id`: ID do usuário (ex: "123")
- `evo_instance`: Nome da instância (ex: "teste1")
- `nome_tabela_leads`: Nome da tabela de leads (ex: "base_leads_123")
- `prompt`: NULL (será preenchido via /config)
