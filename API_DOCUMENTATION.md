# SOARES HUB CRM - Documentação da API

## Visão Geral

Base URL: `http://localhost:3000`

Todas as rotas (exceto webhooks e health) requerem autenticação Bearer Token.

---

## Autenticação

### POST /auth/login
Login de usuário.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "VENDEDOR",
    "organization": { ... }
  }
}
```

---

## Leads

### GET /leads
Lista todos os leads da organização.

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `stage` (optional): NOVO, QUALIFICADO, PROPOSTA, NEGOCIACAO, GANHO, PERDIDO
- `temperature` (optional): QUENTE, MORNO, FRIO
- `assignedToId` (optional): UUID do usuário

**Response:**
```json
{
  "leads": [
    {
      "id": "uuid",
      "stage": "QUALIFICADO",
      "score": 8,
      "temperature": "QUENTE",
      "deal_value": 50000,
      "contact": { ... },
      "assignedTo": { ... }
    }
  ]
}
```

### PATCH /leads/:id
Atualiza um lead.

**Body:**
```json
{
  "stage": "PROPOSTA",
  "score": 9,
  "temperature": "QUENTE",
  "notes": "Nota atualizada",
  "assignedToId": "uuid"
}
```

### POST /leads/:id/takeover
Solicita transferência para atendimento humano.

**Response:**
```json
{
  "success": true,
  "handover": { ... }
}
```

---

## Conversas

### GET /conversations
Lista conversas da organização.

**Query Params:**
- `channel` (optional): WHATSAPP, INSTAGRAM
- `status` (optional): ATIVA, FECHADA, AGUARDANDO_HUMANO

### GET /conversations/:id
Obtém detalhes de uma conversa específica.

### POST /conversations/:id/messages
Envia mensagem em uma conversa.

**Body:**
```json
{
  "content": "Olá, tudo bem?",
  "messageType": "text"
}
```

---

## Dashboard

### GET /dashboard/summary
Retorna métricas do dashboard.

**Response:**
```json
{
  "leadsQuentes": 15,
  "leadsMornos": 25,
  "leadsFrios": 40,
  "conversasAtivas": 12,
  "handoversPendentes": 3,
  "mensagensHoje": 45,
  "taxaConversao": "23.5",
  "faturamentoPrevisto": 75000
}
```

### GET /pipeline/analytics
Análise do pipeline de vendas.

**Response:**
```json
{
  "stages": [
    { "stage": "NOVO", "count": 50, "stagnant": 10, "isBottleneck": false },
    { "stage": "QUALIFICADO", "count": 20, "stagnant": 15, "isBottleneck": true }
  ],
  "summary": {
    "totalLeads": 100,
    "totalStagnant": 25,
    "bottlenecks": ["QUALIFICADO"],
    "healthScore": 75
  }
}
```

---

## Sequências

### GET /sequences
Lista todas as sequências.

### POST /sequences
Cria nova sequência.

**Body:**
```json
{
  "name": "Follow-up Frio",
  "trigger": "lead_cold_5days",
  "steps": [
    {
      "delayMinutes": 60,
      "messageTemplate": "Olá!",
      "channel": "WHATSAPP",
      "useAi": true,
      "aiPrompt": "Envie uma mensagem amigável"
    }
  ]
}
```

### POST /sequences/:id/enroll
Inscreve contatos em uma sequência.

**Body:**
```json
{
  "contactIds": ["uuid1", "uuid2"]
}
```

---

## Campanhas

### GET /campaigns
Lista campanhas.

### POST /campaigns
Cria campanha.

**Body:**
```json
{
  "name": "Campanha de Páscoa",
  "channel": "WHATSAPP",
  "segment": {
    "temperature": ["QUENTE"],
    "stage": ["QUALIFICADO"]
  },
  "aiPrompt": "Mensagem de follow-up",
  "scheduledAt": "2026-05-15T10:00:00Z"
}
```

### POST /campaigns/:id/send
Envia campanha para contatos específicos.

**Body:**
```json
{
  "contactIds": ["uuid1", "uuid2", "uuid3"]
}
```

---

## Mensagens Agendadas

### GET /scheduled-messages
Lista mensagens agendadas.

### POST /scheduled-messages
Cria mensagem agendada.

**Body:**
```json
{
  "contactId": "uuid",
  "content": "Lembrete: sua proposta...",
  "channel": "WHATSAPP",
  "scheduledAt": "2026-05-20T09:00:00Z"
}
```

### PATCH /scheduled-messages/:id/cancel
Cancela mensagem agendada.

---

## Instagram

### POST /instagram/job/prospect
Inicia job de mineração.

**Body:**
```json
{
  "target": "marketingdigital",
  "limit": 50
}
```

---

## WhatsApp

### POST /whatsapp/instance/create
Cria instância WhatsApp.

**Body:**
```json
{
  "name": "minha-instancia"
}
```

### GET /whatsapp/instance/connect/:name
Obtém QR Code para conexão.

---

## Agentes

### GET /agents
Lista agentes disponíveis.

**Response:**
```json
{
  "agents": [
    { "name": "Sales Agent", "description": "..." },
    { "name": "Support Agent", "description": "..." }
  ]
}
```

---

## Webhooks

### POST /webhook/evolution
Recebe mensagens do WhatsApp (Evolution API).

**Body (Evolution API v2.1):**
```json
{
  "key": { "remoteJid": "5511999999999@s.whatsapp.net" },
  "pushName": "João Silva",
  "message": { "conversation": "Olá, tudo bem?" },
  "instance": "evohorizonbr"
}
```

---

## Health Check

### GET /health
Verifica status do servidor.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-02T12:00:00Z",
  "version": "2.0.0",
  "features": ["multi-agent-orchestration", "pipeline-analytics"]
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|------------|
| 400 | Bad Request - Parâmetros inválidos |
| 401 | Unauthorized - Token inválido ou expirado |
| 403 | Forbidden - Acesso negado |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro no servidor |

---

## Rate Limiting

- **Default:** 100 requisições por minuto
- **Excedido:** Retorna 429 Too Many Requests