// Script de teste para a IA StepFun
require('dotenv').config();
const { processMessage } = require('./worker/aiProcessor');

async function testAI() {
  console.log('Testando integração com StepFun Step 3.5 Flash...');
  const result = await processMessage('Olá, sou um lead interessado em seus serviços. Pode me ajudar?');
  console.log('Resposta da IA:', result.response);
  console.log('Handover necessário:', result.handover);
}

testAI().catch(console.error);