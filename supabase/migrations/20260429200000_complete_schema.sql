-- ============================================
-- MIGRAÇÃO COMPLETA: TABELAS, RLS, RPC, APP_SETTINGS
-- ============================================

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABELAS
-- ============================================

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  persona TEXT,
  logo TEXT,
  primary_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (estende auth.users)
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reason TEXT NOT NULL,
  status handover_status_enum DEFAULT 'PENDENTE',
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  requested_by TEXT NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campanhas
CREATE TABLE IF NOT EXISTS campanhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequence Steps
CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  channel TEXT DEFAULT 'WHATSAPP',
  status TEXT DEFAULT 'PENDING',
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Devices
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL
);

-- App Settings
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, key)
);

-- ============================================
-- ÍNDICES
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

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sequences_updated_at ON sequences;
CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNÇÕES AUXILIARES (SECURITY DEFINER)
-- ============================================

-- 1) Função: busca organization_id do usuário atual (retorna TEXT)
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_catalog, auth
AS $$
DECLARE
  result text;
BEGIN
  SELECT p.organization_id INTO result
  FROM public.profiles p
  WHERE p.id::uuid = auth.uid()
  LIMIT 1;
  RETURN result;
END;
$$;

-- 2) Função: verifica se o usuário é ADMIN ou GERENTE
CREATE OR REPLACE FUNCTION public.is_admin_or_gerente()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_catalog, auth
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id::uuid = auth.uid()
      AND p.role IN ('ADMIN', 'GERENTE')
  );
END;
$$;

-- Segurança extra (evita que anon/auth chamem diretamente a função)
REVOKE ALL ON FUNCTION public.get_user_organization_id() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin_or_gerente() FROM anon, authenticated;

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
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS - PROFILES
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles
FOR SELECT 
TO authenticated
USING (public.profiles.id::uuid = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles
FOR UPDATE 
TO authenticated
USING (public.profiles.id::uuid = auth.uid());

DROP POLICY IF EXISTS "Org members can view profiles" ON public.profiles;

CREATE POLICY "Org members can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.profiles.organization_id = public.get_user_organization_id()
  AND public.is_admin_or_gerente()
);

-- ============================================
-- POLÍTICAS RLS - CONTACTS
-- ============================================

DROP POLICY IF EXISTS "Org members can view contacts" ON public.contacts;
CREATE POLICY "Org members can view contacts" 
ON public.contacts
FOR SELECT 
TO authenticated
USING (public.contacts.organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Org members can insert contacts" ON public.contacts;
CREATE POLICY "Org members can insert contacts" 
ON public.contacts
FOR INSERT 
TO authenticated
WITH CHECK (public.contacts.organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Org members can update contacts" ON public.contacts;
CREATE POLICY "Org members can update contacts" 
ON public.contacts
FOR UPDATE 
TO authenticated
USING (public.contacts.organization_id = public.get_user_organization_id());

-- ============================================
-- POLÍTICAS RLS - LEADS
-- ============================================

DROP POLICY IF EXISTS "Org members can view leads" ON public.leads;
CREATE POLICY "Org members can view leads" 
ON public.leads
FOR SELECT 
TO authenticated
USING (
  public.leads.organization_id = public.get_user_organization_id()
  AND (public.leads.is_deleted = FALSE OR public.leads.is_deleted IS NULL)
);

DROP POLICY IF EXISTS "Org members can insert leads" ON public.leads;
CREATE POLICY "Org members can insert leads" 
ON public.leads
FOR INSERT 
TO authenticated
WITH CHECK (public.leads.organization_id = public.get_user_organization_id());

DROP POLICY IF EXISTS "Org members can update leads" ON public.leads;
CREATE POLICY "Org members can update leads" 
ON public.leads
FOR UPDATE 
TO authenticated
USING (public.leads.organization_id = public.get_user_organization_id());

-- ============================================
-- POLÍTICAS RLS - CONVERSATIONS
-- ============================================

DROP POLICY IF EXISTS "Org members can view conversations" ON public.conversations;
CREATE POLICY "Org members can view conversations" 
ON public.conversations
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.contacts c 
    WHERE c.id = public.conversations.contact_id 
    AND c.organization_id = public.get_user_organization_id()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.leads l 
    WHERE l.id = public.conversations.lead_id 
    AND l.organization_id = public.get_user_organization_id()
  )
);

DROP POLICY IF EXISTS "Org members can insert conversations" ON public.conversations;
CREATE POLICY "Org members can insert conversations" 
ON public.conversations
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contacts c 
    WHERE c.id = public.conversations.contact_id 
    AND c.organization_id = public.get_user_organization_id()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.leads l 
    WHERE l.id = public.conversations.lead_id 
    AND l.organization_id = public.get_user_organization_id()
  )
);

-- ============================================
-- POLÍTICAS RLS - MESSAGES
-- ============================================

DROP POLICY IF EXISTS "Org members can view messages" ON public.messages;
CREATE POLICY "Org members can view messages" 
ON public.messages
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = public.messages.conversation_id
    AND (
      EXISTS (
        SELECT 1 FROM public.contacts ct 
        WHERE ct.id = c.contact_id 
        AND ct.organization_id = public.get_user_organization_id()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.leads l 
        WHERE l.id = c.lead_id 
        AND l.organization_id = public.get_user_organization_id()
      )
    )
  )
);

-- ============================================
-- POLÍTICAS RLS - APP_SETTINGS
-- ============================================

DROP POLICY IF EXISTS "Users can manage their org settings" ON public.app_settings;
CREATE POLICY "Users can manage their org settings" 
ON public.app_settings
FOR ALL 
TO authenticated
USING (public.app_settings.organization_id = public.get_user_organization_id())
WITH CHECK (public.app_settings.organization_id = public.get_user_organization_id());

-- ============================================
-- FUNÇÕES RPC
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

-- Função para obter configuração
CREATE OR REPLACE FUNCTION get_setting(setting_key TEXT, org_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT value INTO result
  FROM app_settings
  WHERE key = setting_key 
    AND (organization_id = org_id OR (org_id IS NULL AND organization_id IS NULL))
  LIMIT 1;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para salvar configuração
CREATE OR REPLACE FUNCTION save_setting(
  setting_key TEXT,
  setting_value JSONB,
  org_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO app_settings (organization_id, key, value)
  VALUES (org_id, setting_key, setting_value)
  ON CONFLICT (organization_id, key)
  DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    'VENDEDOR'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao criar perfil: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
