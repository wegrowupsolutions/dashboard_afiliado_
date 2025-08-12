-- TRIGGER: Criação automática de tabela de leads por usuário
-- Executa quando uma nova row é criada em cliente_config

-- Função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION create_user_leads_table()
RETURNS TRIGGER AS $$
DECLARE
    cliente_nome TEXT;
    table_name TEXT;
    sanitized_name TEXT;
BEGIN
    -- Buscar o nome do cliente na tabela dados_cliente
    SELECT nome INTO cliente_nome
    FROM dados_cliente 
    WHERE cliente_id = NEW.cliente_id;
    
    -- Se não encontrou o cliente, usar o cliente_id como fallback
    IF cliente_nome IS NULL THEN
        cliente_nome := NEW.cliente_id;
    END IF;
    
    -- Sanitizar o nome (remover espaços, caracteres especiais, converter para lowercase)
    sanitized_name := LOWER(REGEXP_REPLACE(cliente_nome, '[^a-zA-Z0-9]', '_', 'g'));
    
    -- Limitar o tamanho do nome (PostgreSQL tem limite de 63 caracteres para nomes de tabela)
    sanitized_name := LEFT(sanitized_name, 40);
    
    -- Criar o nome da tabela
    table_name := sanitized_name || '_base_leads';
    
    -- Criar a tabela dinamicamente
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id SERIAL PRIMARY KEY,
            remotejid TEXT,
            nome TEXT,
            timestamp TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )', table_name);
    
    -- Atualizar o campo base_leads na row que está sendo inserida
    NEW.base_leads := table_name;
    
    -- Log da operação
    RAISE NOTICE 'Tabela de leads criada: %', table_name;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger que chama a função
DROP TRIGGER IF EXISTS trigger_create_user_leads_table ON cliente_config;

CREATE TRIGGER trigger_create_user_leads_table
    BEFORE INSERT ON cliente_config
    FOR EACH ROW
    EXECUTE FUNCTION create_user_leads_table();

-- Comentário explicativo
COMMENT ON FUNCTION create_user_leads_table() IS 
'Função que cria automaticamente uma tabela de leads específica para cada usuário quando uma nova configuração é criada';

COMMENT ON TRIGGER trigger_create_user_leads_table ON cliente_config IS 
'Trigger que executa a criação automática da tabela de leads quando um novo cliente_config é inserido';
