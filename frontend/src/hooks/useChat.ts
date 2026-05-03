/**
 * SOARES HUB CRM - useChat Hook
 * Gerencia mensagens em tempo real via Supabase Realtime
 * Latência < 5 segundos (crítico)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { supabaseService } from '../services/supabaseService'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

export interface Message {
  id: string
  content: string
  fromMe: boolean
  messageType: string
  isAiGenerated: boolean
  agentKey?: string
  timestamp: string
  conversationId: string
}

export interface Conversation {
  id: string
  status: string
  isAiActive: boolean
  channel: string
  lastMessage?: string
  lastMessageAt?: string
  contact?: {
    name: string
    phoneNumber?: string
    instagramUsername?: string
  }
  lead?: {
    id: string
    stage: string
    temperature: string
    score: number
  }
}

export function useChat(conversationId: string | undefined) {
  const { profile } = useAuth()
  const { showSuccess, showError } = useToast()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Buscar conversa e mensagens
  const fetchConversation = useCallback(async () => {
    if (!conversationId || !profile?.organization_id) return

    try {
      setLoading(true)
     
      // Buscar detalhes da conversa (com filtro de org via RLS ou join)
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          contact:contacts(name, phone_number, instagram_username, organization_id),
          lead:leads(id, stage, temperature, score)
        `)
        .eq('id', conversationId)
        .eq('contact.organization_id', profile.organization_id)  // Filtro explícito de segurança
        .single()

      if (convError) throw convError
      setConversation(convData as any)

      // Buscar mensagens
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })
        .limit(100)

      if (msgError) throw msgError
      setMessages(msgData as Message[] || [])

    } catch (error: any) {
      showError(error.message || 'Erro ao carregar conversa')
    } finally {
      setLoading(false)
    }
  }, [conversationId, profile?.organization_id])

  // Enviar mensagem
  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || !content.trim() || sending) return;

    try {
      setSending(true)

      // Optimistic update
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        fromMe: true,
        messageType: 'text',
        isAiGenerated: false,
        timestamp: new Date().toISOString(),
        conversationId,
      }

      setMessages(prev => [...prev, tempMessage])

      // Obter token do Supabase
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      // Enviar via backend (que vai para Evolution API)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, messageType: 'text' })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao enviar mensagem' }))
        throw new Error(errorData.error || 'Erro ao enviar mensagem')
      }

      // Atualizar conversa (lastMessage)
      await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId)

    } catch (error: any) {
      // Rollback optimistic update
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')))
      showError(error.message || 'Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }, [conversationId, sending])

  // Assumir conversa (Handover)
  const takeOver = useCallback(async () => {
    if (!conversationId || !conversation?.lead?.id) return

    try {
      // Obter token do Supabase
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('Usuário não autenticado')
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/leads/${conversation.lead.id}/takeover`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao assumir conversa' }))
        throw new Error(errorData.error || 'Erro ao assumir conversa')
      }

      showSuccess('Conversa assumida com sucesso!')
      
      // Atualizar estado local
      setConversation(prev => prev ? {
        ...prev,
        status: 'ATIVA',
        isAiActive: false
      } : null)

    } catch (error: any) {
      showError(error.message || 'Erro ao assumir conversa')
    }
  }, [conversationId, conversation?.lead?.id])

  // Realtime subscription
  useEffect(() => {
    if (!conversationId || !profile?.organization_id) return

    fetchConversation()

    // Inscrever para novas mensagens
    const messagesChannel = supabase
      .channel(`messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        const newMessage = payload.new as Message
        setMessages(prev => [...prev, newMessage])
      })
      .subscribe()

    // Inscrever para mudanças na conversa (handover, status)
    const conversationChannel = supabase
      .channel(`conversation-${conversationId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `id=eq.${conversationId}`
      }, (payload) => {
        setConversation(prev => prev ? { ...prev, ...payload.new } : null)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(conversationChannel)
    }
  }, [conversationId, profile?.organization_id])

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return {
    messages,
    conversation,
    loading,
    sending,
    sendMessage,
    takeOver,
    messagesEndRef,
  }
}
