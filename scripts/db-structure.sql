-- ============================================
-- SOARES HUB CRM - Script de Estrutura do Banco
-- Execute no SQL Editor do Supabase
-- ============================================

-- ============================================
-- LISTA TODAS AS COLUNAS DE TODAS AS TABELAS
-- ============================================

SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY'
        ELSE NULL
    END AS key_type,
    c.character_maximum_length
FROM information_schema.columns c
JOIN information_schema.tables t ON c.table_name = t.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE 'sql_%'
ORDER BY t.table_name, c.ordinal_position;

-- ============================================
-- LISTA TODOS OS RELACIONAMENTOS (FK)
-- ============================================

SELECT
    tc.table_name AS tabela_origem,
    kcu.column_name AS coluna_origem,
    ccu.table_name AS tabela_destino,
    ccu.column_name AS coluna_destino,
    rc.delete_rule AS on_delete
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';

-- ============================================
-- LISTA TODAS AS CHAVES PRIMÁRIAS
-- ============================================

SELECT
    tc.table_name,
    kcu.column_name AS primary_key,
    c.data_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.columns c 
    ON c.table_name = tc.table_name 
    AND c.column_name = kcu.column_name
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public';

-- ============================================
-- LISTA TODOS OS ÍNDICES
-- ============================================

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- LISTA TODAS AS CONSTRAINTS UNIQUE
-- ============================================

SELECT
    tc.table_name,
    kcu.column_name AS unique_column,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public';

-- ============================================
-- RESUMO COMPLETO (UNA VIEW ÚTIL)
-- ============================================

-- Cria uma view para consultas rápidas
CREATE OR REPLACE VIEW vw_estrutura_banco AS
SELECT 
    'Tabela' AS tipo,
    t.table_name AS nome,
    c.column_name AS coluna,
    c.data_type AS tipo_dado,
    CASE WHEN c.is_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END AS nulagem,
    COALESCE(c.column_default, '-') AS padrao,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PK'
        WHEN fk.column_name IS NOT NULL THEN 'FK'
        WHEN u.column_name IS NOT NULL THEN 'UNIQUE'
        ELSE '-'
    END AS chave
FROM information_schema.columns c
JOIN information_schema.tables t ON c.table_name = t.table_name
LEFT JOIN (
    SELECT kcu.table_name, kcu.column_name
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc 
        ON kcu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
LEFT JOIN (
    SELECT kcu.table_name, kcu.column_name
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc 
        ON kcu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'UNIQUE'
) u ON c.table_name = u.table_name AND c.column_name = u.column_name
LEFT JOIN (
    SELECT kcu.table_name, kcu.column_name
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.table_constraints tc 
        ON kcu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- Consulta a view
SELECT * FROM vw_estrutura_banco;

-- ============================================
-- QUANTIDADE DE REGISTROS POR TABELA
-- ============================================

SELECT 
    'contacts' AS tabela, COUNT(*) AS total FROM contacts
UNION ALL SELECT 'leads', COUNT(*) FROM leads
UNION ALL SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'handovers', COUNT(*) FROM handovers
UNION ALL SELECT 'campanhas', COUNT(*) FROM campanhas
UNION ALL SELECT 'sequences', COUNT(*) FROM sequences
UNION ALL SELECT 'sequence_steps', COUNT(*) FROM sequence_steps
UNION ALL SELECT 'sequence_enrollments', COUNT(*) FROM sequence_enrollments
UNION ALL SELECT 'scheduled_messages', COUNT(*) FROM scheduled_messages
UNION ALL SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL SELECT 'organizations', COUNT(*) FROM organizations
UNION ALL SELECT 'user_devices', COUNT(*) FROM user_devices;

-- ============================================
-- DIAGRAMA EM TEXTO DAS RELAÇÕES
-- ============================================

-- Organizations
--   ↓ 1:N profiles (organization_id)
--   ↓ 1:N contacts (organization_id)
--   ↓ 1:N leads (organization_id)
--   ↓ 1:N campanhas (organization_id)
--   ↓ 1:N sequences (organization_id)

-- Profiles
--   ↓ 1:N leads (assigned_to_id)
--   ↓ 1:N user_devices (user_id)

-- Contacts
--   ↓ 1:N leads (contact_id)
--   ↓ 1:N conversations (contact_id)
--   ↓ 1:N sequence_enrollments (contact_id)
--   ↓ 1:N scheduled_messages (contact_id)

-- Leads
--   ↓ 1:N conversations (lead_id)

-- Conversations
--   ↓ 1:N messages (conversation_id)
--   ↓ 1:N handovers (conversation_id)

-- Sequences
--   ↓ 1:N sequence_steps (sequence_id)
--   ↓ 1:N sequence_enrollments (sequence_id)

-- ============================================
-- FIM DO SCRIPT
-- ============================================