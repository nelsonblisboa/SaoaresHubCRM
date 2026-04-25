SOARES HUB CRM — Documentação Técnica de Design e Estrutura do Sistema v2.0
Objetivo: Fornecer especificações completas para implementação full‑stack de um CRM mobile‑first focado em vendas inbound/outbound via WhatsApp e Instagram, com orquestração centralizada no Apache Airflow e persistência no Supabase.

1. Visão Geral e Propósito
O SOARES HUB é um CRM de vendas multicanal que coloca o foco total no que realmente importa: conversão. Diferente de dashboards genéricos de gestão de projetos, aqui cada tela, cada métrica e cada ação convergem para uma única pergunta — Quantas vendas eu posso fechar hoje?.

Para isso, o sistema divide responsabilidades:

Apache Airflow atua como maestro assíncrono: minera novos leads no Instagram, dispara campanhas de aquecimento no WhatsApp, recalcula scores de lead periodicamente e aciona alertas de handover.

Supabase (PostgreSQL + APIs nativas) armazena e serve dados em tempo real, garantindo que o frontend reaja instantaneamente a novas mensagens e mudanças de pipeline.

Motor de IA qualifica conversas em tempo real e prepara resumos para o vendedor humano, sempre respeitando a filosofia de presença leve e fechamento humano.

2. Arquitetura de Alto Nível
text
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│   React App   │◄──────►│ Node.js/      │◄──────►│  Supabase     │
│ (mobile‑first)│        │ Fastify API   │        │ (PostgreSQL)  │
└───────┬───────┘        └───────┬───────┘        └───────────────┘
        │                        │
        │ WebSocket              │ HTTP/REST
        └────────────────────────┤
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                       Orquestração                               │
│                 ┌──────────────┴──────────────┐                  │
│                 │      Apache Airflow         │                  │
│                 │  • Mineracão Instagram      │                  │
│                 │  • Campanhas WhatsApp       │                  │
│                 │  • Lead Scoring recursivo   │                  │
│                 │  • Handover triggers        │                  │
│                 └──────────────────────────────┘                  │
└───────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
┌───────────────┐              ┌───────────────┐
│ Evolution API │              │ Instagram     │
│ (WhatsApp)    │              │ Service       │
└───────────────┘              └───────────────┘
Toda comunicação assíncrona (webhooks, jobs demorados, campanhas em massa) passa pelo Airflow, que garante retry automático, logging e monitoramento. A API Node.js recebe apenas chamadas síncronas do frontend e webhooks leves que precisam de resposta imediata.

3. Modelagem de Dados no Supabase
O Supabase fornece PostgreSQL gerenciado com Realtime (websockets nativos) e Row Level Security. Utilizamos o Prisma como ORM no backend Node.js, mas também podemos consumir diretamente a API do Supabase quando necessário.

3.1 Esquema Principal (Prisma)
prisma
model Organization {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  users     User[]
  contacts  Contact[]
  leads     Lead[]
}

model User {
  id             String       @id @default(uuid())
  email          String       @unique
  name           String
  role           Role         @default(VENDEDOR)
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  assignedLeads  Lead[]
  devices        UserDevice[]
}

model Contact {
  id               String        @id @default(uuid())
  name             String?
  phoneNumber      String?       @unique
  instagramUsername String?      @unique
  tags             String[]
  source           String?       // whatsapp, instagram, manual
  organizationId   String
  organization     Organization  @relation(fields: [organizationId], references: [id])
  leads            Lead[]
  conversations    Conversation[]
  createdAt        DateTime      @default(now())
}

model Lead {
  id             String        @id @default(uuid())
  stage          LeadStage     @default(NOVO)
  score          Int           @default(0)
  temperature    Temperature   @default(FRIO)
  notes          String?
  contactId      String
  contact        Contact       @relation(fields: [contactId], references: [id])
  assignedToId   String?
  assignedTo     User?         @relation(fields: [assignedToId], references: [id])
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  conversations  Conversation[]
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
}

model Conversation {
  id             String             @id @default(uuid())
  status         ConversationStatus @default(ATIVA)
  channel        Channel
  isAiActive     Boolean            @default(true)
  lastMessage    String?
  lastMessageAt  DateTime?
  contactId      String
  contact        Contact            @relation(fields: [contactId], references: [id])
  leadId         String?
  lead           Lead?              @relation(fields: [leadId], references: [id])
  messages       Message[]
  handovers      Handover[]
  createdAt      DateTime           @default(now())
}

