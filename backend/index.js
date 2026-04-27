require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const { PrismaClient } = require('@prisma/client');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Inicializa Prisma
const prisma = new PrismaClient();

// Inicializa Redis para filas
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

// Fila para mensagens
const messageQueue = new Queue('messageQueue', {
  connection: redis,
});

// Registra plugins
fastify.register(cors, { 
  origin: true,
  credentials: true 
});

// ============================================
// MIDDLEWARE
// ============================================

// Autenticação JWT
fastify.decorate('authenticate', async function (request, reply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.status(401).send({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.user = decoded;
  } catch (err) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
});

// ============================================
// ROTAS DE AUTENTICAÇÃO
// ============================================

// Login
fastify.post('/auth/login', async (request, reply) => {
  const { email, password } = request.body;

  try {
    // Busca usuário no banco
    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true }
    });

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    // Gera token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        organizationId: user.organizationId 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization
      }
    };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Login failed' });
  }
});

// Registro (apenas ADMIN)
fastify.post('/auth/register', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { email, name, password, role, organizationId } = request.body;

  // Verifica se é admin
  if (request.user.role !== 'ADMIN') {
    return reply.status(403).send({ error: 'Only admins can create users' });
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: role || 'VENDEDOR',
        organizationId
      }
    });

    return { user };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Registration failed' });
  }
});

// ============================================
// ROTAS DE LEADS
// ============================================

// Listar leads
fastify.get('/leads', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { organizationId, stage, temperature, assignedToId } = request.query;

  try {
    const where = { organizationId };
    if (stage) where.stage = stage;
    if (temperature) where.temperature = temperature;
    if (assignedToId) where.assignedToId = assignedToId;

    const leads = await prisma.lead.findMany({
      where,
      include: {
        contact: true,
        assignedTo: true,
        conversations: {
          include: {
            messages: {
              orderBy: { timestamp: 'desc' },
              take: 1
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return { leads };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch leads' });
  }
});

// Atualizar lead
fastify.patch('/leads/:id', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { id } = request.params;
  const { stage, score, temperature, notes, assignedToId } = request.body;

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(stage && { stage }),
        ...(score !== undefined && { score }),
        ...(temperature && { temperature }),
        ...(notes !== undefined && { notes }),
        ...(assignedToId !== undefined && { assignedToId })
      },
      include: {
        contact: true,
        assignedTo: true
      }
    });

    return { lead };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to update lead' });
  }
});

// Handover - Humano assume a conversa
fastify.post('/leads/:id/takeover', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { id } = request.params;

  try {
    // Atualiza conversa para aguardando humano
    const conversation = await prisma.conversation.updateMany({
      where: { leadId: id },
      data: { 
        isAiActive: false,
        status: 'AGUARDANDO_HUMANO'
      }
    });

    // Cria registro de handover
    const handover = await prisma.handover.create({
      data: {
        reason: 'Handover solicitado pelo vendedor',
        status: 'PENDENTE',
        conversationId: conversation.id,
        requestedBy: 'HUMANO'
      }
    });

    return { success: true, handover };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to process handover' });
  }
});

// ============================================
// ROTAS DE CONVERSAS
// ============================================

// Listar conversas
fastify.get('/conversations', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { organizationId, channel, status } = request.query;

  try {
    const where = { contact: { organizationId } };
    if (channel) where.channel = channel;
    if (status) where.status = status;

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        contact: true,
        lead: true,
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 50
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    return { conversations };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch conversations' });
  }
});

// Obter conversa específica
fastify.get('/conversations/:id', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { id } = request.params;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        contact: true,
        lead: true,
        messages: {
          orderBy: { timestamp: 'asc' }
        },
        handovers: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    return { conversation };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch conversation' });
  }
});

// Enviar mensagem
fastify.post('/conversations/:id/messages', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { id } = request.params;
  const { content, messageType = 'text' } = request.body;

  try {
    // Busca conversa
    const conversation = await prisma.conversation.findUnique({
      where: { id }
    });

    if (!conversation) {
      return reply.status(404).send({ error: 'Conversation not found' });
    }

    // Cria mensagem
    const message = await prisma.message.create({
      data: {
        content,
        fromMe: true,
        messageType,
        isAiGenerated: false,
        conversationId: id
      }
    });

    // Atualiza última mensagem da conversa
    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessage: content,
        lastMessageAt: new Date()
      }
    });

    // Envia via Evolution API se for WhatsApp
    if (conversation.channel === 'WHATSAPP') {
      try {
        await axios.post(`${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_API_KEY}`, {
          number: conversation.contact.phoneNumber,
          text: content
        });
      } catch (evolutionError) {
        request.log.error('Evolution API error:', evolutionError);
      }
    }

    return { message };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to send message' });
  }
});

// ============================================
// ROTAS DE DASHBOARD
// ============================================

