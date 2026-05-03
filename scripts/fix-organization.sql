-- 1. Primeiro, verificar se já existe organização
SELECT * FROM organizations;

-- 2. Se não existir, criar a organização (sem definir ID, deixe o banco gerar)
INSERT INTO organizations (name, persona, primary_color, logo)
VALUES (
  'SOARES HUB CRM',
  'Você é um assistente virtual de vendas prestativo e profissional. Seu objetivo é qualificar leads, entender as necessidades dos clientes e encaminhar para a equipe de vendas quando apropriado.',
  '#10b981',
  NULL
)
RETURNING id, name;

-- 3. Após criar, atualizar os profiles com o UUID correto da organização
-- SUBSTITUA 'UUID-DA-ORGANIZAÇÃO' PELO ID RETORNADO ACIMA
-- UPDATE profiles SET organization_id = 'UUID-DA-ORGANIZAÇÃO' 
-- WHERE organization_id = '00000000-0000-0000-0000-000000000000';

-- 4. Verificar se atualizou corretamente
SELECT p.id, p.name, p.email, o.name as org_name
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id;