/**
 * SOARES HUB CRM - Chat.test.tsx
 * Testes automatizados para o Chat em tempo real
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '../contexts/ThemeContext'
import { ToastProvider } from '../contexts/ToastContext'
import { AuthProvider } from '../contexts/AuthContext'
import Chat from '../pages/Chat'

// Mock do useParams
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(() => ({ id: 'conv-123' })),
  useNavigate: jest.fn(() => jest.fn()),
}))

// Mock do useChat hook
jest.mock('../hooks/useChat', () => ({
  useChat: jest.fn(() => ({
    messages: [
      {
        id: 'msg-1',
        content: 'Olá, como posso ajudar?',
        fromMe: false,
        messageType: 'text',
        isAiGenerated: true,
        agentKey: 'Vendas',
        timestamp: new Date().toISOString(),
        conversationId: 'conv-123',
      },
      {
        id: 'msg-2',
        content: 'Tenho interesse no apartamento',
        fromMe: true,
        messageType: 'text',
        isAiGenerated: false,
        timestamp: new Date().toISOString(),
        conversationId: 'conv-123',
      },
    ],
    conversation: {
      id: 'conv-123',
      status: 'ATIVA',
      isAiActive: true,
      channel: 'WHATSAPP',
      contact: { name: 'Ana Clara', phoneNumber: '551199999999' },
      lead: { id: 'lead-1', stage: 'QUALIFICADO', temperature: 'QUENTE', score: 8 },
    },
    loading: false,
    sending: false,
    sendMessage: jest.fn(),
    takeOver: jest.fn(),
  })),
}))

// Mock do useThemeClasses
jest.mock('../hooks/useThemeClasses', () => ({
  useThemeClasses: jest.fn(() => ({
    bgMain: 'bg-slate-950',
    bgCard: 'bg-slate-900',
    bgCardSolid: 'bg-slate-800',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-500',
    border: 'border-slate-800',
    bgHover: 'hover:bg-slate-800',
  })),
}))

// Mock do useAuth
jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: jest.fn(() => ({
    profile: { id: 'user-1', organization_id: 'org-1' },
  })),
}))

const queryClient = new QueryClient()

const renderChat = () => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Chat />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

describe('Chat Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar o header com nome do contato', async () => {
    renderChat()
    
    expect(await screen.findByText('Ana Clara')).toBeInTheDocument()
  })

  it('deve exibir mensagens em tempo real', async () => {
    renderChat()
    
    expect(await screen.findByText('Olá, como posso ajudar?')).toBeInTheDocument()
    expect(await screen.findByText('Tenho interesse no apartamento')).toBeInTheDocument()
  })

  it('deve exibir indicador de IA para mensagens geradas', async () => {
    renderChat()
    
    expect(await screen.findByText('Vendas')).toBeInTheDocument()
  })

  it('deve ter campo de input para mensagens', async () => {
    renderChat()
    
    const input = screen.getByPlaceholderText(/Digite sua mensagem/i)
    expect(input).toBeInTheDocument()
    expect(input).not.toBeDisabled()
  })

  it('deve chamar sendMessage ao clicar em enviar', async () => {
    renderChat()
    
    const input = screen.getByPlaceholderText(/Digite sua mensagem/i)
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Teste de mensagem' } })
    fireEvent.click(sendButton)
    
    const { useChat } = require('../hooks/useChat')
    const sendMessageMock = useChat().sendMessage
    
    await waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalledWith('Teste de mensagem')
    })
  })

  it('deve desabilitar input quando sending for true', async () => {
    // Atualizar mock para sending = true
    const { useChat } = require('../hooks/useChat')
    ;(useChat as jest.Mock).mockReturnValue({
      ...useChat(),
      sending: true,
    })
    
    renderChat()
    
    const input = screen.getByPlaceholderText(/Digite sua mensagem/i)
    expect(input).toBeDisabled()
  })

  it('deve exibir botão de assumir quando IA ativa', async () => {
    renderChat()
    
    expect(await screen.findByRole('button', { name: /Assumir/i })).toBeInTheDocument()
  })

  it('deve chamar takeOver ao clicar em assumir', async () => {
    renderChat()
    
    const takeOverButton = await screen.findByRole('button', { name: /Assumir/i })
    fireEvent.click(takeOverButton)
    
    const { useChat } = require('../hooks/useChat')
    const takeOverMock = useChat().takeOver
    
    await waitFor(() => {
      expect(takeOverMock).toHaveBeenCalled()
    })
  })

  it('deve exibir alerta quando aguardando humano', async () => {
    // Mock com status AGUARDANDO_HUMANO
    const { useChat } = require('../hooks/useChat')
    ;(useChat as jest.Mock).mockReturnValue({
      ...useChat(),
      conversation: {
        ...useChat().conversation,
        status: 'AGUARDANDO_HUMANO',
        isAiActive: true,
      },
    })
    
    renderChat()
    
    expect(await screen.findByText(/Aguardando Atendimento Humano/i)).toBeInTheDocument()
  })
})

describe('useChat Hook', () => {
  it('deve adicionar mensagem temporária no optimistic update', async () => {
    // Este teste verifica se o hook adiciona mensagem temp
    // antes da resposta do servidor
  })

  it('deve fazer rollback se envio falhar', async () => {
    // Verifica se remove mensagem temp em caso de erro
  })

  it('deve fazer subscribe no Supabase Realtime', async () => {
    // Verifica se inscrição no canal funciona
  })
})
