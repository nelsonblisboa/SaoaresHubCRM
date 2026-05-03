# Supabase Integration Guide

Este guia explica como a integração com o Supabase foi implementada no projeto SOARES HUB CRM.

## 📋 Configuração

### Backend
1. **Arquivo .env**:
   - `SUPABASE_URL`: URL do seu projeto Supabase
   - `SUPABASE_ANON_KEY`: Chave pública anônima do Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço para operações administrativas

2. **Serviço Supabase** (`backend/services/supabaseService.js`):
   - Cliente Supabase configurado para operações públicas
   - Cliente administrativo para operações privilegiadas
   - Funções utilitárias para CRUD

### Frontend
1. **Arquivo .env**:
   - `VITE_SUPABASE_URL`: URL do projeto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Chave pública anônima

2. **Cliente Supabase** (`frontend/src/lib/supabaseClient.ts`):
   - Configuração do cliente com tipos TypeScript
   - Definição de tipos do banco de dados

## 🚀 Rotas Disponíveis

### Backend
- `GET /api/supabase/test` - Testar conexão com Supabase
- `POST /api/supabase/profile` - Criar perfil no Supabase
- `GET /api/leads/supabase` - Buscar leads do Supabase
- `POST /api/leads/supabase` - Criar lead no Supabase

### Frontend
- `supabaseService` - Classe com métodos para interagir com o Supabase
- `LeadDashboard` - Componente de exemplo usando Supabase

## 🔧 Exemplos de Uso

### Autenticação
```typescript
// Cadastro
await supabaseService.signUp('email@example.com', 'password', 'Name');

// Login
await supabaseService.signIn('email@example.com', 'password');

// Logout
await supabaseService.signOut();
```

### Operações com Dados
```typescript
// Buscar leads
const leads = await supabaseService.fetchLeads('org-id');

// Criar lead
const newLead = await supabaseService.createLead({
  contact_id: 'contact-id',
  stage: 'NOVO',
  score: 1,
  temperature: 'FRIO',
  organization_id: 'org-id'
});

// Atualizar lead
const updatedLead = await supabaseService.updateLead(leadId, {
  stage: 'QUALIFICADO'
});
```

## 📊 Estrutura de Dados

### Leads
```typescript
interface Lead {
  id: string;
  contact_id: string;
  stage: 'NOVO' | 'QUALIFICADO' | 'PROPOSTA' | 'NEGOCIACAO' | 'GANHO' | 'PERDIDO';
  score: number;
  temperature: 'QUENTE' | 'MORNO' | 'FRIO';
  organization_id: string;
  created_at: string;
  updated_at: string;
}
```

### Conversas
```typescript
interface Conversation {
  id: string;
  contact_id: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'INSTAGRAM';
  status: 'ATIVA' | 'FECHADA' | 'AGUARDANDO_HUMANO';
  is_ai_active: boolean;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### Perfil
```typescript
interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
```

## 🔐 Segurança

- **Row Level Security (RLS)**: Configure no Supabase para controlar acesso aos dados
- **Autenticação**: Usa o sistema de autenticação do Supabase
- **Autorização**: Controle de acesso baseado em roles e organização

## ✅ Progresso Atual

### Concluído
- [x] Configuração de variáveis de ambiente (.env)
- [x] Serviço Supabase no backend (services/supabaseService.js)
- [x] Rotas Fastify para Supabase (routes/supabaseRoutes.js)
- [x] Cliente Supabase no frontend com tipos TypeScript (lib/supabaseClient.ts)
- [x] Serviço frontend para operações CRUD (services/supabaseService.ts)
- [x] Componente LeadDashboard de exemplo (components/LeadDashboard.tsx)
- [x] Correção de rotas Express → Fastify
- [x] Correção de erros TypeScript

## 🛠️ Próximos Passos

1. Configurar RLS (Row Level Security) no Supabase
2. Implementar funções RPC para operações complexas
3. Adicionar tratamento de erros robusto
4. Implementar caching para melhor performance
5. Testar integração end-to-end

## 📝 Notas

- O backend usa Prisma como ORM principal, mas pode usar Supabase para operações específicas
- O frontend usa React com TypeScript e Supabase para autenticação e dados
- Ambos os ambientes estão configurados para usar as mesmas variáveis de ambiente

## 🐛 Troubleshooting

### Problemas de Conexão
1. Verifique se as variáveis de ambiente estão corretas
2. Confirme se o projeto Supabase está ativo
3. Verifique a rede/firewall

### Problemas de Autenticação
1. Verifique se as chaves estão corretas
2. Confirme se o domínio está permitido nas configurações do Supabase
3. Verifique se o usuário existe no banco

### Problemas de Dados
1. Verifique as permissões RLS no Supabase
2. Confirme se a estrutura dos dados corresponde aos tipos definidos
3. Verifique se as operações estão usando os IDs corretos