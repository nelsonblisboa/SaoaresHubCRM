/**
 * SOARES HUB CRM - Evolution API Init Script
 * Cria instância e obtém QR Code para conectar WhatsApp
 * 
 * Uso: node evolution-init.js
 */

const http = require('http');
const https = require('https');

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8081';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'your-evolution-api-key';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE || 'soares-hub-default';

// Helper para fazer requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, EVOLUTION_API_URL);
    const options = {
      method,
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
      },
    };
    
    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function initEvolution() {
  console.log('🤖 Inicializando Evolution API para SOARES HUB CRM...\n');
  
  try {
    // 1. Verificar status da API
    console.log('1️⃣ Verificando conexão com Evolution API...');
    try {
      const status = await makeRequest('GET', '/');
      console.log('✅ Evolution API conectada!');
      console.log(`   Versão: ${status.version || 'N/A'}`);
    } catch (e) {
      console.error('❌ Erro ao conectar com Evolution API:');
      console.error(`   ${EVOLUTION_API_URL}`);
      console.error('   Certifique-se de que o Docker está rodando: docker-compose up evolution');
      process.exit(1);
    }

    // 2. Criar instância
    console.log(`\n2️⃣ Criando instância "${INSTANCE_NAME}"...`);
    try {
      const createResult = await makeRequest('POST', '/instance/create', {
        instanceName: INSTANCE_NAME,
        integration: 'WHATSAPP-BUSINESS',
      });
      
      if (createResult.instance?._instanceId) {
        console.log('✅ Instância criada com sucesso!');
        console.log(`   ID: ${createResult.instance._instanceId}`);
      } else {
        console.log('⚠️ Instância pode já existir, tentando conectar...');
      }
    } catch (e) {
      console.log('⚠️ Erro ao criar instância (pode já existir):', e.message);
    }

    // 3. Obter QR Code
    console.log(`\n3️⃣ Obtendo QR Code para instância "${INSTANCE_NAME}"...`);
    let qrCodeData = null;
    
    for (let i = 0; i < 5; i++) {
      try {
        qrCodeData = await makeRequest('GET', `/instance/qrcode/${INSTANCE_NAME}`);
        
        if (qrCodeData.base64) {
          console.log('✅ QR Code obtido!');
          console.log('\n📱 ESCANEIE O QR CODE NO SEU WHATSAPP:');
          console.log('   1. Abra o WhatsApp no celular');
          console.log('   2. Vá em Menu > Dispositivos conectados > Conectar um dispositivo');
          console.log('   3. Escaneie o código abaixo:\n');
          console.log(qrCodeData.base64);
          break;
        } else if (qrCodeData.instance?.state === 'open') {
          console.log('✅ WhatsApp já está conectado!');
          break;
        }
      } catch (e) {
        console.log(`   Tentativa ${i + 1}/5 falhou, tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 4. Configurar Webhook
    console.log(`\n4️⃣ Configurando webhook para instância "${INSTANCE_NAME}"...`);
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      const webhookResult = await makeRequest('POST', `/webhook/set/${INSTANCE_NAME}`, {
        url: `${backendUrl}/webhook/evolution`,
        events: ['messages.UPSERT', 'messages.UPDATE'],
      });
      console.log('✅ Webhook configurado!');
      console.log(`   URL: ${backendUrl}/webhook/evolution`);
    } catch (e) {
      console.error('❌ Erro ao configurar webhook:', e.message);
    }

    // 5. Verificar status final
    console.log(`\n5️⃣ Verificando status final...`);
    try {
      const statusResult = await makeRequest('GET', `/instance/connectionState/${INSTANCE_NAME}`);
      console.log(`   Status: ${statusResult.instance?.state || 'N/A'}`);
      
      if (statusResult.instance?.state === 'open') {
        console.log('\n🎉 WHATSAPP CONECTADO COM SUCESSO!');
        console.log('   Agora você pode enviar e receber mensagens via Evolution API.');
      }
    } catch (e) {
      console.log('   Status: Verificação falhou');
    }

    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('   1. Certifique-se de que o backend está rodando: cd backend && npm run dev');
    console.log('   2. Certifique-se de que o frontend está rodando: cd frontend && npm run dev');
    console.log('   3. Acesse http://localhost:5173 e faça login');
    console.log('   4. Vá para Conversas e clique em uma conversa para testar o chat');
    console.log('\n💡 DICA: Para testar sem WhatsApp real, use:');
    console.log('   curl -X POST http://localhost:3000/webhook/evolution \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"key": {"remoteJid": "551199999999@s.whatsapp.net"}, "message": {"conversation": "Olá, teste!"}}\'');

  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }
}

initEvolution();
