/**
 * SOARES HUB CRM — API Client
 * 
 * Camada centralizada para comunicação com o backend.
 * Gerencia autenticação, base URL e tratamento de erros.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Retorna o token JWT armazenado (localStorage ou sessionStorage)
 */
function getToken(): string | null {
  return localStorage.getItem('crm-auth-token') || sessionStorage.getItem('crm-auth-token')
}

/**
 * Faz uma requisição autenticada ao backend
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `API Error: ${response.status}`)
  }

  return response.json()
}

// ─── Dashboard ───
export const api = {
  // Health
  health: () => request<{ status: string; version: string; features: string[] }>('/health'),

  // Dashboard
  getDashboardSummary: () =>
    request<{
      totalLeads: number
      activeConversations: number
      pendingHandovers: number
      conversionRate: number
      totalSales: number
      responseTime: number
    }>('/dashboard/summary'),

  // Pipeline Analytics
  getPipelineAnalytics: (organizationId?: string) =>
    request<{
      stages: { stage: string; count: number; stagnant: number; isBottleneck: boolean }[]
      summary: { totalLeads: number; totalStagnant: number; bottlenecks: string[]; healthScore: number }
    }>(`/pipeline/analytics${organizationId ? `?organizationId=${organizationId}` : ''}`),

  // Agents
  getAgents: () =>
    request<{ agents: { key: string; name: string; description: string }[] }>('/agents'),

  // Leads
  getLeads: (params?: { page?: number; limit?: number; temperature?: string; stage?: string }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.temperature) query.set('temperature', params.temperature)
    if (params?.stage) query.set('stage', params.stage)
    return request<{ leads: any[]; total: number }>(`/leads?${query}`)
  },

  // Conversations
  getConversations: () =>
    request<{ conversations: any[] }>('/conversations'),

  getConversation: (id: string) =>
    request<{ conversation: any }>(`/conversations/${id}`),

  // Campaigns
  getCampaigns: () =>
    request<{ campaigns: any[] }>('/campaigns'),

  createCampaign: (data: {
    name: string
    channel: string
    segment: Record<string, any>
    aiPrompt?: string
    scheduledAt?: string
  }) => request<{ campaign: any }>('/campaigns', { method: 'POST', body: JSON.stringify(data) }),

  // Sequences
  getSequences: () =>
    request<{ sequences: any[] }>('/sequences'),

  createSequence: (data: {
    name: string
    trigger: string
    steps: { delayMinutes: number; messageTemplate: string; channel: string }[]
  }) => request<{ sequence: any }>('/sequences', { method: 'POST', body: JSON.stringify(data) }),

  // Settings
  getOrganization: () =>
    request<{ organization: any }>('/organization'),

  updateOrganization: (data: Record<string, any>) =>
    request<{ organization: any }>('/organization', { method: 'PUT', body: JSON.stringify(data) }),
}

export default api
