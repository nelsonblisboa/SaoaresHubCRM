/**
 * SOARES HUB CRM — Agent Orchestrator
 * 
 * Cérebro do sistema multi-agentes. Coordena o fluxo completo:
 * 1. Classifica a intenção da mensagem (Supervisor)
 * 2. Seleciona o agente especializado adequado
 * 3. Constrói o prompt com contexto completo
 * 4. Processa a resposta via LLM
 * 5. Extrai metadados (score, stage, handover)
 * 6. Retorna resultado estruturado para o worker
 */

const { openrouter } = require('../../lib/openrouter');
const { classifyIntent } = require('./intentClassifier');
const { buildAgentPrompt, getAgent } = require('./agentRegistry');
const { parseAgentResponse, mapStageToLeadStage, scoreToTemperature } = require('./responseParser');

/**
 * Processa uma mensagem através do sistema multi-agentes
 * 
 * @param {Object} params
 * @param {string} params.message - Mensagem do lead
 * @param {Array} params.conversationHistory - Histórico da conversa [{role, content}]
 * @param {string} params.contactName - Nome do contato
 * @param {string} params.currentFunnelStage - Estágio atual no funil
 * @param {string} params.businessContext - Contexto do negócio (persona)
 * @param {string} params.forcedAgent - Forçar uso de agente específico (opcional)
 * 
 * @returns {Object} Resultado completo do processamento
 */
async function orchestrate({
  message,
  conversationHistory = [],
  contactName = 'Cliente',
  currentFunnelStage = 'QUALIFICACAO',
  businessContext = '',
  forcedAgent = null,
}) {
  const startTime = Date.now();

  try {
    // ─── STEP 1: Classificar intenção (Supervisor) ───
    let classification;
    let selectedAgentKey;

    if (forcedAgent) {
      // Modo forçado: pula classificação
      selectedAgentKey = forcedAgent;
      classification = { intent: forcedAgent, confidence: 1.0, suggestedStage: currentFunnelStage };
    } else {
      classification = await classifyIntent(message, conversationHistory);
      selectedAgentKey = classification.intent;
    }

    // ─── STEP 2: Selecionar agente ───
    const agent = getAgent(selectedAgentKey);
    
    // ─── STEP 3: Construir prompt com contexto ───
    const systemPrompt = buildAgentPrompt(selectedAgentKey, {
      contactName,
      funnelStage: classification.suggestedStage || currentFunnelStage,
      businessContext: businessContext || 'CRM de vendas conversacional com foco em WhatsApp e Instagram',
      lastInterest: 'nossos serviços',
    });

    // ─── STEP 4: Chamar LLM ───
    const completion = await openrouter.chat.completions.create({
      model: agent.model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10), // Últimas 10 mensagens para contexto
        { role: 'user', content: message },
      ],
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
    });

    const rawResponse = completion.choices[0].message.content;

    // ─── STEP 5: Parsear resposta e extrair metadados ───
    const parsed = parseAgentResponse(rawResponse);

    // ─── STEP 6: Montar resultado estruturado ───
    const result = {
      // Resposta para o lead (limpa, sem tags internas)
      response: parsed.cleanResponse,
      
      // Qual agente respondeu
      agent: {
        key: selectedAgentKey,
        name: agent.name,
      },
      
      // Classificação do Supervisor
      classification: {
        intent: classification.intent,
        confidence: classification.confidence,
      },

      // Ações a serem executadas pelo worker
      actions: {
        handover: parsed.needsHandover,
        updateScore: parsed.score,
        updateTemperature: scoreToTemperature(parsed.score),
        updateLeadStage: parsed.newStage ? mapStageToLeadStage(parsed.newStage) : null,
        updateFunnelStage: parsed.newStage, // Estágio interno da conversa
        isQualified: parsed.isQualified,
        scheduleMeeting: parsed.meetingDate,
        createTicket: parsed.ticketType,
      },

      // Métricas de performance
      metrics: {
        processingTimeMs: Date.now() - startTime,
        model: agent.model,
        tokensUsed: completion.usage?.total_tokens || 0,
      },
    };

    console.log(`[Orchestrator] ${agent.name} respondeu em ${result.metrics.processingTimeMs}ms | Intent: ${classification.intent} (${(classification.confidence * 100).toFixed(0)}%) | Score: ${parsed.score || 'N/A'}`);

    return result;

  } catch (error) {
    console.error('[Orchestrator] Erro no processamento:', error.message);
    
    // Resposta de fallback segura
    return {
      response: 'Desculpe, tive um problema ao processar sua mensagem. Um consultor entrará em contato em breve.',
      agent: { key: 'fallback', name: 'Fallback' },
      classification: { intent: 'unknown', confidence: 0 },
      actions: {
        handover: true,
        updateScore: null,
        updateTemperature: null,
        updateLeadStage: null,
        updateFunnelStage: null,
        isQualified: false,
        scheduleMeeting: null,
        createTicket: null,
      },
      metrics: {
        processingTimeMs: Date.now() - startTime,
        model: 'none',
        tokensUsed: 0,
        error: error.message,
      },
    };
  }
}

module.exports = { orchestrate };