fastify.get('/dashboard/summary', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { organizationId } = request.query;

  try {
    // Contagem de leads por temperatura
    const [leadsQuentes, leadsMornos, leadsFrios] = await Promise.all([
      prisma.lead.count({ where: { organizationId, temperature: 'QUENTE' }}),
      prisma.lead.count({where: { organizationId, temperature: 'MORNO' }}),
      prisma.lead.count({where: { organizationId, temperature: 'FRIO' }})
    ]);

    // Conversas ativas
    const conversasAtivas = await prisma.conversation.count({
      where: { 
        contact: { organizationId },
        status: 'ATIVA'
      }
    });

    // Handovers pendentes
    const handoversPendentes = await prisma.handover.count({
      where: {
        conversation: { contact: { organizationId } },
        status: 'PENDENTE'
      }
    });

    // Mensagens de hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const mensagensHoje = await prisma.message.count({
      where: {
        timestamp: { gte: hoje }
      }
    });

    // Taxa de conversão (leads ganhos / total)
    const totalLeads = await prisma.lead.count({ where: { organizationId } });
    const leadsGanhos = await prisma.lead.count({
      where: { organizationId, stage: 'GANHO' }
    });
    const taxaConversao = totalLeads > 0 ? (leadsGanhos / totalLeads) * 100 : 0;

    // Faturamento previsto (soma dos leads em negociação/ganhos com valor estimado)
    // Por simplicidade, usando um valor fixo baseado nos leads
    const faturamentoPrevisto = leadsQuentes * 5000 + leadsMornos * 2000;

    return {
      leadsQuentes,
      leadsMornos,
      leadsFrios,
      conversasAtivas,
      handoversPendentes,
      mensagensHoje,
      taxaConversao: taxaConversao.toFixed(1),
      faturamentoPrevisto
    };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch dashboard' });
  }
});

// ============================================
// ROTAS DE WHATSAPP (Evolution API)
// ============================================

// Criar instância
fastify.post('/whatsapp/instance/create', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { name } = request.body;

  try {
    const response = await axios.post(
      `${process.env.EVOLUTION_API_URL}/instance/create`,
      { instanceName: name },
      { headers: { 'apikey': process.env.EVOLUTION_API_KEY } }
    );

    // Salva no banco
    const device = await prisma.userDevice.create({
      data: {
        userId: request.user.id,
        token: response.data.instance?.hash || ''
      }
    });

    return { device, instance: response.data };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to create instance' });
  }
});

// Conectar (obter QR Code)
fastify.get('/whatsapp/instance/connect/:name', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { name } = request.params;

  try {
    const response = await axios.get(
      `${process.env.EVOLUTION_API_URL}/instance/connect/${name}`,
      { headers: { 'apikey': process.env.EVOLUTION_API_KEY } }
    );

    return { qrcode: response.data };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to get QR code' });
  }
});

// Webhook da Evolution API
fastify.post('/webhook/evolution', async (request, reply) => {
  const { key, pushName, message } = request.body;

  try {
    // Extrai número do telefone
    const phoneNumber = key?.remoteJid?.replace('@s.whatsapp.net', '');

    if (!phoneNumber || !message) {
      return reply.send({ status: 'ignored' });
    }

    const messageText = message.conversation || message.extendedTextMessage?.text || '';
    if (!messageText) {
      return reply.send({ status: 'no_text' });
    }

    // Busca ou cria contato automaticamente
    let contact = await prisma.contact.findUnique({
      where: { phoneNumber }
    });

    if (!contact) {
      // Auto-criar contato com nome do push notification
      // Em produção, organizationId viria da configuração da instância Evolution
      const defaultOrg = await prisma.organization.findFirst();
      if (!defaultOrg) {
        return reply.send({ status: 'no_organization' });
      }

      contact = await prisma.contact.create({
        data: {
          name: pushName || `Lead ${phoneNumber}`,
          phoneNumber,
          source: 'whatsapp',
          tags: ['auto-captura', 'whatsapp'],
          organizationId: defaultOrg.id,
        }
      });
      console.log(`[Webhook] Novo contato criado: ${contact.name} (${phoneNumber})`);
    }

    // Cria ou busca conversa
    let conversation = await prisma.conversation.findFirst({
      where: { contactId: contact.id, status: { not: 'FECHADA' } }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          contactId: contact.id,
          channel: 'WHATSAPP',
          isAiActive: true
        }
      });
    }

    // Auto-criar lead se não existe
    const existingLead = await prisma.lead.findFirst({
      where: { contactId: contact.id, stage: { notIn: ['GANHO', 'PERDIDO'] } }
    });

    if (!existingLead) {
      const newLead = await prisma.lead.create({
        data: {
          stage: 'NOVO',
          score: 1,
          temperature: 'FRIO',
          contactId: contact.id,
          organizationId: contact.organizationId,
        }
      });

      // Vincular lead à conversa
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { leadId: newLead.id }
      });
      console.log(`[Webhook] Lead auto-criado para ${contact.name}`);
    }

    // Salva mensagem recebida
    await prisma.message.create({
      data: {
        content: messageText,
        fromMe: false,
        messageType: message.conversation ? 'text' : 'extendedTextMessage',
        conversationId: conversation.id
      }
    });

    // Atualiza última mensagem
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: messageText,
        lastMessageAt: new Date()
      }
    });

    // Adiciona à fila de processamento multi-agentes
    if (conversation.isAiActive) {
      await messageQueue.add('processMessage', {
        conversationId: conversation.id,
        messageContent: messageText,
      });
    }

    return reply.send({ status: 'received' });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Webhook processing failed' });
  }
});

