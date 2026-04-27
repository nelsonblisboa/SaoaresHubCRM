/**
 * SOARES HUB CRM — Response Parser
 * 
 * Extrai metadados estruturados das respostas dos agentes de IA.
 * Detecta sinais como handover, mudança de estágio, score, 
 * qualificação e agendamento embutidos na resposta.
 */

/**
 * Parseia a resposta do agente IA e extrai todos os metadados
 * @param {string} aiResponse - Resposta bruta do LLM
 * @returns {Object} Resposta limpa + metadados extraídos
 */
function parseAgentResponse(aiResponse) {
  const result = {
    // Resposta limpa (sem tags de controle)
    cleanResponse: aiResponse,
    
    // Metadados extraídos
    needsHandover: false,
    newStage: null,        // Ex: 'PROPOSTA', 'FECHAMENTO'
    score: null,           // 0-10
    isQualified: false,
    meetingDate: null,      // ISO date string
    ticketType: null,       // Tipo de ticket de suporte
  };

  // ─── Detectar HANDOVER ───
  if (/\[HANDOVER\]/i.test(aiResponse)) {
    result.needsHandover = true;
    result.cleanResponse = result.cleanResponse.replace(/\[HANDOVER\]/gi, '').trim();
  }
  // Detecção semântica de handover (fallback)
  if (/atendimento humano|falar com.*(pessoa|humano|alguém)|transferir/i.test(aiResponse)) {
    result.needsHandover = true;
  }

  // ─── Detectar mudança de STAGE ───
  const stageMatch = aiResponse.match(/\[STAGE:(\w+)\]/i);
  if (stageMatch) {
    const validStages = ['QUALIFICACAO', 'OBJECOES', 'PROPOSTA', 'FOLLOWUP', 'FECHAMENTO'];
    const stage = stageMatch[1].toUpperCase();
    if (validStages.includes(stage)) {
      result.newStage = stage;
    }
    result.cleanResponse = result.cleanResponse.replace(/\[STAGE:\w+\]/gi, '').trim();
  }

  // ─── Detectar SCORE ───
  const scoreMatch = aiResponse.match(/\[SCORE:(\d+)\]/i);
  if (scoreMatch) {
    const score = parseInt(scoreMatch[1], 10);
    result.score = Math.min(10, Math.max(0, score)); // Clamp 0-10
    result.cleanResponse = result.cleanResponse.replace(/\[SCORE:\d+\]/gi, '').trim();
  }

  // ─── Detectar QUALIFIED ───
  if (/\[QUALIFIED\]/i.test(aiResponse)) {
    result.isQualified = true;
    result.cleanResponse = result.cleanResponse.replace(/\[QUALIFIED\]/gi, '').trim();
  }

  // ─── Detectar MEETING (agendamento) ───
  const meetingMatch = aiResponse.match(/\[MEETING:([\d\-T: ]+)\]/i);
  if (meetingMatch) {
    result.meetingDate = meetingMatch[1].trim();
    result.cleanResponse = result.cleanResponse.replace(/\[MEETING:[^\]]+\]/gi, '').trim();
  }

  // ─── Detectar TICKET (suporte) ───
  const ticketMatch = aiResponse.match(/\[TICKET:([^\]]+)\]/i);
  if (ticketMatch) {
    result.ticketType = ticketMatch[1].trim();
    result.cleanResponse = result.cleanResponse.replace(/\[TICKET:[^\]]+\]/gi, '').trim();
  }

  // Limpar espaços extras resultantes das remoções
  result.cleanResponse = result.cleanResponse.replace(/\s{2,}/g, ' ').trim();

  return result;
}

/**
 * Mapeia estágio interno do agente para LeadStage do Prisma
 */
function mapStageToLeadStage(agentStage) {
  const mapping = {
    'QUALIFICACAO': 'QUALIFICADO',
    'OBJECOES': 'QUALIFICADO',
    'PROPOSTA': 'PROPOSTA',
    'FOLLOWUP': 'NEGOCIACAO',
    'FECHAMENTO': 'GANHO',
  };
  return mapping[agentStage] || null;
}

/**
 * Calcula temperatura baseada no score do agente
 */
function scoreToTemperature(score) {
  if (score === null) return null;
  if (score >= 7) return 'QUENTE';
  if (score >= 4) return 'MORNO';
  return 'FRIO';
}

module.exports = { parseAgentResponse, mapStageToLeadStage, scoreToTemperature };
