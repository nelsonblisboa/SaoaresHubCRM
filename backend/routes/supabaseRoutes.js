const supabaseService = require('../services/supabaseService');

// Plugin Fastify para rotas do Supabase
async function supabaseRoutes(fastify, options) {
  
  // Obter leads com Supabase
  fastify.get('/supabase/leads', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { organizationId } = request.query;
      
      const { data, error } = await supabaseService.client
        .from('leads')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      request.log.error('Error fetching leads from Supabase:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch leads',
        error: error.message
      });
    }
  });

  // Criar lead com Supabase
  fastify.post('/supabase/leads', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { contactId, stage, score, temperature, organizationId } = request.body;
      
      const { data, error } = await supabaseService.client
        .from('leads')
        .insert({
          contact_id: contactId,
          stage,
          score,
          temperature,
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, message: 'Lead created successfully', data };
    } catch (error) {
      request.log.error('Error creating lead in Supabase:', error);
      return reply.status(500).send({
        success: false,
        message: 'Failed to create lead',
        error: error.message
      });
    }
  });

  // Testar conexão com Supabase
  fastify.get('/supabase/test', async (request, reply) => {
    try {
      const { data, error } = await supabaseService.client
        .from('profiles')
        .select('id, email')
        .limit(1);
      
      if (error) throw error;
      
      return {
        success: true,
        message: 'Conexão com Supabase bem-sucedida',
        data
      };
    } catch (error) {
      request.log.error('Supabase connection error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Falha na conexão com Supabase',
        error: error.message
      });
    }
  });
}

module.exports = supabaseRoutes;