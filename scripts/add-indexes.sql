-- ============================================
-- SOARES HUB CRM - Índices Compostos para Performance
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Índices compostos para queries comuns na tabela leads
CREATE INDEX IF NOT EXISTS idx_leads_org_stage ON leads(organization_id, stage);
CREATE INDEX IF NOT EXISTS idx_leads_org_temp ON leads(organization_id, temperature);
CREATE INDEX IF NOT EXISTS idx_leads_org_stage_temp ON leads(organization_id, stage, temperature);
CREATE INDEX IF NOT EXISTS idx_leads_contact_org ON leads(contact_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_org ON leads(assigned_to_id, organization_id) WHERE assigned_to_id IS NOT NULL;

-- Índices para conversations
CREATE INDEX IF NOT EXISTS idx_conversations_contact_org ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_org ON conversations(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_status_org ON conversations(status);

-- Índices para messages com join
CREATE INDEX IF NOT EXISTS idx_messages_conv_timestamp ON messages(conversation_id, timestamp DESC);

-- Índice para contacts por organização e source
CREATE INDEX IF NOT EXISTS idx_contacts_org_source ON contacts(organization_id, source);

-- Índice para handovers pendentes
CREATE INDEX IF NOT EXISTS idx_handovers_conv_status ON handovers(conversation_id, status);

-- Índice para sequence_enrollments ativos
CREATE INDEX IF NOT EXISTS idx_enrollments_seq_status ON sequence_enrollments(sequence_id, status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_enrollments_next_run ON sequence_enrollments(next_run_at) WHERE status = 'ACTIVE';

-- Estatísticas das tabelas para o query planner
ANALYZE leads;
ANALYZE contacts;
ANALYZE conversations;
ANALYZE messages;
ANALYZE handovers;
ANALYZE sequence_enrollments;

SELECT 'Índices criados com sucesso! ✅' as status;
