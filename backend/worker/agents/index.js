/**
 * SOARES HUB CRM — Multi-Agent System
 * 
 * Exporta todos os módulos do sistema multi-agentes.
 */

const { orchestrate } = require('./orchestrator');
const { classifyIntent, classifyByKeywords } = require('./intentClassifier');
const { buildAgentPrompt, getAgent, listAgents, FUNNEL_STAGES } = require('./agentRegistry');
const { parseAgentResponse, mapStageToLeadStage, scoreToTemperature } = require('./responseParser');

module.exports = {
  // Principal
  orchestrate,
  
  // Classificação
  classifyIntent,
  classifyByKeywords,
  
  // Agentes
  buildAgentPrompt,
  getAgent,
  listAgents,
  FUNNEL_STAGES,
  
  // Parser
  parseAgentResponse,
  mapStageToLeadStage,
  scoreToTemperature,
};
