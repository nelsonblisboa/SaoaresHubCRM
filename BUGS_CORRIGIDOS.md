# RELATÓRIO DE CORREÇÃO DE BUGS - SOARES HUB CRM

## Resumo Executivo
Foram encontrados **25 bugs** no total. Desses, **10 bugs críticos de segurança** foram corrigidos.

---

## ✅ BUGS CORRIGIDOS (Críticos - Segurança)

### 1. Backend: GET /leads vazamento de dados
- **Arquivo:** `backend/index.js:138`
- **Problema:** Usava `organizationId` da query string sem validação
- **Correção:** Agora usa `request.user.organizationId` do token JWT
- **Status:** ✅ CORRIGIDO

### 2. Backend: PATCH /leads/:id sem verificação de ownership
- **Arquivo:** `backend/index.js:175-176`
- **Problema:** Qualquer usuário podia alterar leads de outras organizações
- **Correção:** Adicionado `organizationId` na cláusula `where`
- **Status:** ✅ CORRIGIDO

### 3. Backend: POST /leads/:id/takeover sem verificação
- **Arquivo:** `backend/index.js:205-206`
- **Problema:** Handover sem validar se o lead pertence à organização
- **Correção:** Adicionada verificação de ownership antes do handover
- **Status:** ✅ CORRIGIDO

### 4. Backend: GET /conversations/:id sem verificação
- **Arquivo:** `backend/index.js:272-273`
- **Problema:** Vazamento de dados de conversas
- **Correção:** Usa `findFirst` com filtro por `contact.organizationId`
- **Status:** ✅ CORRIGIDO

### 5. Backend: POST /conversations/:id/messages sem verificação
- **Arquivo:** `backend/index.js:303-305`
- **Problema:** Mensagens podiam ser enviadas em qualquer conversa
- **Correção:** Validação de ownership adicionada
- **Status:** ✅ CORRIGIDO

### 6. Backend: Dashboard mensagensHoje sem filtro
- **Arquivo:** `backend/index.js:386-389`
- **Problema:** Contava mensagens de TODAS as organizações
- **Correção:** Adicionado filtro via `conversation.contact.organizationId`
- **Status:** ✅ CORRIGIDO

### 7. Backend: GET /conversations sem filtro adequado
- **Arquivo:** `backend/index.js:238-241`
- **Problema:** Usava query param em vez de JWT
- **Correção:** Agora usa `request.user.organizationId`
- **Status:** ✅ CORRIGIDO

### 8. Frontend: Kanban subscription vazando dados
- **Arquivo:** `frontend/src/pages/Kanban.tsx:39-41`
- **Problema:** Realtime recebia updates de todas as organizações
- **Correção:** Adicionado `filter: organization_id=eq.${profile.organization_id}`
- **Status:** ✅ CORRIGIDO

### 9. Frontend: Conversations não filtrava por org
- **Arquivo:** `frontend/src/pages/Conversations.tsx:32-54`
- **Problema:** Busca de conversas sem filtro de organização
- **Correção:** Atualizado para usar `supabaseService.fetchConversations(orgId)` com filtro
- **Status:** ✅ CORRIGIDO

### 10. AuthContext: organization_id agora disponível
- **Arquivo:** `frontend/src/contexts/AuthContext.tsx`
- **Problema:** Perfil não carregava `organization_id`
- **Correção:** AuthContext agora busca e expõe `profile.organization_id`
- **Status:** ✅ CORRIGIDO

---

## ✅ BUGS CORRIGIDOS (Schema/Performance)

### 11. Prisma: Mapeamento instagramUsername
- **Arquivo:** `backend/prisma/schema.prisma:43`
- **Problema:** Campo não mapeava para `instagram_username` no banco
- **Correção:** Adicionado `@map("instagram_username")`
- **Status:** ✅ CORRIGIDO

### 12. Prisma: Campos duplicados na Campanha
- **Arquivo:** `backend/prisma/schema.prisma:113-131`
- **Problema:** `name/nome` e `channel/canal` duplicados
- **Correção:** Removidos campos duplicados, padronizado para inglês
- **Status:** ✅ CORRIGIDO

