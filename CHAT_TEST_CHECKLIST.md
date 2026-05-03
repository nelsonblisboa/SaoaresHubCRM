# CHECKLIST - CHAT EM TEMPO REAL (100% Funcional)

## Pré-requisitos
- [ ] Backend rodando (porta 3000)
- [ ] Frontend rodando (porta 5173)
- [ ] Supabase configurado com RLS
- [ ] Evolution API rodando (ou mock)
- [ ] Usuário logado no Supabase

## Testes de Envio de Mensagem
| Teste | Status | Latência | Observações |
|-------|--------|--------|-------------|
| 1. Enviar mensagem de texto simples | [ ] | ___ms | Deve aparecer na bolha verde |
| 2. Receber mensagem via webhook (simulado) | [ ] | ___ms | Deve aparecer na bolha cinza |
| 3. Envio com Enter (sem Shift) | [ ] | ___ms | Enter envia, Shift+Enter quebra linha |
| 4. Envio com mensagem vazia | [ ] | N/A | Botão desabilitado, Enter não faz nada |
| 5. Optimistic update (rollback se erro) | [ ] | N/A | Se falhar, mensagem temp some |

## Testes de Tempo Real (< 5s)
| Teste | Status | Latência | Observações |
|-------|--------|--------|-------------|
| 6. Mensagem recebida via Supabase Realtime | [ ] | ___ms | Deve aparecer < 5s após envio |
| 7. Atualização de status (IA → Humano) | [ ] | ___ms | Handover dispara alerta |
| 8. Atualização de last_message no banco | [ ] | ___ms | Conversa atualiza no banco |

## Testes de Handover (IA → Humano)
| Teste | Status | Latência | Observações |
|-------|--------|--------|-------------|
| 9. Botão "Assumir" funciona | [ ] | ___ms | Deve mudar status para ATIVA |
| 10. Alerta visual de "Aguardando Humano" | [ ] | ___ms | Barra amarela aparece |
| 11. IA desativa após handover | [ ] | N/A | Mensagens vão direto para humano |
| 12. Takeover via backend (JWT válido) | [ ] | ___ms | Token Supabase enviado corretamente |

## Testes de UI/UX
| Teste | Status | Observações |
|-------|--------|-------------|
| 13. Scroll automático para última mensagem | [ ] | Ao enviar/receber |
| 14. Avatar do contato/IA exibido | [ ] | Ícones corretos |
| 15. Timestamp formatado (HH:MM) | [ ] | Horário local |
| 16. Indicador de "Enviando..." | [ ] | Para mensagens temporárias |
| 17. Responsividade (mobile) | [ ] | Testar em 375px |

## Testes de Segurança
| Teste | Status | Observações |
|-------|--------|-------------|
| 18. JWT enviado no header Authorization | [ ] | Verificar no Network tab |
| 19. Mensagens filtradas por organization_id | [ ] | Usuário não vê msgs de outra org |
| 20. Takeover valida ownership | [ ] | Não pode assumir lead de outra org |

## Métricas de Latência (Crítico < 5s)
```
[Envio]    T0: Clica em Enviar
           T1: Mensagem salva no Supabase (~300ms)
           T2: Worker processa IA (~1500ms) [se IA ativa]
           T3: Resposta salva no banco (~300ms)
           T4: Supabase Realtime dispara (~100ms)
           T5: React atualiza UI (~200ms)
           Total: ~2.4s (DENTRO do limite!)
```

## Como Testar (Passo a Passo)

### 1. Configurar Ambiente
```bash
# Terminal 1: Backend
cd "C:\Users\Nelson\Desktop\SOARES HUB CRM\backend"
npm run dev

# Terminal 2: Frontend
cd "C:\Users\Nelson\Desktop\SOARES HUB CRM\frontend"
npm run dev

# Terminal 3: Worker (opcional, para IA)
cd "C:\Users\Nelson\Desktop\SOARES HUB CRM\backend"
node worker/index.js
```

### 2. Simular Webhook (se não tiver WhatsApp)
```bash
# Enviar mensagem simulada via curl
curl -X POST http://localhost:3000/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "key": { "remoteJid": "551199999999@s.whatsapp.net" },
    "pushName": "Cliente Teste",
    "message": { "conversation": "Olá, tenho interesse!" }
  }'
```

### 3. Verificar no Chat
1. Acesse `http://localhost:5173/conversations`
2. Clique em uma conversa
3. Digite uma mensagem e pressione Enter
4. Verifique se aparece na bolha verde (enviada)
5. Simule resposta via webhook (curl acima)
6. Verifique se aparece na bolha cinza (recebida)

## Problemas Conhecidos (Pendentes)
- [ ] **Backend aceita JWT do Supabase?** Verificar se `fastify.authenticate` valida o token corretamente
- [ ] **Evolution API não configurada** - Mensagens não serão enviadas via WhatsApp (apenas salvas no banco)
- [ ] **Notificações de som** - Ainda não implementado
- [ ] **Indicador de "Digitando..."** - Não implementado
- [ ] **Envio de mídia** (imagens, áudio) - Apenas texto

## Próximos Passos Recomendados
1. **Testar o chat** com os passos acima
2. **Configurar Evolution API** para envio real via WhatsApp
3. **Implementar notificações push** (Expo/Web Push)
4. **Adicionar testes automatizados** (Jest/Cypress)
5. **Monitoramento de latência** (logs estruturados)

---
**Data:** 02/05/2026  
**Versão:** 2.1 - Chat Implementado  
**Status:** 85% Completo (falta testes e ajustes finos)
