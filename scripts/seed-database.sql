-- ============================================
-- SOARES HUB CRM - Seed Completo do Banco
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- IDs fixos para referência (você pode alterar se quiser)
\set org_id '00000000-0000-0000-0000-000000000001'

-- ============================================
-- 1. ORGANIZAÇÃO
-- ============================================
INSERT INTO organizations (id, name, persona, primary_color)
VALUES (
  :'org_id',
  'SOARES HUB Imóveis',
  'Sou um corretor virtual especializado em imóveis de alto padrão. Foco total em fechar vendas, sou prestativo, profissional e direto.',
  '#10b981'
) ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  persona = EXCLUDED.persona;

-- ============================================
-- 2. USUÁRIOS (Crie via Supabase Auth primeiro, depois atualize os IDs abaixo)
-- ============================================

-- ⚠️ IMPORTANTE: Crie 3 usuários no Supabase Dashboard (Authentication > Users):
-- 1. admin@soareshub.com (senha: Admin123!)
-- 2. gerente@soareshub.com (senha: Gerente123!)
-- 3. vendedor@soareshub.com (senha: Vendedor123!)
-- Depois copie os UUIDs dos usuários criados e substitua abaixo:

DO $$
DECLARE
  admin_id UUID := '00000000-0000-0000-0000-000000000101';  -- SUBSTITUA pelo ID real do admin
  gerente_id UUID := '00000000-0000-0000-0000-000000000102'; -- SUBSTITUA pelo ID real do gerente
  vendedor_id UUID := '00000000-0000-0000-0000-000000000103'; -- SUBSTITUA pelo ID real do vendedor
BEGIN
  -- Atualizar profiles com organization_id e role
  UPDATE profiles SET 
    organization_id = :'org_id'::UUID,
    role = 'ADMIN',
    name = 'Nelson Soares'
  WHERE id = admin_id;

  UPDATE profiles SET 
    organization_id = :'org_id'::UUID,
    role = 'GERENTE',
    name = 'Maria Gerente'
  WHERE id = gerente_id;

  UPDATE profiles SET 
    organization_id = :'org_id'::UUID,
    role = 'VENDEDOR',
    name = 'João Vendedor'
  WHERE id = vendedor_id;

  RAISE NOTICE 'Profiles atualizados com organization_id';
END $$;

