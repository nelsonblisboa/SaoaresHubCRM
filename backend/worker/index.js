/**
 * SOARES HUB CRM — Worker de Mensagens (v2.1 Multi-Agentes + Transações)
 * 
 * Consome mensagens da fila BullMQ e processa através do
 * sistema multi-agentes com orquestração inteligente.
 * 
 * Fluxo Transacional:
 * 1. Recebe mensagem da fila
 * 2. Busca contexto completo no banco (conversa, lead, contato)
 * 3. Orquestra resposta via multi-agentes
 * 4. Executa ações automáticas (score, stage, handover, etc.)
 * 5. Salva resposta no banco (transação)
 * 6. Envia resposta via Evolution API (fora da transação)
 */

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { orchestrate } = require('./agents/orchestrator');

const prisma = new PrismaClient();

/**
 * Processa mensagem com transação do Prisma para garantir consistência
 */
async function processMessageWithTransaction(conversationId, messageContent, conversation, result) {
  /**
   * Transação única para todas as operações de banco:
   * - Criar mensagem da IA
   * - Atualizar última mensagem da conversa
   * - Atualizar lead (score, temperatura, stage)
   * - Criar novo lead se necessário
   * - Vincular lead à conversa
   * - Criar handover se necessário
   * - Atualizar status da conversa
   */
  return await prisma.$transaction(async (tx) => {
    const updates = {};
    let leadId = conversation.lead?.id;
    let newLead = null;

    // 1. Salvar resposta da IA no banco
    const aiMessage = await tx.message.create({
      data: {
        content: result.response,
        fromMe: true,
        messageType: 'text',
        isAiGenerated: true,
        agentKey: result.agent?.name || 'IA',
        conversationId,
      },
    });
    updates.aiMessageId = aiMessage.id;

    // 2. Atualizar última mensagem da conversa
    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: result.response,
        lastMessageAt: new Date(),
      },
    });

    // 3. Executar ações automáticas
    const { actions } = result;

    // 3a. Atualizar score e temperatura do lead
    if (conversation.lead && (actions.updateScore !== null || actions.updateLeadStage || actions.updateTemperature)) {
      const leadUpdate = {};
      
      if (actions.updateScore !== null) {
        leadUpdate.score = actions.updateScore;
      }
      if (actions.updateTemperature) {
        leadUpdate.temperature = actions.updateTemperature;
      }
      if (actions.updateLeadStage) {
        leadUpdate.stage = actions.updateLeadStage;
      }

      if (Object.keys(leadUpdate).length > 0) {
        await tx.lead.update({
          where: { id: conversation.lead.id },
          data: leadUpdate,
        });
      }
    }

    // 3b. Auto-criar lead se não existe e lead está qualificado
    if (!conversation.lead && actions.isQualified) {
      newLead = await tx.lead.create({
        data: {
          stage: 'QUALIFICADO',
          score: actions.updateScore || 5,
          temperature: actions.updateTemperature || 'MORNO',
          contactId: conversation.contactId,
          organizationId: conversation.contact.organizationId,
        },
      });
      leadId = newLead.id;

      // Vincular lead à conversa
      await tx.conversation.update({
        where: { id: conversationId },
        data: { leadId: newLead.id },
      });
    }

    // 3c. Processar handover
    if (actions.handover) {
      await tx.handover.create({
        data: {
          reason: `Solicitado pelo Agente ${result.agent?.name || 'IA'} (intent: ${result.classification?.intent || 'unknown'})`,
          conversationId,
          requestedBy: 'IA',
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'AGUARDANDO_HUMANO',
          isAiActive: false,
        },
      });
    }

    return { ...updates, leadId, newLead };
  }, {
    maxWait: 5000, // Tempo máximo esperando por conexão
    timeout: 10000, // Timeout da transação
  });
}

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
      businessContext = org?.persona || '';
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

    // ─── 5. Salvar no banco (TRANSAÇÃO) ───
    const transactionResult = await processMessageWithTransaction(
      conversationId,
      messageContent,
      conversation,
      result
    );

    console.log(`[Worker] Transação concluída | Lead: ${transactionResult.leadId || 'N/A'}`);

    // ─── 6. Enviar resposta via Evolution API (WhatsApp) ───
    // Fora da transação para não bloquear o banco
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
        // Não relança o erro - a transação já foi commitada
        // Isso garante que o banco está consistente mesmo se o WhatsApp falhar
      }
    }

    // Log de métricas
    console.log(`[Worker] ✅ Processado em ${result.metrics?.processingTimeMs || 'N/A'}ms | Agente: ${result.agent?.name || 'N/A'} | Tokens: ${result.metrics?.tokensUsed || 'N/A'}`);
    
    return result;

  } catch (error) {
    console.error(`[Worker] ❌ Erro fatal ao processar conversa ${conversationId}:`, error);
    throw error; // BullMQ fará retry automático
  }
}, {
  connection: new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
  }),
  concurrency: 5,
  limiter: {
    max: 10,
    duration: 1000,
  },
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

console.log('🤖 Worker Multi-Agentes v2.1 iniciado | Concurrency: 5 | Transações: ON');
