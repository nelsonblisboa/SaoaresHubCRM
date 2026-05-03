require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

async function processSequenceStep(enrollment, sequence, step) {
  const contactId = enrollment.contact_id;
  const organizationId = sequence.organization_id;

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: { organization: true }
  });

  if (!contact || !contact.phone_number) {
    console.log(`[Sequences] Contato não encontrado ou sem telefone: ${contactId}`);
    return false;
  }

  let messageContent = '';

  if (step.use_ai) {
    try {
      const response = await axios.post(
        `${process.env.OPENROUTER_API_URL}/chat/completions`,
        {
          model: process.env.AI_MODEL || 'meta-llama/llama-3.1-8b-instruct',
          messages: [
            {
              role: 'system',
              content: `Você é assistente virtual da ${contact.organization?.name || 'Empresa'}. ${contact.organization?.persona || ''}`
            },
            {
              role: 'user',
              content: step.ai_prompt || 'Envie uma mensagem de follow-up'
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      messageContent = response.data.choices?.[0]?.message?.content || '';
    } catch (aiError) {
      console.error('[Sequences] Erro ao gerar mensagem IA:', aiError.message);
      messageContent = step.message_template || 'Olá! Gostaria de entrar em contato.';
    }
  } else {
    messageContent = step.message_template || 'Olá! Gostaria de entrar em contato.';
  }

  try {
    const conversation = await prisma.conversation.findFirst({
      where: { contactId },
      orderBy: { createdAt: 'desc' }
    });

    if (conversation) {
      await axios.post(
        `${EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE || 'default'}`,
        {
          number: contact.phone_number,
          text: messageContent
        },
        {
          headers: { 'apikey': EVOLUTION_API_KEY }
        }
      );

      await prisma.message.create({
        data: {
          content: messageContent,
          fromMe: true,
          messageType: 'text',
          isAiGenerated: step.use_ai,
          conversationId: conversation.id
        }
      });
    }

    return true;
  } catch (sendError) {
    console.error('[Sequences] Erro ao enviar mensagem:', sendError.message);
    return false;
  }
}

async function checkAndProcessSequences() {
  console.log('[Sequences] Verificando sequências ativas...');

  const now = new Date();

  const enrollments = await prisma.sequenceEnrollment.findMany({
    where: {
      status: 'ACTIVE',
      next_run_at: { lte: now }
    },
    include: {
      sequence: {
        include: { steps: { orderBy: { order: 'asc' } } }
      },
      contact: true
    }
  });

  console.log(`[Sequences] ${enrollments.length} enrollments para processar`);

  for (const enrollment of enrollments) {
    const { sequence } = enrollment;
    const currentStepIndex = enrollment.current_step - 1;
    const currentStep = sequence.steps[currentStepIndex];

    if (!currentStep) {
      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'COMPLETED', completed_at: new Date() }
      });
      console.log(`[Sequences] Sequência ${sequence.id} concluída`);
      continue;
    }

    const success = await processSequenceStep(enrollment, sequence, currentStep);

    if (success) {
      const nextStepIndex = currentStepIndex + 1;
      const nextStep = sequence.steps[nextStepIndex];

      if (nextStep) {
        const nextRunAt = new Date(Date.now() + nextStep.delay_minutes * 60 * 1000);
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: {
            current_step: nextStepIndex + 1,
            next_run_at: nextRunAt
          }
        });
      } else {
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { status: 'COMPLETED', completed_at: new Date() }
        });
      }
    } else {
      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'FAILED' }
      });
    }
  }

  console.log('[Sequences] Verificação concluída');
}

async function triggerSequence(sequenceId, contactIds) {
  const sequence = await prisma.sequence.findUnique({
    where: { id: sequenceId },
    include: { steps: { orderBy: { order: 'asc' } } }
  });

  if (!sequence || !sequence.is_active) {
    throw new Error('Sequência não encontrada ou inativa');
  }

  for (const contactId of contactIds) {
    const existing = await prisma.sequenceEnrollment.findFirst({
      where: {
        sequence_id: sequenceId,
        contact_id: contactId,
        status: { in: ['ACTIVE', 'PENDING'] }
      }
    });

    if (existing) continue;

    const firstStep = sequence.steps[0];
    const nextRunAt = firstStep 
      ? new Date(Date.now() + firstStep.delay_minutes * 60 * 1000)
      : new Date();

    await prisma.sequenceEnrollment.create({
      data: {
        sequence_id: sequenceId,
        contact_id: contactId,
        current_step: 1,
        status: 'ACTIVE',
        next_run_at: nextRunAt
      }
    });
  }

  return { success: true, enrolled: contactIds.length };
}

async function autoEnrollLeads() {
  console.log('[Sequences] Verificando enrollment automático...');

  const triggers = [
    { trigger: 'new_lead', condition: { stage: 'NOVO', created_at: { gte: new Date(Date.now() - 24*60*60*1000) } } },
    { trigger: 'lead_cold_5days', condition: { temperature: 'FRIO', updated_at: { lte: new Date(Date.now() - 5*24*60*60*1000) } } },
    { trigger: 'no_reply_48h', condition: { stage: { in: ['QUALIFICADO', 'PROPOSTA'] } } }
  ];

  for (const { trigger, condition } of triggers) {
    const sequences = await prisma.sequence.findMany({
      where: { trigger, is_active: true }
    });

    const leads = await prisma.lead.findMany({
      where: { ...condition, is_deleted: false },
      include: { contact: true }
    });

    for (const sequence of sequences) {
      for (const lead of leads) {
        await triggerSequence(sequence.id, [lead.contact_id]);
      }
    }
  }
}

module.exports = {
  checkAndProcessSequences,
  triggerSequence,
  autoEnrollLeads
};

if (require.main === module) {
  const runLoop = async () => {
    try {
      await prisma.$connect();
      console.log('[Sequences] Conectado ao banco');

      setInterval(async () => {
        try {
          await checkAndProcessSequences();
          await autoEnrollLeads();
        } catch (err) {
          console.error('[Sequences] Erro na execução:', err.message);
        }
      }, 60000);

    } catch (err) {
      console.error('[Sequences] Erro fatal:', err);
      process.exit(1);
    }
  };

  runLoop();
}