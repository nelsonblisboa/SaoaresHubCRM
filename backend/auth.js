const rateLimit = require('fastify-rate-limit');

fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

// Middleware de autenticação JWT
fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET
});

fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// Aplicar autenticação em rotas protegidas
fastify.get('/leads', { preHandler: fastify.authenticate }, async (request, reply) => {
  // Lógica para retornar leads
  reply.send({ leads: [] });
});