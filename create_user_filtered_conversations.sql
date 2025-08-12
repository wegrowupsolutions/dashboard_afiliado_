-- CRIAR FUNÇÃO SQL PARA BUSCAR CONVERSAS FILTRADAS POR USUÁRIO

-- 1. Função para buscar sessionids relacionados ao evo_instance do usuário
CREATE OR REPLACE FUNCTION get_user_sessionids(user_cliente_id TEXT)
RETURNS TABLE(session_id TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT dc.sessionid::TEXT
    FROM dados_cliente dc
    JOIN cliente_config cc ON cc.cliente_id = user_cliente_id
    WHERE dc.sessionid IS NOT NULL 
      AND dc.sessionid != ''
      -- Aqui podemos adicionar filtros adicionais baseados no evo_instance se necessário
      -- Por exemplo: AND dc.some_field = cc.evo_instance
    ;
END;
$$ LANGUAGE plpgsql;

-- 2. Função para buscar conversas de um usuário específico
CREATE OR REPLACE FUNCTION get_user_conversations(user_cliente_id TEXT)
RETURNS TABLE(
    session_id TEXT,
    cliente_nome TEXT,
    cliente_email TEXT,
    cliente_telefone TEXT,
    last_message_id INTEGER,
    conversation_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dc.sessionid::TEXT as session_id,
        dc.nome as cliente_nome,
        dc.email as cliente_email,
        dc.telefone as cliente_telefone,
        (
            SELECT nch.id 
            FROM n8n_chat_histories nch 
            WHERE nch.session_id = dc.sessionid 
            ORDER BY nch.id DESC 
            LIMIT 1
        ) as last_message_id,
        (
            SELECT COUNT(*) 
            FROM n8n_chat_histories nch 
            WHERE nch.session_id = dc.sessionid
        ) as conversation_count
    FROM dados_cliente dc
    JOIN cliente_config cc ON cc.cliente_id = user_cliente_id
    WHERE dc.sessionid IS NOT NULL 
      AND dc.sessionid != ''
      AND dc.telefone IS NOT NULL
    ORDER BY last_message_id DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- 3. Função para buscar mensagens de uma conversa específica (com validação de usuário)
CREATE OR REPLACE FUNCTION get_user_chat_messages(
    user_cliente_id TEXT, 
    target_session_id TEXT
)
RETURNS TABLE(
    id INTEGER,
    session_id TEXT,
    message JSON,
    data TEXT,
    hora TEXT
) AS $$
BEGIN
    -- Verificar se o usuário tem acesso a essa conversa
    IF NOT EXISTS (
        SELECT 1 
        FROM dados_cliente dc
        JOIN cliente_config cc ON cc.cliente_id = user_cliente_id
        WHERE dc.sessionid = target_session_id
    ) THEN
        RAISE EXCEPTION 'Usuário não tem acesso a esta conversa';
    END IF;
    
    RETURN QUERY
    SELECT 
        nch.id,
        nch.session_id::TEXT,
        nch.message,
        nch.data,
        nch.hora
    FROM n8n_chat_histories nch
    WHERE nch.session_id = target_session_id
    ORDER BY nch.id ASC;
END;
$$ LANGUAGE plpgsql;

-- 4. Testar as funções (substituir 'SEU_CLIENTE_ID' pelo cliente_id real)
-- SELECT * FROM get_user_conversations('bca722ec-3cad-4eb5-9ce1-167d1013df4e');
-- SELECT * FROM get_user_sessionids('bca722ec-3cad-4eb5-9ce1-167d1013df4e');