model Message {
  id             String       @id @default(uuid())
  content        String
  fromMe         Boolean
  messageType    String       // text, image, audio
  isAiGenerated  Boolean      @default(false)
  timestamp      DateTime     @default(now())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
}

model Handover {
  id             String              @id @default(uuid())
  reason         String
  status         HandoverStatus      @default(PENDENTE)
  conversationId String
  conversation   Conversation        @relation(fields: [conversationId], references: [id])
  requestedBy    String              // "IA" ou "HUMANO"
  resolvedAt     DateTime?
  createdAt      DateTime            @default(now())
}

model Campanha {
  id             String       @id @default(uuid())
  nome           String
  canal          Channel
  segmento       Json?        // filtros de contatos
  status         String       @default("rascunho")
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  createdAt      DateTime     @default(now())
}

// Enums
enum Role { ADMIN, GERENTE, VENDEDOR, OPERADOR_IA }
enum LeadStage { NOVO, QUALIFICADO, PROPOSTA, NEGOCIACAO, GANHO, PERDIDO }
enum Temperature { FRIO, MORNO, QUENTE }
enum ConversationStatus { ATIVA, AGUARDANDO_HUMANO, FECHADA }
enum HandoverStatus { PENDENTE, ACEITO, CONCLUIDO }
enum Channel { WHATSAPP, INSTAGRAM }
3.2 Realtime do Supabase
O frontend assina canais de mudanças nas tabelas Conversation, Message e Lead via Supabase Realtime (WebSocket nativo do PostgreSQL). Isso elimina a necessidade de um servidor WebSocket separado para atualizações de dados.

4. Especificação do Backend (Node.js + Fastify)
4.1 Endpoints Principais
Autenticação (JWT gerenciado pelo Supabase)
POST /auth/login

POST /auth/register (apenas ADMIN)

WhatsApp (proxy para Evolution API)
POST /whatsapp/instance/create → Cria instância no Evolution e salva no banco.

GET /whatsapp/instance/connect/:name → Retorna QR Code.

POST /webhook/evolution → Recebe eventos, valida assinatura e despacha para fila de IA.

CRM / Vendas
GET /leads?organizationId=... → Retorna todos os leads, com filtros por temperature, stage, assignedTo.

PATCH /leads/:id → Atualiza estágio, score, temperatura (acionado tanto pelo Airflow quanto manualmente).

POST /leads/:id/takeover → Humano assume conversa, desativa IA e cria registro de Handover.

Dashboard (KPIs de Vendas)
GET /dashboard/summary?organizationId=...

json
{
  "leadsQuentes": 7,
  "conversasAtivas": 12,
  "taxaConversao": 23.5,
  "faturamentoPrevisto": 54000,
  "handoversPendentes": 3,
  "mensagensHoje": 345
}
Instagram (comandos para Airflow)
POST /instagram/job/prospect → Cria um job que o Airflow consumirá, evitando chamadas diretas de longa duração.

4.2 Processamento de Mensagens com IA (Worker)
O webhook do WhatsApp insere a mensagem na fila BullMQ. Um worker consome a fila e chama a OpenAI (ou Groq). Após gerar a resposta, ele a envia de volta via Evolution API. Se o LLM retornar a flag HANDOVER, o worker atualiza o lead para AGUARDANDO_HUMANO e notifica o frontend via Supabase Realtime (ou push notification).

5. Orquestração com Apache Airflow (O Maestro)
O Airflow é o cérebro que executa todas as tarefas assíncronas, permitindo que o backend Node.js permaneça leve e reativo. Definimos DAGs (Directed Acyclic Graphs) para cada processo de negócio.

5.1 DAG 1: Mineração de Leads no Instagram (daily)
python
# dag_mineracao_instagram.py
@dag(schedule_interval='@daily', start_date=datetime(2024,1,1))
def minerar_leads_instagram():
    @task
    def listar_seguidores_concorrente(target, limit):
        # Chama microsserviço Python (instagrapi)
        ...
    @task
    def filtrar_e_armazenar(seguidores):
        # Filtra por biografia, localização, etc.
        # Insere no Supabase como novos Contacts
        ...
    @task
    def seguir_e_engajar(contatos):
        # Realiza follow/like com delays randômicos
        ...
    seguidores = listar_seguidores_concorrente('concorrente_x', 50)
    contatos = filtrar_e_armazenar(seguidores)
    seguir_e_engajar(contatos)
