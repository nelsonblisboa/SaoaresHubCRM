const fastify = require('fastify')({ logger: true });
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Fila para mensagens
const messageQueue = new Queue('messageQueue', {
  connection: new IORedis(process.env.REDIS_URL || 'redis://localhost:6379'),
});

// Endpoint para simular handover
fastify.post('/leads/:id/takeover', async (request, reply) => {
  const { id } = request.params;
  // Simular atualização no banco
  console.log(`Handover solicitado para lead ${id}`);
  reply.send({ success: true, message: 'Handover iniciado' });
});

// Endpoint para dashboard KPIs estáticos
fastify.get('/dashboard/summary', async (request, reply) => {
  reply.send({
    leadsQuentes: 7,
    conversasAtivas: 12,
    taxaConversao: 23.5,
    faturamentoPrevisto: 54000,
    handoversPendentes: 3,
    mensagensHoje: 345
  });
});

// Webhook simulado para Evolution API
fastify.post('/webhook/evolution', async (request, reply) => {
  const { message, conversationId } = request.body;
  await messageQueue.add('processMessage', { message, conversationId });
  reply.send({ status: 'queued' });
});

module.exports = fastify;