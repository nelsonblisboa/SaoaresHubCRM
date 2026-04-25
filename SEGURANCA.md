# SOARES HUB CRM - Guia de Segurança

## LGPD Compliance

### Dados Pessoais Coletados
- Nome, telefone, e-mail (com consentimento explícito)
- Conversas via WhatsApp/Instagram (apenas para atendimento)
- Dados de localização (opcional, apenas para leads qualificados)

### Medidas de Segurança
- Criptografia end-to-end em comunicações
- Row Level Security no Supabase
- Logs auditáveis de acesso
- Retenção limitada de dados (2 anos máximo)

### Direitos do Titular
- Acesso aos dados via painel do usuário
- Portabilidade de dados
- Exclusão completa via API

## Boas Práticas
- Nunca armazenar senhas em texto plano
- Usar HTTPS em produção
- Validar todas as entradas de usuário
- Monitorar tentativas de acesso suspeitas