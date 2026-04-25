const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { processMessage } = require('./aiProcessor');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const worker = new Worker('messageQueue', async (job) => {
  const { message, conversationId } = job.data;

  const result = await processMessage(message);

  // Salvar resposta no banco
  await prisma.message.create({
    data: {
      content: result.response,
      fromMe: true,
      isAiGenerated: true,
      conversationId,
    },
  });

  if (result.handover) {
    // Criar handover
    await prisma.handover.create({
      data: {
        reason: 'Solicitado pela IA',
        conversationId,
        requestedBy: 'IA',
      },
    });

    // Atualizar conversa
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'AGUARDANDO_HUMANO' },
    });
  }

  return result;
}, {
  connection: new IORedis(process.env.REDIS_URL || 'redis://localhost:6379'),
});

console.log('Worker de IA iniciado');