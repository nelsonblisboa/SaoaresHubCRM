/**
 * SOARES HUB CRM — Intent Classifier (Agente Supervisor)
 * 
 * Classifica a intenção da mensagem do lead e determina
 * qual agente especializado deve processá-la.
 * 
 * Usa um modelo leve e rápido para classificação,
 * preservando latência e custos.
 */

const { openrouter } = require('../../lib/openrouter');

// Modelo leve para classificação rápida
const CLASSIFIER_MODEL = 'google/gemini-2.0-flash-001';

const CLASSIFICATION_PROMPT = `Você é um classificador de intenções para um CRM de vendas.

Analise a mensagem do lead e retorne APENAS um JSON com o formato:
{"intent": "string", "confidence": number, "suggestedStage": "string"}

INTENÇÕES POSSÍVEIS:
- "vendas" → Lead quer comprar, saber preço, conhecer produto, pedir orçamento
- "suporte" → Cliente com problema, reclamação, dúvida técnica, pedido de ajuda
- "qualificacao" → Primeiro contato, lead novo, curiosidade inicial, pedido de informações gerais
- "agendamento" → Quer marcar reunião, agendar horário, visita, demonstração
- "reengajamento" → Resposta após longo período de silêncio, "voltei", "estou de volta"

ESTÁGIOS DO FUNIL:
- "QUALIFICACAO" → Lead novo ou sendo qualificado
- "OBJECOES" → Lead com dúvidas ou resistência
- "PROPOSTA" → Lead pronto para receber proposta
- "FOLLOWUP" → Lead que precisa de acompanhamento
- "FECHAMENTO" → Lead pronto para fechar

CONTEXTO DA CONVERSA (últimas mensagens):
{{conversationContext}}

MENSAGEM ATUAL DO LEAD:
{{message}}

Retorne APENAS o JSON, sem explicações.`;

/**
 * Classifica a intenção da mensagem usando IA
 * @param {string} message - Mensagem do lead
 * @param {Array} conversationHistory - Últimas mensagens da conversa
 * @returns {Object} { intent, confidence, suggestedStage }
 */
async function classifyIntent(message, conversationHistory = []) {
  try {
    // Monta contexto das últimas 5 mensagens para dar contexto ao classificador
    const recentContext = conversationHistory
      .slice(-5)
      .map(m => `${m.role === 'user' ? 'Lead' : 'IA'}: ${m.content}`)
      .join('\n') || 'Nenhum histórico anterior';

    const prompt = CLASSIFICATION_PROMPT
      .replace('{{conversationContext}}', recentContext)
      .replace('{{message}}', message);

    const completion = await openrouter.chat.completions.create({
      model: CLASSIFIER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1, // Baixa temperatura para classificação precisa
      max_tokens: 100,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0].message.content;
    
    // Parse seguro do JSON
    const parsed = JSON.parse(responseText);
    
    return {
      intent: parsed.intent || 'vendas',
      confidence: parsed.confidence || 0.5,
      suggestedStage: parsed.suggestedStage || 'QUALIFICACAO',
    };
  } catch (error) {
    console.error('Erro na classificação de intent:', error.message);
    
    // Fallback: classificação por keywords quando a IA falha
    return classifyByKeywords(message);
  }
}

/**
 * Classificação de fallback por keywords (sem custo de API)
 */
function classifyByKeywords(message) {
  const lower = message.toLowerCase();

  // Padrões de suporte
  if (/problema|erro|não funciona|bug|ajuda|suporte|cancelar|reclamaç/i.test(lower)) {
    return { intent: 'suporte', confidence: 0.7, suggestedStage: 'QUALIFICACAO' };
  }

  // Padrões de agendamento
  if (/agendar|marcar|horário|reunião|visita|demonstração|quando pode/i.test(lower)) {
    return { intent: 'agendamento', confidence: 0.7, suggestedStage: 'PROPOSTA' };
  }

  // Padrões de vendas fortes
  if (/preço|valor|quanto custa|orçamento|comprar|contratar|proposta|desconto/i.test(lower)) {
    return { intent: 'vendas', confidence: 0.8, suggestedStage: 'PROPOSTA' };
  }

  // Padrões de reengajamento
  if (/voltei|estou de volta|lembra|tempo|ainda|disponível/i.test(lower)) {
    return { intent: 'reengajamento', confidence: 0.6, suggestedStage: 'FOLLOWUP' };
  }

  // Default: qualificação para leads novos
  return { intent: 'qualificacao', confidence: 0.5, suggestedStage: 'QUALIFICACAO' };
}

module.exports = { classifyIntent, classifyByKeywords };
