/**
 * SOARES HUB CRM — React Query Hooks
 * 
 * Hooks reutilizáveis para fetching de dados com cache,
 * revalidação automática e estados de loading/error.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

// ─── Dashboard ───

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: api.getDashboardSummary,
    refetchInterval: 30000, // Revalida a cada 30s
    staleTime: 10000,
  })
}

// ─── Pipeline Analytics ───

export function usePipelineAnalytics(organizationId?: string) {
  return useQuery({
    queryKey: ['pipeline', 'analytics', organizationId],
    queryFn: () => api.getPipelineAnalytics(organizationId),
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

// ─── Agents ───

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: api.getAgents,
    staleTime: 300000, // Cache 5min (agentes mudam raramente)
  })
}

// ─── Leads ───

export function useLeads(params?: { page?: number; limit?: number; temperature?: string; stage?: string }) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => api.getLeads(params),
    refetchInterval: 30000,
  })
}

// ─── Conversations ───

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: api.getConversations,
    refetchInterval: 10000, // Revalida frequentemente
  })
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: () => api.getConversation(id),
    enabled: !!id,
    refetchInterval: 5000,
  })
}

// ─── Campaigns ───

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: api.getCampaigns,
    refetchInterval: 30000,
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

// ─── Sequences ───

export function useSequences() {
  return useQuery({
    queryKey: ['sequences'],
    queryFn: api.getSequences,
    staleTime: 60000,
  })
}

export function useCreateSequence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createSequence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequences'] })
    },
  })
}

// ─── Organization ───

export function useOrganization() {
  return useQuery({
    queryKey: ['organization'],
    queryFn: api.getOrganization,
    staleTime: 300000,
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.updateOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] })
    },
  })
}

// ─── Health ───

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: api.health,
    refetchInterval: 60000,
    retry: 1,
  })
}
