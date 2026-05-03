/**
 * Cypress E2E Test - Chat em Tempo Real
 * Testa o fluxo completo: Login → Conversas → Chat → Envio de Mensagem
 */

describe('Chat em Tempo Real', () => {
  beforeEach(() => {
    // Mock de autenticação
    cy.intercept('POST', '**/auth/v1/token*', {
      statusCode: 200,
      body: {
        access_token: 'fake-jwt-token',
        user: { id: 'user-1', email: 'test@soareshub.com' }
      }
    }).as('login')

    // Mock do perfil
    cy.intercept('GET', '**/rest/v1/profiles*', {
      statusCode: 200,
      body: [{
        id: 'user-1',
        email: 'test@soareshub.com',
        name: 'Usuário Teste',
        organization_id: 'org-1'
      }]
    }).as('profile')

    // Mock de conversas
    cy.intercept('GET', '**/rest/v1/conversations*', {
      statusCode: 200,
      body: [{
        id: 'conv-123',
        status: 'ATIVA',
        is_ai_active: true,
        last_message: 'Olá, como posso ajudar?',
        last_message_at: new Date().toISOString(),
        contact: { name: 'Ana Clara', phone_number: '551199999999' }
      }]
    }).as('conversations')

    // Mock de mensagens
    cy.intercept('GET', '**/rest/v1/messages*', {
      statusCode: 200,
      body: [
        {
          id: 'msg-1',
          content: 'Olá, tenho interesse no apartamento',
          from_me: false,
          message_type: 'text',
          is_ai_generated: false,
          timestamp: new Date().toISOString(),
          conversation_id: 'conv-123'
        }
      ]
    }).as('messages')

    // Mock de envio de mensagem
    cy.intercept('POST', '**/conversations/*/messages', {
      statusCode: 200,
      body: { success: true }
    }).as('sendMessage')

    // Mock de takeover
    cy.intercept('POST', '**/leads/*/takeover', {
      statusCode: 200,
      body: { success: true }
    }).as('takeover')

    // Visitar a página
    cy.visit('/conversations')
  })

  it('deve exibir lista de conversas', () => {
    cy.wait('@conversations')

    // Verificar se a conversa aparece
    cy.contains('Ana Clara').should('be.visible')
    cy.contains('Olá, como posso ajudar?').should('be.visible')
  })

  it('deve navegar para o chat ao clicar na conversa', () => {
    cy.wait('@conversations')

    // Clicar na conversa
    cy.contains('Ana Clara').click()

    // Verificar se navegou para o chat
    cy.url().should('include', '/chat/')
    cy.wait('@messages')

    // Verificar se a mensagem aparece
    cy.contains('Olá, tenho interesse no apartamento').should('be.visible')
  })

  it('deve enviar mensagem via chat', () => {
    cy.visit('/chat/conv-123')
    cy.wait('@messages')

    // Digitar mensagem
    cy.get('textarea').type('Olá! Vamos agendar uma visita?{enter}')

    // Verificar se a mensagem foi enviada
    cy.wait('@sendMessage')
    cy.contains('Olá! Vamos agendar uma visita?').should('be.visible')
  })

  it('deve exibir bolhas de mensagem corretamente', () => {
    cy.visit('/chat/conv-123')
    cy.wait('@messages')

    // Verificar se há bolhas de mensagem
    cy.get('[data-testid="message-bubble"]').should('have.length.at.least', 1)
    
    // Verificar se a mensagem recebida está visível
    cy.contains('Olá, tenho interesse no apartamento').should('be.visible')
  })

  it('deve mostrar botão de assumir se IA ativa', () => {
    // Mock com IA ativa
    cy.intercept('GET', '**/rest/v1/conversations*', {
      statusCode: 200,
      body: [{
        id: 'conv-123',
        status: 'ATIVA',
        is_ai_active: true,
        contact: { name: 'Ana Clara' },
        lead: { id: 'lead-1' }
      }]
    }).as('conversationsWithLead')

    cy.visit('/chat/conv-123')
    
    // Verificar se o botão assumir aparece
    cy.contains('Assumir').should('be.visible')
  })

  it('deve fazer takeover quando clicar em assumir', () => {
    // Mock com lead
    cy.intercept('GET', '**/rest/v1/conversations*', {
      statusCode: 200,
      body: [{
        id: 'conv-123',
        status: 'ATIVA',
        is_ai_active: true,
        contact: { name: 'Ana Clara' },
        lead: { id: 'lead-1' }
      }]
    }).as('conversationsWithLead')

    cy.visit('/chat/conv-123')
    cy.wait('@messages')

    // Clicar em assumir
    cy.contains('Assumir').click()
    cy.wait('@takeover')

    // Verificar se o status mudou
    cy.contains('Assumida com sucesso').should('be.visible')
  })

  it('deve mostrar alerta de aguardando humano', () => {
    // Mock com status AGUARDANDO_HUMANO
    cy.intercept('GET', '**/rest/v1/conversations*', {
      statusCode: 200,
      body: [{
        id: 'conv-123',
        status: 'AGUARDANDO_HUMANO',
        is_ai_active: false,
        contact: { name: 'Ana Clara' }
      }]
    }).as('conversationsHandover')

    cy.visit('/chat/conv-123')
    
    // Verificar se o alerta aparece
    cy.contains('Aguardando Atendimento Humano').should('be.visible')
    cy.contains('IA desativada').should('be.visible')
  })
})