-- ============================================
-- 3. CONTATOS (20 contatos para teste)
-- ============================================
INSERT INTO contacts (id, name, phone_number, instagram_username, tags, source, organization_id) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Ana Clara Silva', '5511999999901', 'anaclara_s', ARRAY['whatsapp', 'teste'], 'whatsapp', :'org_id'),
  ('10000000-0000-0000-0000-000000000002', 'Roberto Carlos', '5511999999902', 'roberto_c', ARRAY['instagram', 'teste'], 'instagram', :'org_id'),
  ('10000000-0000-0000-0000-000000000003', 'Marcos Paulo', '5511999999903', 'marcos_p', ARRAY['whatsapp', 'teste'], 'whatsapp', :'org_id'),
  ('10000000-0000-0000-0000-000000000004', 'Juliana Oliveira', '5511999999904', 'juliana_o', ARRAY['instagram', 'teste'], 'instagram', :'org_id'),
  ('10000000-0000-0000-0000-000000000005', 'Carlos Eduardo', '5511999999905', 'carlosedu', ARRAY['whatsapp', 'vip'], 'whatsapp', :'org_id'),
  ('10000000-0000-0000-0000-000000000006', 'Fernanda Lima', '5511999999906', 'fernanda_l', ARRAY['instagram', 'vip'], 'instagram', :'org_id'),
  ('10000000-0000-0000-0000-000000000007', 'Ricardo Alves', '5511999999907', 'ricardo_a', ARRAY['whatsapp', 'teste'], 'whatsapp', :'org_id'),
  ('10000000-0000-0000-0000-000000000008', 'Patrícia Souza', '5511999999908', 'patricia_s', ARRAY['instagram', 'teste'], 'instagram', :'org_id'),
  ('10000000-0000-0000-0000-000000000009', 'Lucas Mendes', '5511999999909', 'lucas_m', ARRAY['whatsapp', 'teste'], 'whatsapp', :'org_id'),
  ('10000000-0000-0000-0000-000000000010', 'Camila Santos', '5511999999910', 'camila_s', ARRAY['instagram', 'teste'], 'instagram', :'org_id'),
  ('10000000-0000-0000-0000-000000000011', 'Bruno Costa', '5511999999911', 'bruno_c', ARRAY['whatsapp', 'negociacao'], 'whatsapp', :'org_id'),
  ('10000000-0000-0000-0000-000000000012', 'Larissa Dias', '5511999999912', 'larissa_d', ARRAY['instagram', 'negociacao'], 'instagram', :'org_id'),
  ('10000000-0000-0000-0000-000000000013', 'Eduardo Lima', '5511999999913', 'eduardo_l', ARRAY['whatsapp', 'teste'], 'whatsapp', :'org_id'),
  ('10000000-0000-0000-0000-000000000014', 'Amanda Torres', '5511999999914', 'amanda_t', ARRAY['instagram', 'teste'], 'instagram', :'org_id'),
  ('10000000-0000-0000-0000-000000000015', 'Felipe Rocha', '5511999999915', 'felipe_r', ARRAY['whatsapp', 'vip'], 'whatsapp', :'org_id'),
  ('10000000-0000-0000-0000-000000000016', 'Bianca Martins', '5511999999916', 'bianca_m', ARRAY['instagram', 'vip'], 'instagram', :'org_id'),
  ('10000000-0000-0000-0000-000000000017', 'Gustavo Henrique', '5511999999917', 'gustavo_h', ARRAY['whatsapp', 'teste'], 'whatsapp', :'org_id'),
  ('10000000-0000-0000-0000-000000000018', 'Letícia Almeida', '5511999999918', 'leticia_a', ARRAY['instagram', 'teste'], 'instagram', :'org_id'),
  ('10000000-0000-0000-0000-000000000019', 'André Luiz', '5511999999919', 'andre_l', ARRAY['whatsapp', 'teste'], 'whatsapp', :'org_id'),
  ('10000000-0000-0000-0000-000000000020', 'Priscila Vieira', '5511999999920', 'priscila_v', ARRAY['instagram', 'teste'], 'instagram', :'org_id')
ON CONFLICT (phone_number) DO NOTHING;

-- ============================================
-- 4. LEADS (15 leads em diferentes estágios)
-- ============================================
DO $$
DECLARE
  admin_id UUID := '00000000-0000-0000-0000-000000000101';
  vendedor_id UUID := '00000000-0000-0000-0000-000000000103';
