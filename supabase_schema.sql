-- ============================================
-- SOARES HUB CRM - Supabase Schema
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TIPOS ENUM
-- ============================================

CREATE TYPE role_enum AS ENUM ('ADMIN', 'GERENTE', 'VENDEDOR', 'OPERADOR_IA');
CREATE TYPE lead_stage_enum AS ENUM ('NOVO', 'QUALIFICADO', 'PROPOSTA', 'NEGOCIACAO', 'GANHO', 'PERDIDO');
CREATE TYPE temperature_enum AS ENUM ('FRIO', 'MORNO', 'QUENTE');
CREATE TYPE conversation_status_enum AS ENUM ('ATIVA', 'AGUARDANDO_HUMANO', 'FECHADA');
CREATE TYPE handover_status_enum AS ENUM ('PENDENTE', 'ACEITO', 'CONCLUIDO');
CREATE TYPE channel_enum AS ENUM ('WHATSAPP', 'INSTAGRAM');

-- ============================================
-- TABELAS
-- ============================================

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  persona TEXT,
  logo TEXT,
  primary_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (estende a tabela auth.users do Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role role_enum DEFAULT 'VENDEDOR',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  phone_number TEXT UNIQUE,
  instagram_username TEXT UNIQUE,
  tags TEXT[],
  source TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stage lead_stage_enum DEFAULT 'NOVO',
  score INT DEFAULT 0,
  temperature temperature_enum DEFAULT 'FRIO',
  deal_value FLOAT,
  notes TEXT,
  funnel_stage TEXT,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  assigned_to_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status conversation_status_enum DEFAULT 'ATIVA',
  channel channel_enum NOT NULL,
  is_ai_active BOOLEAN DEFAULT TRUE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  active_agent TEXT,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  from_me BOOLEAN NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_ai_generated BOOLEAN DEFAULT FALSE,
  agent_key TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL
);

-- Handovers
CREATE TABLE IF NOT EXISTS handovers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reason TEXT NOT NULL,
  status handover_status_enum DEFAULT 'PENDENTE',
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  requested_by TEXT NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campanhas
CREATE TABLE IF NOT EXISTS campanhas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT DEFAULT '',
  channel TEXT DEFAULT 'WHATSAPP',
  segment JSONB,
  status TEXT DEFAULT 'RASCUNHO',
  ai_prompt TEXT,
  total_sent INT DEFAULT 0,
  total_delivered INT DEFAULT 0,
  total_replied INT DEFAULT 0,
  total_converted INT DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequences
CREATE TABLE IF NOT EXISTS sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  trigger TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequence Steps
CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "order" INT NOT NULL,
  delay_minutes INT NOT NULL,
  message_template TEXT,
  channel TEXT DEFAULT 'WHATSAPP',
  use_ai BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,
  sequence_id UUID REFERENCES sequences(id) ON DELETE CASCADE NOT NULL
);

-- Sequence Enrollments
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sequence_id UUID REFERENCES sequences(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  current_step INT DEFAULT 1,
  status TEXT DEFAULT 'ACTIVE',
  next_run_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Messages
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  channel TEXT DEFAULT 'WHATSAPP',
  status TEXT DEFAULT 'PENDING',
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Devices (para push notifications)
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_temp ON leads(temperature);
CREATE INDEX IF NOT EXISTS idx_leads_contact ON leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS - PROFILES
-- ============================================

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Usuários na mesma organização podem ver perfis da organização (ADMIN/GERENTE)
CREATE POLICY "Org members can view profiles" ON profiles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GERENTE')
    )
  );

-- ============================================
-- POLÍTICAS RLS - CONTACTS
-- ============================================

CREATE POLICY "Org members can view contacts" ON contacts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Org members can insert contacts" ON contacts
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Org members can update contacts" ON contacts
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS RLS - LEADS
-- ============================================

CREATE POLICY "Org members can view leads" ON leads
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND (is_deleted = FALSE OR is_deleted IS NULL)
  );

CREATE POLICY "Org members can insert leads" ON leads
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Org members can update leads" ON leads
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS RLS - CONVERSATIONS
-- ============================================

CREATE POLICY "Org members can view conversations" ON conversations
  FOR SELECT USING (
    contact_id IN (
      SELECT id FROM contacts WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Org members can insert conversations" ON conversations
  FOR INSERT WITH CHECK (
    contact_id IN (
      SELECT id FROM contacts WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- POLÍTICAS RLS - MESSAGES
-- ============================================

CREATE POLICY "Org members can view messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN contacts ct ON c.contact_id = ct.id
      WHERE ct.organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ============================================
-- FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::role_enum, 'VENDEDOR')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil ao registrar
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNÇÕES RPC PARA OPERAÇÕES COMPLEXAS
-- ============================================

-- Função para obter dashboard summary
CREATE OR REPLACE FUNCTION get_dashboard_summary(org_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'leadsQuentes', (SELECT COUNT(*) FROM leads WHERE organization_id = org_id AND temperature = 'QUENTE' AND (is_deleted = FALSE OR is_deleted IS NULL)),
    'leadsMornos', (SELECT COUNT(*) FROM leads WHERE organization_id = org_id AND temperature = 'MORNO' AND (is_deleted = FALSE OR is_deleted IS NULL)),
    'leadsFrios', (SELECT COUNT(*) FROM leads WHERE organization_id = org_id AND temperature = 'FRIO' AND (is_deleted = FALSE OR is_deleted IS NULL)),
    'conversasAtivas', (SELECT COUNT(*) FROM conversations c JOIN contacts ct ON c.contact_id = ct.id WHERE ct.organization_id = org_id AND c.status = 'ATIVA'),
    'totalLeads', (SELECT COUNT(*) FROM leads WHERE organization_id = org_id AND (is_deleted = FALSE OR is_deleted IS NULL)),
    'leadsGanhos', (SELECT COUNT(*) FROM leads WHERE organization_id = org_id AND stage = 'GANHO')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para análise de pipeline
CREATE OR REPLACE FUNCTION get_pipeline_analytics(org_id UUID)
RETURNS TABLE (
  stage lead_stage_enum,
  count BIGINT,
  stagnant BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.stage,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE l.updated_at < NOW() - INTERVAL '3 days') as stagnant
  FROM leads l
  WHERE l.organization_id = org_id AND (l.is_deleted = FALSE OR l.is_deleted IS NULL)
  GROUP BY l.stage
  ORDER BY l.stage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Inserir organização de exemplo (descomente se necessário)
-- INSERT INTO organizations (name, persona) 
-- VALUES ('Minha Organização', 'Sou um assistente virtual prestativo');

-- ============================================
-- COMENTÁRIOS FINAIS
-- ============================================

-- Script concluído!
-- Agora você pode:
-- 1. Testar a conexão usando a rota /api/supabase/test
-- 2. Criar usuários via Supabase Auth (eles serão automaticamente adicionados à tabela profiles)
-- 3. Usar as funções RPC: get_dashboard_summary(org_id), get_pipeline_analytics(org_id)
