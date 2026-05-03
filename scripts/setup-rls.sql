-- ============================================
-- SOARES HUB CRM - Row Level Security (RLS)
-- Isolação de dados por Organização e Vendedor
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- ============================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
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
-- 2. FUNÇÕES AUXILIARES
-- ============================================

-- Função para obter organization_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, pg_catalog, auth
AS $$
DECLARE
  result uuid;
BEGIN
  SELECT
    p.organization_id::uuid
  INTO result
  FROM public.profiles p
  WHERE p.id::uuid = auth.uid()
  LIMIT 1;

  RETURN result;
END;
$$;

-- Função para verificar se usuário é ADMIN/GERENTE
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
-- 3. POLÍTICAS - ORGANIZATIONS
-- ============================================

-- Usuários podem ver apenas sua própria organização
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (
    id = get_user_organization_id()
  );

-- Apenas ADMIN pode atualizar organização
CREATE POLICY "Only admins can update organization" ON organizations
  FOR UPDATE USING (
    id = get_user_organization_id() 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ============================================
-- 4. POLÍTICAS - PROFILES
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

DROP POLICY IF EXISTS "Admins can view org profiles" ON public.profiles;
CREATE POLICY "Admins can view org profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.profiles.organization_id = public.get_user_organization_id()
  AND public.is_admin_or_gerente()
);

-- ============================================
-- 5. POLÍTICAS - CONTACTS (Isolamento por Org)
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

DROP POLICY IF EXISTS "Org members can delete contacts" ON public.contacts;
CREATE POLICY "Org members can delete contacts" 
ON public.contacts
FOR DELETE 
TO authenticated
USING (
  public.contacts.organization_id = public.get_user_organization_id()
  AND public.is_admin_or_gerente()
);

-- ============================================
-- 6. POLÍTICAS - LEADS (Isolamento por Org + Filtro Soft Delete)
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

DROP POLICY IF EXISTS "Only assigned or admin can delete leads" ON public.leads;
CREATE POLICY "Only assigned or admin can delete leads" 
ON public.leads
FOR DELETE 
TO authenticated
USING (
  public.leads.organization_id = public.get_user_organization_id()
  AND (
    public.leads.assigned_to_id::uuid = auth.uid() 
    OR public.is_admin_or_gerente()
  )
);

-- ============================================
-- 7. POLÍTICAS - CONVERSATIONS (Via Contact ou Lead)
-- ============================================

DROP POLICY IF EXISTS "Users can view org conversations" ON public.conversations;
CREATE POLICY "Users can view org conversations" 
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

DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
CREATE POLICY "Users can insert conversations" 
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

DROP POLICY IF EXISTS "Users can update org conversations" ON public.conversations;
CREATE POLICY "Users can update org conversations" 
ON public.conversations
FOR UPDATE 
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

-- ============================================
-- 8. POLÍTICAS - MESSAGES (Via Conversation -> Contact ou Lead)
-- ============================================

DROP POLICY IF EXISTS "Users can view org messages" ON public.messages;
CREATE POLICY "Users can view org messages" 
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

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" 
ON public.messages
FOR INSERT 
TO authenticated
WITH CHECK (
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
-- 9. POLÍTICAS - HANDOVERS (Via Conversation)
-- ============================================

DROP POLICY IF EXISTS "Users can view org handovers" ON public.handovers;
CREATE POLICY "Users can view org handovers" 
ON public.handovers
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = public.handovers.conversation_id
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

DROP POLICY IF EXISTS "Users can insert handovers" ON public.handovers;
CREATE POLICY "Users can insert handovers" 
ON public.handovers
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = public.handovers.conversation_id
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
-- 10. POLÍTICAS - CAMPANHAS
-- ============================================

CREATE POLICY "Org members can view campanhas" ON campanhas
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "Org members can manage campanhas" ON campanhas
  FOR ALL USING (
    organization_id = get_user_organization_id()
    AND is_admin_or_gerente()  -- Apenas ADMIN/GERENTE podem gerenciar
  );

-- ============================================
-- 11. POLÍTICAS - SEQUENCES
-- ============================================

CREATE POLICY "Org members can view sequences" ON sequences
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "Admins can manage sequences" ON sequences
  FOR ALL USING (
    organization_id = get_user_organization_id()
    AND is_admin_or_gerente()
  );

-- Sequence Steps (via sequence)
CREATE POLICY "Org members can view sequence steps" ON sequence_steps
  FOR SELECT USING (
    sequence_id IN (
      SELECT id FROM sequences 
      WHERE organization_id = get_user_organization_id()
    )
  );

-- Sequence Enrollments (via contact -> organization)
CREATE POLICY "Org members can view enrollments" ON sequence_enrollments
  FOR SELECT USING (
    contact_id IN (
      SELECT id FROM contacts 
      WHERE organization_id = get_user_organization_id()
    )
  );

-- ============================================
-- 12. POLÍTICAS - SCHEDULED MESSAGES
-- ============================================

CREATE POLICY "Org members can manage scheduled messages" ON scheduled_messages
  FOR ALL USING (
    contact_id IN (
      SELECT id FROM contacts 
      WHERE organization_id = get_user_organization_id()
    )
  );

-- ============================================
-- 13. POLÍTICAS - USER DEVICES
-- ============================================

CREATE POLICY "Users can manage own devices" ON user_devices
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- 14. ÍNDICES PARA PERFORMANCE DAS POLÍTICAS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_org ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv_org ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_handovers_conv_org ON handovers(conversation_id);

-- ============================================
-- 15. FUNÇÕES RPC
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

-- ============================================
-- 16. COMENTÁRIOS FINAIS
-- ============================================

-- Verificar se RLS está ativo
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Teste de isolamento (deve retornar 0 se RLS estiver funcionando)
-- Substitua 'seu_user_id' pelo ID de um usuário de teste
/*
SET request.jwt.claims TO '{"sub": "seu_user_id"}';
SELECT count(*) FROM leads;  -- Deve retornar apenas leads da org do usuário
*/

SELECT 'RLS configurado com sucesso! ✅' as status;
SELECT 'Isolamento de dados por organização ativado.' as message;