BEGIN
  INSERT INTO leads (id, stage, score, temperature, deal_value, notes, funnel_stage, contact_id, assigned_to_id, organization_id, is_deleted) VALUES
    ('20000000-0000-0000-0000-000000000001', 'NOVO', 3, 'FRIO', 150000, 'Lead interessado em apartamentos', 'QUALIFICACAO', '10000000-0000-0000-0000-000000000001', admin_id, :'org_id', FALSE),
    ('20000000-0000-0000-0000-000000000002', 'NOVO', 4, 'FRIO', 200000, 'Primeiro contato via Instagram', 'QUALIFICACAO', '10000000-0000-0000-0000-000000000002', admin_id, :'org_id', FALSE),
    ('20000000-0000-0000-0000-000000000003', 'QUALIFICADO', 6, 'MORNO', 300000, 'Já visitou 2 imóveis', 'QUALIFICACAO', '10000000-0000-0000-0000-000000000003', vendedor_id, :'org_id', FALSE),
    ('20000000-0000-0000-0000-000000000004', 'QUALIFICADO', 7, 'MORNO', 250000, 'Interessado em cobertura', 'QUALIFICACAO', '10000000-0000-0000-0000-000000000004', vendedor_id, :'org_id', FALSE),
    ('20000000-0000-0000-0000-000000000005', 'QUALIFICADO', 8, 'QUENTE', 180000, 'Pronto para fechar', 'OBJECOES', '10000000-0000-0000-0000-000000000005', vendedor_id, :'org_id', FALSE),
    ('20000000-0000-0000-0000-000000000006', 'PROPOSTA', 8, 'QUENTE', 450000, 'Proposta enviada para apto 301', 'PROPOSTA', '10000000-0000-0000-0000-000000000006', vendedor_id, :'org_id', FALSE),
    ('20000000-0000-0000-0000-000000000007', 'PROPOSTA', 9, 'QUENTE', 350000, 'Contra-proposta em análise', 'PROPOSTA', '10000000-0000-0000-0000-000000000007', vendedor_id, :'org_id', FALSE),
    ('20000000-0000-0000-0000-000000000008', 'PROPOSTA', 7, 'MORNO', 280000, 'Aguardando financiamento', 'PROPOSTA', '10000000-0000-0000-0000-000000000008', admin_id, :'org_id', FALSE),
    ('20000000-0000-0000-0000-000000000009', 'NEGOCIACAO', 9, 'QUENTE', 500000, 'Negociando valor final', 'NEGOCIACAO', '10000000-0000-0000-0000-000000000009', vendedor_id, :'org_id', FALSE),
    ('20000000-0000-0000-0000-000000000010', 'NEGOCIACAO', 8, 'QUENTE', 320000, 'Documentação em andamento', 'NEGOCIACAO', '10000000-0000-0000-0000-000000000010', vendedor_id, :'org_id', FALSE),
    ('20000000-0000-0000-0000-000000000011', 'NEGOCIACAO', 9, 'QUENTE', 600000, 'Quase fechando', 'FECHAMENTO', '10000000-0000-0000-0000-000000000011', vendedor_id, :'org_id', FALSE),
    ('20000000-0000-0000-0000-000000000012', 'GANHO', 10, 'QUENTE', 400000, 'Venda realizada!', 'FECHAMENTO', '10000000-0000-0000-0000-000000000012', vendedor_id, :'org_id', FALSE),
    ('20000000-0000-0000-0000-000000000013', 'GANHO', 10, 'QUENTE', 550000, 'Venda fechada com sucesso', 'FECHAMENTO', '10000000-0000-0000-0000-000000000013', vendedor_id, :'org_id', FALSE),
    ('20000000-0000-0000-0000-000000000014', 'PERDIDO', 2, 'FRIO', 150000, 'Cliente desistiu - sem orçamento', NULL, '10000000-0000-0000-0000-000000000014', admin_id, :'org_id', FALSE),
    ('20000000-0000-0000-0000-000000000015', 'PERDIDO', 3, 'FRIO', 200000, 'Foi para concorrência', NULL, '10000000-0000-0000-0000-000000000015', admin_id, :'org_id', FALSE)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================