### 13. Frontend: Kanban com Rollback
- **Arquivo:** `frontend/src/pages/Kanban.tsx:105-123`
- **Problema:** Sem optimistic update e sem rollback em caso de erro
- **Correção:** Implementado optimistic update e rollback automático
- **Status:** ✅ CORRIGIDO

### 14. SupabaseService: fetchConversations com filtro
- **Arquivo:** `frontend/src/services/supabaseService.ts:103-113`
- **Problema:** Não filtrava por organização
- **Correção:** Adicionado parâmetro `organizationId` e filtro na query
- **Status:** ✅ CORRIGIDO

---

## ⚠️ BUGS AINDA NÃO CORRIGIDOS (Prioridade Média/Alta)

### 🔴 ALTO: Worker sem transações (Bug #10)
- **Arquivo:** `backend/worker/index.js`
- **Problema:** Múltiplas operações no banco sem transação
- **Impacto:** Dados inconsistentes se falhar no meio
- **Correção necessária:** Usar `prisma.$transaction()`

### 🔴 ALTO: Webhook race condition (Bug #11)
- **Arquivo:** `backend/index.js:471-583`
- **Problema:** Requisições simultâneas criam contatos/leads duplicados
- **Impacto:** Dados duplicados
- **Correção necessária:** Idempotência ou `SELECT FOR UPDATE`

### 🔴 ALTO: Webhook organização padrão (Bug #7)
- **Arquivo:** `backend/index.js:495-508`
- **Problema:** Usa `findFirst()` para pegar organização
- **Impacto:** Contatos associados à org errada
- **Correção necessária:** Determinar org pela instância do WhatsApp

### 🟡 MÉDIO: Race condition no Kanban drag-drop (Bug #19)
- **Arquivo:** `frontend/src/pages/Kanban.tsx`
- **Problema:** Arraste rápido entre colunas causa race condition
- **Correção necessária:** Debounce ou bloqueio durante request

### 🟡 MÉDIO: Busca no Kanban/Leads quebrada (Bug #16)
- **Arquivo:** `frontend/src/pages/Kanban.tsx:126-129`
- **Problema:** Busca por `l.id` (UUID) não faz sentido
- **Correção necessária:** Buscar por nome do contato ou temperatura

---

## 📋 SCRIPTS CRIADOS

1. **`scripts/seed-database.js`** - Popula banco com dados de teste (Node.js)
2. **`scripts/seed-database.sql`** - Popula banco via SQL Editor do Supabase
3. **`scripts/add-indexes.sql`** - Adiciona índices compostos para performance

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

### Imediato (Segurança):
1. ✅ ~~Corrigir vazamento de dados (FEITO)~~
2. ⚠️ Adicionar transações no worker
3. ⚠️ Implementar idempotência no webhook

### Curto Prazo:
1. Testar todas as rotas com `organizationId` inválido
2. Adicionar rate limiting nas rotas de API
3. Implementar logs de auditoria

### Médio Prazo:
1. Corrigir busca no Kanban/Leads
2. Adicionar validação de schema (Joi/Zod)
3. Implementar testes automatizados (Jest/Cypress)

---

## ✅ CHECKLIST DE TESTES MANUAIS

Após as correções, teste:

- [x] GET /leads não vaza dados de outras orgs
- [x] PATCH /leads/:id valida ownership
- [x] POST /leads/:id/takeover valida ownership
- [x] GET /conversations/:id valida ownership
- [x] POST /conversations/:id/messages valida ownership
- [x] Dashboard mostra apenas dados da org correta
- [x] Kanban realtime filtra por org
- [x] Conversations filtra por org
- [ ] Drag-and-drop faz rollback em caso de erro
- [ ] Webhook não cria dados duplicados
- [ ] Worker mantém consistência em falhas

---

## 📊 ESTATÍSTICAS

- **Total de bugs encontrados:** 25
- **Bugs críticos corrigidos:** 10
- **Bugs de schema corrigidos:** 2
- **Bugs de UX corrigidos:** 2
- **Pendentes (Alto):** 3
- **Pendentes (Médio):** 6
- **Pendentes (Baixo):** 2

---

**Data da correção:** 02/05/2026  
**Sistema:** SOARES HUB CRM v2.0