5.2 DAG 2: Campanha Outbound WhatsApp (triggered by schedule)
python
# dag_campanha_whatsapp.py
@dag(schedule_interval='0 9 * * 1-5', start_date=...)
def campanha_aquecimento_mornos():
    @task
    def selecionar_contatos(segmento):
        # Query no Supabase: leads MORNOS, última interação > 3 dias
        ...
    @task(max_active_tis=5)  # paralelismo controlado
    def enviar_mensagem_individual(contato):
        # Envia via Evolution API com delay humanizado
        # Registra o envio na tabela Message
        ...
    contatos = selecionar_contatos({"temperature": "MORNO", "channel": "WHATSAPP"})
    enviar_mensagem_individual.expand(contatos=contatos)  # Dynamic Task Mapping
5.3 DAG 3: Lead Scoring Recorrente (hourly)
python
@dag(schedule_interval='@hourly')
def recalcular_scores():
    @task
    def processar_leads_ativos():
        # Para cada lead ATIVO, calcula score baseado em:
        # - Número de mensagens nas últimas 24h
        # - Palavras-chave detectadas ("preço", "prazo")
        # - Engajamento no Instagram (curtidas, comentários)
        # Atualiza o campo 'score' e recalcula 'temperature'
        ...
5.4 DAG 4: Handover Automático e Notificações
python
@dag(schedule_interval='*/10 * * * *')
def monitorar_handovers():
    @task
    def detectar_leads_estagnados():
        # Conversas AGUARDANDO_HUMANO há mais de 15 minutos
        # Dispara notificação push para gerente
        ...
Por que Airflow? Ele resolve o problema de retry em falhas, logging centralizado e permite que as regras de negócio sejam versionadas como código, sem poluir o backend de APIs com lógica assíncrona complexa.

6. Frontend e o Dashboard CRM (KPIs de Vendas)
A interface segue o design system definido anteriormente (Clean UI, Tailwind, Shadcn/UI). Porém, o foco agora é 100% CRM de Vendas. Nada de "Total Projects", "Completed Projects" ou gráficos genéricos de receita.

6.1 Tela Principal: Dashboard de Vendas
text
┌───────────────────────────────────────────────┐
│  Olá, João!  Hoje, 23 Abr 2026                │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│ │ Leads   │ │Conversas│ │ Taxa de │ │Previs.│ │
│ │ Quentes │ │ Ativas  │ │Convers. │ │  de   │ │
│ │   7     │ │   12    │ │  23.5%  │ │  R$   │ │
│ │ ↑ 2     │ │ 3 novas │ │ ↓ 1.2%  │ │ 54k   │ │
│ └─────────┘ └─────────┘ └─────────┘ └───────┘ │
│                                               │
│  ⚠ Handovers Pendentes (3)                    │
│  ┌──────────────────────────────────────────┐ │
│  │ Maria Silva - WhatsApp - Aguard. há 5min  │ │
│  │ João Pedro  - Instagram - Aguard. há 12m │ │
│  └──────────────────────────────────────────┘ │
│                                               │
│  🔥 Leads Quentes Agora                       │
│  ┌──────────────────────────────────────────┐ │
│  │ Ana Costa - Orçamento mencionado          │ │
│  │ Carlos Lima - Prazo < 7 dias              │ │
│  └──────────────────────────────────────────┘ │
│                                               │
│  📊 Comparativo Semanal (Gráfico de barras)   │
│  [ Leads Gerados ] [ Conversões ] [ Perdidos ]│
└───────────────────────────────────────────────┘
Hierarquia visual:

Top cards: os 4 KPIs mais importantes, coloridos por urgência (verde para taxa conversão, vermelho para handovers pendentes quando > 5).

Lista de handovers: prioriza a ação imediata do vendedor.

Leads quentes: cards com atalho para assumir conversa.

Gráfico semanal: permite ao gerente visualizar tendências.