-- 5. CONVERSAS (10 conversas com mensagens)
-- ============================================
INSERT INTO conversations (id, status, channel, is_ai_active, last_message, last_message_at, active_agent, contact_id, lead_id) VALUES
  ('30000000-0000-0000-0000-000000000001', 'ATIVA', 'WHATSAPP', TRUE, 'Olá! Vi seu interesse no apartamento. Como posso ajudar?', NOW() - INTERVAL '2 hours', 'Vendas', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', 'ATIVA', 'INSTAGRAM', TRUE, 'Oi! Vi que você tem interesse em imóveis. Vamos conversar?', NOW() - INTERVAL '1 hour', 'Vendas', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002'),
  ('30000000-0000-0000-0000-000000000003', 'ATIVA', 'WHATSAPP', FALSE, 'Já visitei 2 imóveis e gostei do 301', NOW() - INTERVAL '30 minutes', NULL, '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003'),
  ('30000000-0000-0000-0000-000000000004', 'AGUARDANDO_HUMANO', 'INSTAGRAM', FALSE, 'Preciso falar com um humano urgente', NOW() - INTERVAL '15 minutes', NULL, '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004'),
  ('30000000-0000-0000-0000-000000000005', 'ATIVA', 'WHATSAPP', TRUE, 'Estou pronto para fechar negócio!', NOW() - INTERVAL '45 minutes', 'Vendas', '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005'),
  ('30000000-0000-0000-0000-000000000006', 'ATIVA', 'WHATSAPP', FALSE, 'Proposta enviada, aguardo retorno', NOW() - INTERVAL '2 days', NULL, '10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000006'),
  ('30000000-0000-0000-0000-000000000007', 'ATIVA', 'INSTAGRAM', TRUE, 'Sua proposta foi atualizada', NOW() - INTERVAL '1 day', 'Vendas', '10000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000007'),
  ('30000000-0000-0000-0000-000000000008', 'NEGOCIACAO', 'WHATSAPP', FALSE, 'Negociando valor final do imóvel', NOW() - INTERVAL '3 hours', NULL, '10000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000009'),
  ('30000000-0000-0000-0000-000000000009', 'FECHADA', 'WHATSAPP', FALSE, 'Venda realizada com sucesso!', NOW() - INTERVAL '5 days', NULL, '10000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000012'),
  ('30000000-0000-0000-0000-000000000010', 'FECHADA', 'INSTAGRAM', FALSE, 'Documentação concluída', NOW() - INTERVAL '3 days', NULL, '10000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000013')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. MENSAGENS (para cada conversa)
-- ============================================
INSERT INTO messages (conversation_id, content, from_me, message_type, is_ai_generated, agent_key, timestamp) VALUES
  -- Conversa 1 (WhatsApp - IA ativa)
  ('30000000-0000-0000-0000-000000000001', 'Olá! Vi seu interesse no apartamento. Como posso ajudar?', TRUE, 'text', TRUE, 'Vendas', NOW() - INTERVAL '2 hours'),
  ('30000000-0000-0000-0000-000000000001', 'Oi! Estou procurando algo de 3 quartos', FALSE, 'text', FALSE, NULL, NOW() - INTERVAL '1 hour 55 minutes'),
  ('30000000-0000-0000-0000-000000000001', 'Tenho ótimas opções de 3 quartos no seu orçamento!', TRUE, 'text', TRUE, 'Vendas', NOW() - INTERVAL '1 hour 50 minutes'),
  ('30000000-0000-0000-0000-000000000001', 'Me envie fotos do apto 301', FALSE, 'text', FALSE, NULL, NOW() - INTERVAL '1 hour 45 minutes'),
  -- Conversa 2 (Instagram - IA ativa)
  ('30000000-0000-0000-0000-000000000002', 'Oi! Vi que você tem interesse em imóveis. Vamos conversar?', TRUE, 'text', TRUE, 'Vendas', NOW() - INTERVAL '1 hour'),
  ('30000000-0000-0000-0000-000000000002', 'Oi! Curto muito os posts de vocês', FALSE, 'text', FALSE, NULL, NOW() - INTERVAL '55 minutes'),
  ('30000000-0000-0000-0000-000000000002', 'Tenho promoções exclusivas para seguidores!', TRUE, 'text', TRUE, 'Vendas', NOW() - INTERVAL '50 minutes'),
  -- Conversa 3 (WhatsApp - Humano)
  ('30000000-0000-0000-0000-000000000003', 'Já visitei 2 imóveis e gostei do 301', FALSE, 'text', FALSE, NULL, NOW() - INTERVAL '30 minutes'),
  ('30000000-0000-0000-0000-000000000003', 'Ótimo! Vamos agendar uma reunião?', TRUE, 'text', FALSE, NULL, NOW() - INTERVAL '25 minutes'),
  -- Conversa 4 (Instagram - Aguardando humano)
  ('30000000-0000-0000-0000-000000000004', 'Preciso falar com um humano urgente', FALSE, 'text', FALSE, NULL, NOW() - INTERVAL '15 minutes'),
  ('30000000-0000-0000-0000-000000000004', 'Já estou transferindo para um atendente', TRUE, 'text', TRUE, 'Vendas', NOW() - INTERVAL '14 minutes'),
  -- Conversa 5 (WhatsApp - Pronto para fechar)
  ('30000000-0000-0000-0000-000000000005', 'Estou pronto para fechar negócio!', FALSE, 'text', FALSE, NULL, NOW() - INTERVAL '45 minutes'),
  ('30000000-0000-0000-0000-000000000005', 'Excelente! Vou preparar o contrato', TRUE, 'text', FALSE, NULL, NOW() - INTERVAL '40 minutes');

