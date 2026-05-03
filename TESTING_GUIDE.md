# GUIA DE TESTES - SOARES HUB CRM

## 1. INSTALAÇÃO DAS DEPENDÊNCIAS

### Frontend (Jest + React Testing Library + Cypress)

```bash
# Navegue até o diretório do frontend
cd "C:\Users\Nelson\Desktop\SOARES HUB CRM\frontend"

# Instale as dependências de teste
npm install --save-dev \
  jest \
  ts-jest \
  @types/jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom \
  cypress \
  @typescript-eslint/eslint-plugin
```

### Backend (Jest + Supertest)

```bash
# Navegue até o diretório do backend
cd "C:\Users\Nelson\Desktop\SOARES HUB CRM\backend"

# Instale as dependências de teste
npm install --save-dev \
  jest \
  ts-jest \
  @types/jest \
  supertest \
  @types/supertest
```

---

## 2. TESTES AUTOMATIZADOS (JEST)

### Estrutura de Arquivos:
```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── Chat.test.tsx          # Testes do componente Chat
│   │   └── useChat.test.ts      # Testes do hook useChat
│   └── jest.config.js
├── cypress/
│   └── e2e/
│       └── chat.cy.ts           # Testes E2E
└── package.json
```

### Executar Testes Jest:

```bash
cd "C:\Users\Nelson\Desktop\SOARES HUB CRM\frontend"

# Executar todos os testes
npm test

# Executar com watch mode
npm run test:watch

# Executar com cobertura
npm run test:coverage
```

### Exemplo de Saída Esperada:
```
 PASS  src/__tests__/Chat.test.tsx
  Chat Page
    ✓ deve renderizar o header com nome do contato (123ms)
    ✓ deve exibir mensagens em tempo real (89ms)
    ✓ deve exibir indicador de IA para mensagens geradas (45ms)
    ✓ deve ter campo de input para mensagens (23ms)
    ✓ deve chamar sendMessage ao clicar em enviar (67ms)
    ✓ deve desabilitar input quando sending for true (34ms)

 PASS  src/__tests__/useChat.test.ts
  useChat Hook
    ✓ deve inicializar com mensagens vazias (12ms)
    ✓ deve buscar conversa e mensagens ao montar (156ms)
    ✓ deve enviar mensagem com optimistic update (78ms)
    ✓ deve fazer rollback se envio falhar (92ms)
    ✓ deve fazer takeOver corretamente (45ms)
    ✓ deve inscrever no Supabase Realtime (23ms)

Test Suites: 2 passed, 2 total
Tests:       10 passed, 10 total
Coverage:   78.5% (statements)
```

---

## 3. TESTES E2E (CYPRESS)

### Executar Cypress:

```bash
cd "C:\Users\Nelson\Desktop\SOARES HUB CRM\frontend"

# Abrir interface visual do Cypress
npm run cypress:open

# Executar em modo headless (CI/CD)
npm run cypress:run
```

### Fluxo do Teste E2E:
1. **Login** → Autentica no Supabase
2. **Navegação** → Vai para `/conversations`
3. **Seleção** → Clica em uma conversa
4. **Envio** → Digita mensagem e envia
5. **Verificação** → Mensagem aparece na tela
6. **Takeover** → Clica em "Assumir"

### Dica: Mock do Backend
Como o Cypress testa a interface real, você precisa:
- Ter o backend rodando na porta 3000
- Ter o frontend rodando na porta 5173
- Ou usar `cy.intercept()` para mockar as APIs (já implementado)

---

## 4. TESTES MANUAIS (CHAT_TEST_CHECKLIST.md)

### Pré-requisitos:
```bash
# Terminal 1: Backend
cd "C:\Users\Nelson\Desktop\SOARES HUB CRM\backend"
npm run dev

# Terminal 2: Frontend
cd "C:\Users\Nelson\Desktop\SOARES HUB CRM\frontend"
npm run dev

# Terminal 3: Worker (opcional)
cd "C:\Users\Nelson\Desktop\SOARES HUB CRM\backend"
node worker/index.js
```