// ============================================
// ROTAS DE INSTAGRAM
// ============================================

// Criar job de mineração
fastify.post('/instagram/job/prospect', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { target, limit = 50 } = request.body;

  try {
    // Chama microserviço Python
    const response = await axios.post(
      'http://localhost:8000/prospect',
      { target, limit }
    );

    return { job: response.data };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to start prospect job' });
  }
});

// ============================================
// ROTAS DE AGENTES IA
// ============================================

// Listar agentes disponíveis
fastify.get('/agents', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { listAgents } = require('./worker/agents/agentRegistry');
  return { agents: listAgents() };
});

// ============================================
// PIPELINE ANALYTICS (Detecção de Gargalos)
// ============================================

fastify.get('/pipeline/analytics', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { organizationId } = request.query;

  try {
    const stages = ['NOVO', 'QUALIFICADO', 'PROPOSTA', 'NEGOCIACAO', 'GANHO', 'PERDIDO'];

    const stageData = await Promise.all(
      stages.map(async (stage) => {
        const count = await prisma.lead.count({
          where: { organizationId, stage },
        });

        // Leads estagnados: sem atualização há mais de 3 dias
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const stagnant = await prisma.lead.count({
          where: {
            organizationId,
            stage,
            updatedAt: { lt: threeDaysAgo },
            stage: { notIn: ['GANHO', 'PERDIDO'] },
          },
        });

        return {
          stage,
          count,
          stagnant,
          isBottleneck: stagnant > count * 0.5 && count > 0,
        };
      })
    );

    // Tempo médio por estágio (simplificado)
    const totalLeads = stageData.reduce((sum, s) => sum + s.count, 0);
    const totalStagnant = stageData.reduce((sum, s) => sum + s.stagnant, 0);

    return {
      stages: stageData,
      summary: {
        totalLeads,
        totalStagnant,
        bottlenecks: stageData.filter(s => s.isBottleneck).map(s => s.stage),
        healthScore: totalLeads > 0
          ? Math.round(((totalLeads - totalStagnant) / totalLeads) * 100)
          : 100,
      },
    };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch pipeline analytics' });
  }
});

// ============================================
// ROTAS DE SEQUÊNCIAS DE FOLLOW-UP
// ============================================

// Listar sequências
fastify.get('/sequences', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  try {
    const sequences = await prisma.sequence.findMany({
      include: { steps: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return { sequences };
  } catch (error) {
    // Se tabela não existe ainda, retorna array vazio
    return { sequences: [] };
  }
});

// Criar sequência
fastify.post('/sequences', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { name, trigger, steps } = request.body;

  try {
    const sequence = await prisma.sequence.create({
      data: {
        name,
        trigger, // Ex: 'lead_cold_5days', 'no_reply_48h', 'post_qualification'
        isActive: true,
        steps: {
          create: steps.map((step, index) => ({
            order: index + 1,
            delayMinutes: step.delayMinutes,
            messageTemplate: step.messageTemplate,
            channel: step.channel || 'WHATSAPP',
            useAi: step.useAi || false,
            aiPrompt: step.aiPrompt || null,
          })),
        },
      },
      include: { steps: true },
    });

    return { sequence };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to create sequence' });
  }
});

// Ativar/Desativar sequência
fastify.patch('/sequences/:id/toggle', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { id } = request.params;

  try {
    const current = await prisma.sequence.findUnique({ where: { id } });
    if (!current) return reply.status(404).send({ error: 'Sequence not found' });

    const updated = await prisma.sequence.update({
      where: { id },
      data: { isActive: !current.isActive },
    });

    return { sequence: updated };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to toggle sequence' });
  }
});

// ============================================
// ROTAS DE CAMPANHAS
// ============================================

// Listar campanhas
fastify.get('/campaigns', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  try {
    const campaigns = await prisma.campanha.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { campaigns };
  } catch (error) {
    return { campaigns: [] };
  }
});

// Criar campanha
fastify.post('/campaigns', {
  preHandler: [fastify.authenticate]
}, async (request, reply) => {
  const { name, channel, segment, aiPrompt, scheduledAt } = request.body;

  try {
    const campaign = await prisma.campanha.create({
      data: {
        name,
        channel: channel || 'WHATSAPP',
        status: scheduledAt ? 'AGENDADA' : 'RASCUNHO',
        segment: segment || {},
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    return { campaign };
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ error: 'Failed to create campaign' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

fastify.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: ['multi-agent-orchestration', 'pipeline-analytics', 'auto-qualification']
  };
});

// ============================================
// INICIALIZAÇÃO
// ============================================

const start = async () => {
  try {
    // Testa conexão com banco
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Testa conexão com Redis
    await redis.ping();
    console.log('✅ Connected to Redis');

    // Inicia servidor
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  await fastify.close();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

start();