-- ============================================
-- 7. HANDOVERS
-- ============================================
INSERT INTO handovers (reason, status, conversation_id, requested_by, resolved_at) VALUES
  ('IA não conseguiu qualificar o lead', 'PENDENTE', '30000000-0000-0000-0000-000000000004', 'IA', NULL),
  ('Cliente solicitou falar com humano', 'ACEITO', '30000000-0000-0000-0000-000000000003', 'IA', NOW() - INTERVAL '20 minutes'),
  ('Preço muito alto, escalar para gerente', 'CONCLUIDO', '30000000-0000-0000-0000-000000000002', 'IA', NOW() - INTERVAL '30 minutes');

-- ============================================
-- 8. CAMPANHAS
-- ============================================
INSERT INTO campanhas (name, channel, status, segment, ai_prompt, total_sent, total_delivered, total_replied, total_converted, scheduled_at, organization_id) VALUES
  ('Welcome WhatsApp - Outubro', 'WHATSAPP', 'CONCLUIDA', '{"temperature": ["QUENTE", "MORNO"]}', 'Crie uma mensagem de boas-vindas personalizada oferecendo nossos melhores imóveis', 150, 145, 45, 8, NOW() - INTERVAL '7 days', :'org_id'),
  ('Follow-up Instagram - Leads Frios', 'INSTAGRAM', 'RASCUNHO', '{"temperature": ["FRIO"]}', 'Mensagem casual para reaquecer lead frio do Instagram', 0, 0, 0, 0, NULL, :'org_id'),
  ('Black Friday Imóveis 2026', 'WHATSAPP', 'AGENDADA', '{"stage": ["QUALIFICADO", "PROPOSTA"]}', 'Oferta especial de Black Friday com descontos exclusivos', 0, 0, 0, 0, NOW() + INTERVAL '3 days', :'org_id');

-- ============================================
-- 9. SEQUÊNCIAS + PASSOS + ENROLLMENTS
-- ============================================
DO $$
DECLARE
  seq1_id UUID := '40000000-0000-0000-0000-000000000001';
  seq2_id UUID := '40000000-0000-0000-0000-000000000002';
