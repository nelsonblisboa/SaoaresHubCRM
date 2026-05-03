/**
 * SOARES HUB CRM — Hook: useRealtimeHandovers
 *
 * Assina dois canais Supabase Realtime em paralelo:
 *   1. Tabela `handovers`     → Detecta novos handovers criados pela IA.
 *   2. Tabela `conversations` → Detecta quando status muda para AGUARDANDO_HUMANO.
 *
 * Em cada evento:
 *   - Invalida caches do TanStack Query para re-fetch automático.
 *   - Retorna lista de handovers PENDENTES para renderização imediata.
 *
 * Ciclo de vida:
 *   - Subscribe montagem do componente pai.
 *   - Unsubscribe automático no cleanup do useEffect (evita memory leak).
 */

import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface PendingHandover {
  id: string
  reason: string
  conversationId: string
  requestedBy: string
  createdAt: string
  /** Enriquecido via JOIN no fetch manual */
  contactName?: string
  channel?: 'WHATSAPP' | 'INSTAGRAM'
  /** Minutos aguardando (calculado no cliente) */
  minutesWaiting: number
}

// ─── Utilitário ──────────────────────────────────────────────────────────────

function calcMinutesWaiting(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
}

// ─── Hook Principal ───────────────────────────────────────────────────────────

export function useRealtimeHandovers() {
  const queryClient = useQueryClient()
  const [pendingHandovers, setPendingHandovers] = useState<PendingHandover[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ─── Fetch Manual dos Handovers PENDENTES ─────────────────────────────────
  // Chamado na montagem e sempre que o Realtime dispara um evento.
  const fetchPendingHandovers = useCallback(async () => {
    const { data, error } = await supabase
      .from('handovers')
      .select(`
        id,
        reason,
        conversation_id,
        requested_by,
        created_at,
        conversations!inner (
          channel,
          contacts!inner (
            name
          )
        )
      `)
      .eq('status', 'PENDENTE')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[Realtime] Erro ao buscar handovers pendentes:', error.message)
      return
    }

    // Mapeia e enriquece os dados para o formato do componente
    const enriched: PendingHandover[] = (data ?? []).map((h: any) => ({
      id: h.id,
      reason: h.reason,
      conversationId: h.conversation_id,
      requestedBy: h.requested_by,
      createdAt: h.created_at,
      contactName: h.conversations?.contacts?.name ?? 'Cliente desconhecido',
      channel: h.conversations?.channel,
      minutesWaiting: calcMinutesWaiting(h.created_at),
    }))

    setPendingHandovers(enriched)
    setIsLoading(false)
  }, [])

  // ─── Subscrição Realtime ──────────────────────────────────────────────────
  useEffect(() => {
    // Busca inicial ao montar
    fetchPendingHandovers()

    // Canal 1: Novos registros em `handovers`
    const handoverChannel = supabase
      .channel('realtime:handovers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'handovers' },
        () => {
          // Re-fetch + invalida cache de conversas e dashboard
          fetchPendingHandovers()
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] })
        }
      )
      .subscribe()

    // Canal 2: Mudanças de status em `conversations`
    const conversationChannel = supabase
      .channel('realtime:conversations:status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: 'status=eq.AGUARDANDO_HUMANO',
        },
        () => {
          fetchPendingHandovers()
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .subscribe()

    // Atualiza minutesWaiting a cada minuto (sem precisar de Realtime)
    const ticker = setInterval(() => {
      setPendingHandovers((prev) =>
        prev.map((h) => ({
          ...h,
          minutesWaiting: calcMinutesWaiting(h.createdAt),
        }))
      )
    }, 60_000)

    // Cleanup: remove subscrições ao desmontar o componente
    return () => {
      supabase.removeChannel(handoverChannel)
      supabase.removeChannel(conversationChannel)
      clearInterval(ticker)
    }
  }, [fetchPendingHandovers, queryClient])

  // ─── Ação: Humano assume conversa ─────────────────────────────────────────
  const assumeHandover = useCallback(async (handoverId: string, conversationId: string) => {
    // 1. Atualiza o Handover para ACEITO
    const { error: handoverError } = await supabase
      .from('handovers')
      .update({ status: 'ACEITO', resolved_at: new Date().toISOString() })
      .eq('id', handoverId)

    if (handoverError) {
      console.error('[Realtime] Erro ao aceitar handover:', handoverError.message)
      return false
    }

    // 2. Atualiza a Conversa: IA desativada, humano no controle
    const { error: convError } = await supabase
      .from('conversations')
      .update({ status: 'ATIVA', is_ai_active: false })
      .eq('id', conversationId)

    if (convError) {
      console.error('[Realtime] Erro ao atualizar conversa:', convError.message)
      return false
    }

    // 3. Remove da lista local imediatamente (UX otimista)
    setPendingHandovers((prev) => prev.filter((h) => h.id !== handoverId))
    queryClient.invalidateQueries({ queryKey: ['conversations'] })
    return true
  }, [queryClient])

  return {
    pendingHandovers,
    isLoading,
    hasPending: pendingHandovers.length > 0,
    totalPending: pendingHandovers.length,
    assumeHandover,
    refetch: fetchPendingHandovers,
  }
}
