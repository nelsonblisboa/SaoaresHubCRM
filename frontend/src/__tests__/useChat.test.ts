/**
 * SOARES HUB CRM - useChat.test.ts
 * Testes para o hook useChat
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useChat } from '../hooks/useChat'
import { supabase } from '../lib/supabaseClient'
import { supabaseService } from '../services/supabaseService'

// Mock do Supabase
jest.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    })),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
    auth: {
      getSession: jest.fn().mockResolvedValue({ 
        data: { session: { access_token: 'fake-token' } } 
      }),
    },
  },
}))

jest.mock('../services/supabaseService', () => ({
  supabaseService: {
    takeoverLead: jest.fn().mockResolvedValue({}),
  },
}))

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    profile: { id: 'user-1', organization_id: 'org-1' },
  })),
}))

jest.mock('../contexts/ToastContext', () => ({
  useToast: jest.fn(() => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
  })),
}))

describe('useChat Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve inicializar com mensagens vazias', () => {
    const { result } = renderHook(() => useChat('conv-123'))
    
    expect(result.current.messages).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.sending).toBe(false)
  })

  it('deve buscar conversa e mensagens ao montar', async () => {
    const mockConversation = {
      id: 'conv-123',
      status: 'ATIVA',
      is_ai_active: true,
      contact: { name: 'Teste' },
    }
    
    const mockMessages = [
      { id: 'msg-1', content: 'Olá', from_me: false },
    ]
    
    ;(supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockConversation, error: null }),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    }))
    
    const { result } = renderHook(() => useChat('conv-123'))
    
    await waitFor(() => {
      expect(result.current.conversation).toEqual(mockConversation)
    })
  })

  it('deve enviar mensagem com optimistic update', async () => {
    const { result } = renderHook(() => useChat('conv-123'))
    
    // Simular envio de mensagem
    await result.current.sendMessage('Teste de mensagem')
    
    // Verificar se mensagem temporária foi adicionada
    expect(result.current.messages.length).toBeGreaterThan(0)
  })

  it('deve fazer rollback se envio falhar', async () => {
    // Mock do fetch para falhar
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Erro' }),
    })
    
    const { result } = renderHook(() => useChat('conv-123'))
    
    await result.current.sendMessage('Teste')
    
    // Verificar se mensagem temp foi removida
    expect(result.current.messages.filter(m => m.id.startsWith('temp-')).length).toBe(0)
  })

  it('deve fazer takeOver corretamente', async () => {
    const { result } = renderHook(() => useChat('conv-123'))
    
    // Simular conversa com lead
    result.current.conversation = {
      id: 'conv-123',
      lead: { id: 'lead-123' },
      status: 'AGUARDANDO_HUMANO',
      is_ai_active: false,
    }
    
    await result.current.takeOver()
    
    expect(supabaseService.takeoverLead).toHaveBeenCalledWith('lead-123')
  })

  it('deve inscrever no Supabase Realtime', () => {
    renderHook(() => useChat('conv-123'))
    
    expect(supabase.channel).toHaveBeenCalledWith('messages-conv-123')
    expect(supabase.channel).toHaveBeenCalledWith('conversation-conv-123')
  })
})