6.2 Outras Telas do Sistema
Lista de Conversas: com filtros por canal (WhatsApp / Instagram) e status (IA ativa, Aguardando humano, Fechada). Ordenação por última mensagem ou temperatura do lead.

Chat Individual: interface de mensagens com indicador claro de quando a IA está digitando, botão "Assumir" e resumo de contexto IA logo abaixo do cabeçalho.

Pipeline Kanban: colunas (Novo, Qualificação, Proposta, Fechamento) com cards arrastáveis. Cada card exibe score e temperatura, permitindo ao vendedor mover manualmente ou o sistema mover automaticamente via Airflow.

Configurações: perfil do usuário, preferências de notificação, integração de canais (conectar WhatsApp via QR Code).

Relatórios (apenas Gerentes): gráficos avançados de desempenho do time, tempo médio de resposta, taxa de handover resolvido.

7. Biblioteca de Componentes Específicos do CRM
Componente	Tipo	Descrição
LeadCard	Molécula	Exibe avatar, nome, última mensagem, badge de temperatura (🔥 quente, 🌡️ morno, ❄️ frio) e canal.
HandoverAlert	Molécula	Barra chamativa com contagem regressiva e botão "Assumir".
ChatBubble	Átomo	Diferencia mensagens IA (fundo azul claro, badge "IA") de humano (fundo cinza).
KanbanColumn	Organismo	Coluna do pipeline com contador de leads.
MetricCard	Molécula	Card de KPI com valor grande, label e indicador de variação (seta verde/vermelha).
TemperatureBadge	Átomo	Cápsula colorida (cinza, laranja, vermelho) representando frio, morno, quente.
AIActiveIndicator	Átomo	Ícone animado de "IA digitando" ou "IA pausada".
8. Stack Tecnológica Consolidada
Camada	Tecnologia	Versão	Responsabilidade
Frontend	React + TypeScript	18+	SPA mobile‑first
Vite	5+	Build tool
Tailwind CSS	3+	Design system utilitário
Shadcn/UI	latest	Componentes acessíveis
TanStack Query	5+	Gerenciamento de estado do servidor
Supabase JS Client	latest	Realtime subscriptions e queries
Backend API	Node.js + Fastify	20 LTS	APIs REST e WebSocket
Prisma	5+	ORM
BullMQ	latest	Fila de processamento de IA
Orquestrador	Apache Airflow	2.9+	DAGs de campanhas, mineração, scoring
Banco de Dados	Supabase (PostgreSQL 15)	managed	Persistência, Realtime, Auth
Cache/Fila	Redis (embutido no BullMQ)	7+	Fila de mensagens
WhatsApp	Evolution API	latest	Gerenciamento de sessões WhatsApp
Instagram	Microserviço Python (FastAPI + instagrapi)	3.11	Automação de interações
IA	OpenAI GPT‑4o / Groq Llama 3	-	Atendimento e qualificação
Infraestrutura	Docker + Docker Compose	latest	Ambiente de desenvolvimento
Nginx	latest	Proxy reverso e SSL
9. Roteiro de Implementação (Roadmap Revisado)
Fase 1 — Fundação (Semanas 1‑2)

Provisionar projeto Supabase, aplicar schema Prisma.

Subir Evolution API e backend Fastify.

Implementar endpoints básicos e webhook do WhatsApp.

Subir Airflow com DAG vazia de teste.

Fase 2 — Motor de IA e Handover (Semanas 3‑4)

Configurar worker BullMQ com integração OpenAI.

Implementar lógica de handover e notificações.

Dashboard inicial com KPIs estáticos.

Fase 3 — Frontend CRM (Semanas 5‑6)

Desenvolver telas: Dashboard, Lista de Conversas, Chat, Kanban.

Conectar Supabase Realtime para atualizações instantâneas.

Implementar componentes de IA indicator e take‑over.

Fase 4 — Orquestração com Airflow (Semanas 7‑8)

DAG de mineração Instagram (microserviço Python).

DAG de campanhas outbound WhatsApp.

DAG de scoring automático de leads.

Testes de integração: fluxo completo inbound/outbound.

Fase 5 — Ajustes e Produção (Semanas 9‑10)

Otimizações de performance e segurança (LGPD).

Monitoramento do Airflow (alertas de falha).

Testes de usabilidade e deploy.