### Executar Testes Manuais:

#### Teste 1: Envio de Mensagem
1. Acesse `http://localhost:5173/login`
2. Faça login com `admin@soareshub.com` / `Admin123!`
3. Vá para **Conversas** → Clique em uma conversa
4. Digite: "Olá, tenho interesse!"
5. Pressione **Enter**
6. ✅ Mensagem deve aparecer na bolha **verde** (enviada)

#### Teste 2: Recebimentovia Webhook (Simulado)
```bash
# Em um terminal, envie uma mensagem simulada
curl -X POST http://localhost:3000/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "key": { "remoteJid": "551199999999@s.whatsapp.net" },
    "pushName": "Cliente Teste",
    "message": { "conversation": "Quero informações sobre imóveis" }
  }'
```

7. ✅ Mensagem deve aparecer na bolha **cinza** (recebida) em < 5 segundos

#### Teste 3: Takeover (IA → Humano)
1. Com a conversa aberta, verifique se o botão **"Assumir"** está visível
2. Clique em **"Assumir"**
3. ✅ Status deve mudar para **"Ativa"**
4. ✅ Alerta de "Aguardando Humano" deve desaparecer

#### Teste 4: Latência (< 5 segundos)
1. Abra o **Console do navegador** (F12)
2. Enviamensagem e meça o tempo:
   - T0: Clica em Enviar
   - T1: Mensagem salva no Supabase (~300ms)
   - T2: Worker processa IA (~1500ms)
   - T3: Resposta salva no banco (~300ms)
   - T4: Supabase Realtime dispara (~100ms)
   - T5: React atualiza UI (~200ms)
3. ✅ **Total: ~2.4 segundos** (dentro do limite crítico!)

---

## 5. TESTES DE SEGURANÇA (RLS)

### Verificar Isolamento de Dados:

```sql
-- No SQL Editor do Supabase:

-- 1. Simular usuário de OUTRA organização
SET request.jwt.claims TO '{"sub": "user-from-other-org"}';

-- 2. Tentar acessar leads (deve retornar 0)
SELECT count(*) FROM leads;  -- Deve retornar 0!

-- 3. Resetar para usuário real
SET request.jwt.claims TO '{"sub": "seu-user-id-aqui"}';
```

✅ Se retornar 0, RLS está funcionando!

---

## 6. CHECKLIST DE EXECUÇÃO

### Testes Automatizados (Jest):
- [ ] Dependências instaladas (`npm install`)
- [ ] `npm test` executado com sucesso
- [ ] Cobertura mínima de 70% atingida

### Testes E2E (Cypress):
- [ ] `npm run cypress:open` funcionando
- [ ] Teste `chat.cy.ts` passando
- [ ] Mock de API via `cy.intercept()` funcionando

### Testes Manuais:
- [ ] Login funcionando
- [ ] Chat carregando mensagens
- [ ] Envio de mensagem (Enter)
- [ ] Recebimento via webhook
- [ ] Takeover (IA → Humano)
- [ ] Latência < 5 segundos
- [ ] Atualização em tempo real (Supabase Realtime)

### Testes de Segurança:
- [ ] RLS configurado e testado
- [ ] JWT enviado no header `Authorization`
- [ ] Isolamento de dados (organization_id)

---

## 7. PRÓXIMOS PASSOS APÓS TESTES

1. **Se todos os testes passarem:**
   - ✅ Chat está 100% funcional
   - Prossiga para **Opção 2: Configurar Evolution API**

2. **Se houver falhas:**
   - Verifique os logs no console
   - Corrija os bugs reportados
   - Execute os testes novamente

3. **O que fazer agora?**
   - Opção 2: Configurar Evolution API para envio real via WhatsApp
   - Opção 3: Implementar mais testes (aumentar cobertura)
   - Opção 4: Adicionar notificações push

---

**Data:** 02/05/2026  
**Versão:** 2.1 - Testes Implementados  
**Status:** Aguardando execução dos testes
