require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'default';

async function processScheduledMessages() {
  console.log('[Scheduled] Verificando mensagens agendadas...');

  const now = new Date();

  const pendingMessages = await prisma.scheduledMessage.findMany({
    where: {
      status: 'PENDING',
      scheduled_at: { lte: now }
    },
    include: {
      contact: true
    }
  });

  console.log(`[Scheduled] ${pendingMessages.length} mensagens para processar`);

  for (const msg of pendingMessages) {
    try {
      if (!msg.contact?.phone_number) {
        console.log(`[Scheduled] Contato sem telefone: ${msg.id}`);
        await prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: { status: 'FAILED' }
        });
        continue;
      }

      const response = await axios.post(
        `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
        {
          number: msg.contact.phone_number,
          text: msg.content
        },
        {
          headers: { 'apikey': EVOLUTION_API_KEY },
          timeout: 30000
        }
      );

      await prisma.scheduledMessage.update({
        where: { id: msg.id },
        data: {
          status: 'SENT',
          sent_at: new Date()
        }
      });

      let conversation = await prisma.conversation.findFirst({
        where: { contactId: msg.contact.id }
      });

      if (conversation) {
        await prisma.message.create({
          data: {
            content: msg.content,
            fromMe: true,
            messageType: 'text',
            isAiGenerated: false,
            conversationId: conversation.id
          }
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessage: msg.content,
            lastMessageAt: new Date()
          }
        });
      }

      console.log(`[Scheduled] Mensagem enviada: ${msg.id}`);

    } catch (error) {
      console.error(`[Scheduled] Erro ao enviar ${msg.id}:`, error.message);
      
      await prisma.scheduledMessage.update({
        where: { id: msg.id },
        data: { status: 'FAILED' }
      });
    }
  }

  console.log('[Scheduled] Verificação concluída');
}

async function cancelScheduledMessage(messageId) {
  const message = await prisma.scheduledMessage.findUnique({
    where: { id: messageId }
  });

  if (!message || message.status !== 'PENDING') {
    throw new Error('Mensagem não pode ser cancelada');
  }

  await prisma.scheduledMessage.update({
    where: { id: messageId },
    data: { status: 'CANCELLED' }
  });

  return { success: true };
}

module.exports = {
  processScheduledMessages,
  cancelScheduledMessage
};

if (require.main === module) {
  const runLoop = async () => {
    try {
      await prisma.$connect();
      console.log('[Scheduled] Conectado ao banco');

      setInterval(async () => {
        try {
          await processScheduledMessages();
        } catch (err) {
          console.error('[Scheduled] Erro:', err.message);
        }
      }, 30000);

      console.log('[Scheduled] Serviço iniciado (a cada 30s)');

    } catch (err) {
      console.error('[Scheduled] Erro fatal:', err);
      process.exit(1);
    }
  };

  runLoop();
}