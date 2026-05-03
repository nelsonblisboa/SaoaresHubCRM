# SOARES HUB CRM - Guia de Ativação da IA

## ✅ O que já está implementado:

1. **Sistema Multi-Agentes de IA**
   - Orquestrador (coordena fluxo)
   - Classificador de intenções
   - Agentes especializados (vendas, suporte, triagem, fallback)
   - Parser de respostas

2. **Pipeline de Mensagens**
   - Webhook para receber mensagens do WhatsApp
   - Fila BullMQ para processar com IA
   - Worker que orchestra as respostas

3. **Integração com LLM**
   - OpenRouter configurado (gemini-2.0-flash-001)
   - Respostas contextuais com histórico

## ❌ O que falta configurar:

### 1. Evolution API (WhatsApp)
A Evolution API precisa estar rodando para conectar ao WhatsApp.

**Opção A - Docker (Recomendado):**
```bash
docker run -d --name evolution-api \
  -p 8081:8080 \
  -e SERVER_TYPE=rest \
  -e AUTH_API_KEY=sua_chave_aqui \
  atendai/evolution-api:latest
```

**Opção B - Sem Docker (Desenvolvimento):**
```bash
# Clone e configure a API
git clone https://github.com/ atendai/evolution-api
cd evolution-api
npm install
npm start
```

### 2. Criar Instância WhatsApp
Após a Evolution API estar rodando:
```bash
node backend/evolution-init.js
```
Isso vai criar uma instância e gerar QR Code para conectar o WhatsApp.

### 3. Configurar Webhook na Evolution
Após criar a instância, configure o webhook para apontar para seu backend:
- URL: `http://seu-ip:3000/webhook/evolution`
- Eventos: `messages.upsert`

### 4. Variáveis de Ambiente
No `.env`, configure:
```
EVOLUTION_API_URL=http://localhost:8081
EVOLUTION_API_KEY=sua_chave_aqui
```

## 🚀 Fluxo completo quando tudo configurado:

1. Cliente envia mensagem no WhatsApp
2. Evolution API recebe e repassa para seu backend
3. Backend cria/atualiza contato, lead e conversa
4. Mensagem é adicionada na fila BullMQ
5. Worker processa com o Orchestrator de IA
6. IA classifica intenção e gera resposta
7. Backend envia resposta via Evolution API
8. Cliente recebe a resposta automática

## 🔧 Testando a IA isoladamente

Você pode testar o processamento de IA diretamente:
```bash
node backend/testAI.js
```