BEGIN
  -- Sequência 1: Reengajamento Lead Frio
  INSERT INTO sequences (id, name, trigger, is_active, organization_id) 
  VALUES (seq1_id, 'Reengajamento Lead Frio', 'lead_cold_7days', TRUE, :'org_id')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO sequence_steps (sequence_id, "order", delay_minutes, message_template, use_ai, ai_prompt, channel) VALUES
    (seq1_id, 1, 1440, 'Olá! Vi que você ainda não decidiu. Tenho novas opções para você!', FALSE, NULL, 'WHATSAPP'),
    (seq1_id, 2, 2880, NULL, TRUE, 'Crie uma mensagem personalizada tentando reaquecer este lead', 'WHATSAPP'),
    (seq1_id, 3, 4320, 'Última chance! Promoção especial válida até amanhã.', FALSE, NULL, 'WHATSAPP')
  ON CONFLICT DO NOTHING;

  -- Sequência 2: Pós-venda Ganho
  INSERT INTO sequences (id, name, trigger, is_active, organization_id) 
  VALUES (seq2_id, 'Pós-venda Ganho', 'lead_won_1day', TRUE, :'org_id')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO sequence_steps (sequence_id, "order", delay_minutes, message_template, use_ai, ai_prompt, channel) VALUES
    (seq2_id, 1, 1440, 'Parabéns pela compra! Como posso ajudar com seu novo imóvel?', FALSE, NULL, 'WHATSAPP'),
    (seq2_id, 2, 10080, NULL, TRUE, 'Peça uma indicação para o cliente satisfeito', 'WHATSAPP')
  ON CONFLICT DO NOTHING;

  -- Enrollments (inscrições em sequências)
  INSERT INTO sequence_enrollments (sequence_id, contact_id, current_step, status, next_run_at) VALUES
    (seq1_id, '10000000-0000-0000-0000-000000000014', 1, 'ACTIVE', NOW() + INTERVAL '1 day'),
    (seq1_id, '10000000-0000-0000-0000-000000000015', 2, 'ACTIVE', NOW() + INTERVAL '2 days'),
    (seq2_id, '10000000-0000-0000-0000-000000000012', 1, 'ACTIVE', NOW() + INTERVAL '1 day')
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- 10. MENSAGENS AGENDADAS
-- ============================================
INSERT INTO scheduled_messages (content, channel, status, scheduled_at, contact_id) VALUES
  ('Lembrete: Não esqueça de retornar ao cliente Ana Clara!', 'WHATSAPP', 'PENDING', NOW() + INTERVAL '1 hour', '10000000-0000-0000-0000-000000000001'),
  ('Follow-up: Roberto Carlos não responde há 3 dias', 'INSTAGRAM', 'PENDING', NOW() + INTERVAL '2 hours', '10000000-0000-0000-0000-000000000002'),
  ('Enviar proposta atualizada para Marcos Paulo', 'WHATSAPP', 'PENDING', NOW() + INTERVAL '3 hours', '10000000-0000-0000-0000-000000000003'),
  ('Ligar para Juliana - interesse em cobertura', 'WHATSAPP', 'PENDING', NOW() + INTERVAL '4 hours', '10000000-0000-0000-0000-000000000004'),
  ('Enviar contrato para Carlos Eduardo', 'WHATSAPP', 'PENDING', NOW() + INTERVAL '5 hours', '10000000-0000-0000-0000-000000000005');

-- ============================================
-- 11. USER DEVICES (Push Notifications)
-- ============================================
DO $$
DECLARE
  admin_id UUID := '00000000-0000-0000-0000-000000000101';
  gerente_id UUID := '00000000-0000-0000-0000-000000000102';
  vendedor_id UUID := '00000000-0000-0000-0000-000000000103';
BEGIN
  INSERT INTO user_devices (user_id, token) VALUES
    (admin_id, 'expo-push-token-admin-123456'),
    (gerente_id, 'expo-push-token-gerente-789012'),
    (vendedor_id, 'expo-push-token-vendedor-345678')
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================
-- 🎉 FINALIZADO!
-- ============================================
SELECT 'Banco populado com sucesso! ✅' as status;

-- Resumo dos dados criados:
SELECT 
  'organizations' as tabela, COUNT(*) as total FROM organizations WHERE id = :'org_id'
UNION ALL
SELECT 
  'contacts', COUNT(*) FROM contacts WHERE organization_id = :'org_id'
UNION ALL
SELECT 
  'leads', COUNT(*) FROM leads WHERE organization_id = :'org_id'
UNION ALL
SELECT 
  'conversations', COUNT(*) FROM conversations c JOIN contacts ct ON c.contact_id = ct.id WHERE ct.organization_id = :'org_id'
UNION ALL
SELECT 
  'messages', COUNT(*) FROM messages m JOIN conversations c ON m.conversation_id = c.id JOIN contacts ct ON c.contact_id = ct.id WHERE ct.organization_id = :'org_id'
UNION ALL
SELECT 
  'campanhas', COUNT(*) FROM campanhas WHERE organization_id = :'org_id'
UNION ALL
SELECT 
  'sequences', COUNT(*) FROM sequences WHERE organization_id = :'org_id';
