/**
 * SOARES HUB CRM — Worker de Mensagens (v2.0 Multi-Agentes)
 * 
 * Consome mensagens da fila BullMQ e processa através do
 * sistema multi-agentes com orquestração inteligente.
 * 
 * Fluxo:
 * 1. Recebe mensagem da fila
 * 2. Busca contexto completo no banco (conversa, lead, contato)
 * 3. Orquestra resposta via multi-agentes
 * 4. Salva resposta no banco
 * 5. Executa ações automáticas (score, stage, handover, etc.)
 * 6. Envia resposta via Evolution API
 */

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { orchestrate } = require('./agents/orchestrator');

const prisma = new PrismaClient();

const worker = new Worker('messageQueue', async (job) => {
  const { conversationId, messageContent } = job.data;

  console.log(`[Worker] Processando mensagem para conversa ${conversationId}`);

  try {
    // ─── 1. Buscar contexto completo ───
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        contact: true,
        lead: true,
        messages: {
          orderBy: { timestamp: 'asc' },
          take: 20, // Últimas 20 mensagens para contexto
        },
      },
    });

    if (!conversation) {
      console.error(`[Worker] Conversa ${conversationId} não encontrada`);
      return;
    }

    // Se IA não está ativa nesta conversa, não processar
    if (!conversation.isAiActive) {
      console.log(`[Worker] IA desativada para conversa ${conversationId}`);
      return;
    }

    // ─── 2. Montar histórico no formato OpenAI ───
    const conversationHistory = conversation.messages.map(msg => ({
      role: msg.fromMe ? 'assistant' : 'user',
      content: msg.content,
    }));

    // ─── 3. Buscar persona/contexto da organização ───
    let businessContext = '';
    if (conversation.contact?.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: conversation.contact.organizationId },
      });
      businessContext = org?.name || '';
    }

    // Determinar estágio atual do funil
    const currentFunnelStage = conversation.lead?.stage || 'NOVO';

    // ─── 4. Orquestrar resposta via multi-agentes ───
    const result = await orchestrate({
      message: messageContent,
      conversationHistory,
      contactName: conversation.contact?.name || 'Cliente',
      currentFunnelStage,
      businessContext,
    });

    // ─── 5. Salvar resposta da IA no banco ───
    await prisma.message.create({
      data: {
        content: result.response,
        fromMe: true,
        messageType: 'text',
        isAiGenerated: true,
        conversationId,
      },
    });

    // Atualizar última mensagem da conversa
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: result.response,
        lastMessageAt: new Date(),
      },
    });

    // ─── 6. Executar ações automáticas ───
    const { actions } = result;

    // 6a. Atualizar score e temperatura do lead
    if (conversation.lead && (actions.updateScore !== null || actions.updateLeadStage)) {
      const leadUpdate = {};
      
      if (actions.updateScore !== null) {
        leadUpdate.score = actions.updateScore;
      }
      if (actions.updateTemperature) {
        leadUpdate.temperature = actions.updateTemperature;
      }
      if (actions.updateLeadStage) {
        leadUpdate.stage = actions.updateLeadStage;
        console.log(`[Worker] Lead ${conversation.lead.id} → Stage: ${actions.updateLeadStage}`);
      }

      if (Object.keys(leadUpdate).length > 0) {
        await prisma.lead.update({
          where: { id: conversation.lead.id },
          data: leadUpdate,
        });
      }
    }

    // 6b. Auto-criar lead se não existe e lead está qualificado
    if (!conversation.lead && actions.isQualified) {
      const newLead = await prisma.lead.create({
        data: {
          stage: 'QUALIFICADO',
          score: actions.updateScore || 5,
          temperature: actions.updateTemperature || 'MORNO',
          contactId: conversation.contactId,
          organizationId: conversation.contact.organizationId,
        },
      });

      // Vincular lead à conversa
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { leadId: newLead.id },
      });

      console.log(`[Worker] Lead criado automaticamente: ${newLead.id}`);
    }

    // 6c. Processar handover
    if (actions.handover) {
      await prisma.handover.create({
        data: {
          reason: `Solicitado pelo Agente ${result.agent.name} (intent: ${result.classification.intent})`,
          conversationId,
          requestedBy: 'IA',
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'AGUARDANDO_HUMANO',
          isAiActive: false,
        },
      });

      console.log(`[Worker] Handover criado para conversa ${conversationId}`);
    }

    // ─── 7. Enviar resposta via Evolution API (WhatsApp) ───
    if (conversation.channel === 'WHATSAPP' && conversation.contact?.phoneNumber) {
      try {
        await axios.post(
          `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE || 'default'}`,
          {
            number: conversation.contact.phoneNumber,
            text: result.response,
          },
          {
            headers: { 'apikey': process.env.EVOLUTION_API_KEY },
          }
        );
        console.log(`[Worker] Mensagem enviada via WhatsApp para ${conversation.contact.phoneNumber}`);
      } catch (evoError) {
        console.error('[Worker] Erro ao enviar via Evolution:', evoError.message);
      }
    }

    // Log de métricas
    console.log(`[Worker] ✅ Processado em ${result.metrics.processingTimeMs}ms | Agente: ${result.agent.name} | Tokens: ${result.metrics.tokensUsed}`);

    return result;

  } catch (error) {
    console.error(`[Worker] ❌ Erro fatal ao processar conversa ${conversationId}:`, error);
    throw error; // BullMQ fará retry automático
  }
}, {
  connection: new IORedis(process.env.REDIS_URL || 'redis://localhost:6379'),
  concurrency: 5, // Processa até 5 mensagens em paralelo
});

// Event listeners para monitoramento
worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} concluído com sucesso`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} falhou: ${err.message}`);
});

worker.on('error', (err) => {
  console.error('[Worker] Erro no worker:', err.message);
});

console.log('🤖 Worker Multi-Agentes v2.0 iniciado | Concurrency: 5');