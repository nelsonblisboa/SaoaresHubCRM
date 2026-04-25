const { openrouter, DEFAULT_MODEL } = require('../lib/openrouter');

async function processMessage(message, conversationHistory = [], contactName = 'Cliente') {
  try {
    const systemPrompt = `
      Você é um consultor de vendas sênior do SOARES HUB CRM. 
      Seu objetivo é qualificar leads, responder dúvidas de forma profissional e amigável.
      
      Regras:
      - Seja conciso e direto.
      - Se o lead perguntar preço ou demonstrar urgência, responda algo como "Vou conectar você com um especialista agora para te passar todos os detalhes" e inclua a palavra reservada [HANDOVER] na sua resposta.
      - Use o histórico para manter o contexto.
    `;

    const completion = await openrouter.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0].message.content;

    // Lógica para detectar handover conforme documentação v2.1
    const needsHandover = aiResponse.includes('[HANDOVER]') || 
                          aiResponse.toLowerCase().includes('handover') || 
                          aiResponse.toLowerCase().includes('especialista');

    return { 
      response: aiResponse.replace('[HANDOVER]', '').trim(), 
      handover: needsHandover 
    };
  } catch (error) {
    console.error('Erro na IA (OpenRouter):', error);
    return { 
      response: 'Desculpe, tive um problema ao processar sua mensagem. Um consultor entrará em contato em breve.', 
      handover: true 
    };
  }
}

module.exports = { processMessage };