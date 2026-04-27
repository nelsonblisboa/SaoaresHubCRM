/**
 * SOARES HUB CRM — AI Processor (v2.0 - Wrapper de Compatibilidade)
 * 
 * Mantém a interface original processMessage() para uso direto,
 * mas internamente delega para o sistema multi-agentes.
 * 
 * Use o orchestrator diretamente para controle total.
 * Este módulo existe para compatibilidade com código legado.
 */

const { orchestrate } = require('./agents/orchestrator');

/**
 * Processa uma mensagem (interface legada compatível)
 * @param {string} message - Mensagem do lead
 * @param {Array} conversationHistory - Histórico [{role, content}]
 * @param {string} contactName - Nome do contato
 * @returns {Object} { response, handover }
 */
async function processMessage(message, conversationHistory = [], contactName = 'Cliente') {
  const result = await orchestrate({
    message,
    conversationHistory,
    contactName,
  });

  return {
    response: result.response,
    handover: result.actions.handover,
    // Campos extras do v2.0
    agent: result.agent,
    score: result.actions.updateScore,
    temperature: result.actions.updateTemperature,
    newStage: result.actions.updateLeadStage,
    classification: result.classification,
    metrics: result.metrics,
  };
}

module.exports = { processMessage };