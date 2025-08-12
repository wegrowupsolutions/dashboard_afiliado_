-- Verificar se o trigger existe
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'cliente_config';

-- Se não aparecer nenhum resultado, o trigger não existe e precisa ser criado novamente
