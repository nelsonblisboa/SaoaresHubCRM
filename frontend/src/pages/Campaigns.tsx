import React, { useState, useEffect, ChangeEvent } from 'react'
import {
  Megaphone,
  Plus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Zap,
  Filter,
  Calendar,
  ChevronRight,
  Sparkles,
  Pencil
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { supabase } from '../lib/supabaseClient'
import { CampaignEditor } from '../components/CampaignEditor'

interface Campaign {
  id: string
  name: string
  status: 'RASCUNHO' | 'AGENDADA' | 'ATIVA' | 'CONCLUIDA' | 'PAUSADA'
  channel: 'WHATSAPP' | 'INSTAGRAM' | 'AMBOS'
  total_sent: number
  total_delivered: number
  total_replied: number
  total_converted: number
  scheduled_at?: string | null
  segment?: any
  ai_prompt?: string
}

const Campaigns: React.FC = () => {
  const { showSuccess, showError, showInfo } = useToast()
  const theme = useThemeClasses()
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [filter, setFilter] = useState<'all' | 'ATIVA' | 'CONCLUIDA' | 'RASCUNHO'>('all')
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    channel: 'WHATSAPP' as const,
    segment: '',
    aiPrompt: '',
    scheduledAt: ''
  })

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setCampaigns(data || [])
    } catch (error: any) {
      showInfo(error.message || 'Erro ao carregar campanhas')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!newCampaign.name) {
      showError('Digite o nome da campanha')
      return
    }

    try {
      const campaignData: any = {
        name: newCampaign.name,
        channel: newCampaign.channel,
        segment: newCampaign.segment ? { description: newCampaign.segment } : {},
        ai_prompt: newCampaign.aiPrompt || null,
        status: newCampaign.scheduledAt ? 'AGENDADA' : 'RASCUNHO',
      }

      if (newCampaign.scheduledAt) {
        campaignData.scheduled_at = newCampaign.scheduledAt
      }

      const { error } = await supabase
        .from('campanhas')
        .insert(campaignData)
      
      if (error) throw error
      
      showSuccess('Campanha criada com sucesso!')
      setShowNewCampaign(false)
      setNewCampaign({ name: '', channel: 'WHATSAPP', segment: '', aiPrompt: '', scheduledAt: '' })
      fetchCampaigns()
    } catch (error: any) {
      showError(error.message || 'Erro ao criar campanha')
    }
  }

  const handleActivateCampaign = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from('campanhas')
        .update({ status: 'ATIVA' })
        .eq('id', id)
      
      if (error) throw error
      
      showSuccess(`Campanha "${name}" ativada!`)
      fetchCampaigns()
    } catch (error: any) {
      showError(error.message || 'Erro ao ativar campanha')
    }
  }

  const filtered = campaigns.filter(c => filter === 'all' || c.status === filter)

  const totalSent = campaigns.reduce((s, c) => s + (c.total_sent || 0), 0)
  const totalDelivered = campaigns.reduce((s, c) => s + (c.total_delivered || 0), 0)
  const totalReplied = campaigns.reduce((s, c) => s + (c.total_replied || 0), 0)
  const totalConverted = campaigns.reduce((s, c) => s + (c.total_converted || 0), 0)

  const statusConfig: Record<string, { label: string, icon: any, color: string, bg: string }> = {
    RASCUNHO: { label: 'Rascunho', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500/10' },
    AGENDADA: { label: 'Agendada', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    ATIVA: { label: 'Ativa', icon: Send, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    CONCLUIDA: { label: 'Concluída', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    PAUSADA: { label: 'Pausada', icon: XCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  }

  return (
    <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
      <Sidebar />
      
      <main className={`flex-1 overflow-y-auto p-8 ${theme.bgMain} scrollbar-hide`}>
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className={`text-3xl font-black ${theme.textPrimary} tracking-tight`}>Campanhas & Broadcasts</h2>
            <p className={theme.textMuted}>Disparos automatizados via IA com mensagens personalizadas.</p>
          </div>
          <button
            onClick={() => setShowNewCampaign(true)}
            className="bg-emerald-500 text-slate-950 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={18} />
            Nova Campanha
          </button>
        </header>

        {/* Summary KPIs */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Enviadas', value: totalSent, icon: Send, color: 'text-blue-500' },
              { label: 'Entregues', value: totalDelivered, icon: CheckCircle, color: 'text-emerald-500' },
              { label: 'Respostas', value: totalReplied, icon: MessageCircle, color: 'text-amber-500' },
              { label: 'Conversões', value: totalConverted, icon: Sparkles, color: 'text-purple-500' },
            ].map((kpi) => (
              <div key={kpi.label} className={`${theme.bgCard} ${theme.border} border p-5 rounded-2xl`}>
                <div className="flex items-center gap-2 mb-2">
                  <kpi.icon size={14} className={kpi.color} />
                  <p className={`text-[10px] ${theme.textMuted} font-bold uppercase tracking-widest`}>{kpi.label}</p>
                </div>
                <p className={`text-2xl font-black ${theme.textPrimary}`}>{kpi.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {([['all', 'Todas'], ['ATIVA', 'Ativas'], ['CONCLUIDA', 'Concluídas'], ['RASCUNHO', 'Rascunhos']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filter === key ? 'bg-emerald-500 text-slate-950' : `${theme.bgCard} ${theme.border} border ${theme.textMuted} ${theme.bgHover}`
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Campaigns List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className={theme.textMuted}>Carregando campanhas...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((campaign) => {
              const config = statusConfig[campaign.status] || statusConfig.RASCUNHO
              const deliveryRate = campaign.total_sent > 0 ? ((campaign.total_delivered / campaign.total_sent) * 100).toFixed(1) : '0'
              const replyRate = campaign.total_delivered > 0 ? ((campaign.total_replied / campaign.total_delivered) * 100).toFixed(1) : '0'
              const convRate = campaign.total_replied > 0 ? ((campaign.total_converted / campaign.total_replied) * 100).toFixed(1) : '0'

              return (
                <div
                  key={campaign.id}
                  className={`${theme.bgCard} ${theme.border} border p-6 rounded-3xl hover:border-emerald-500/30 transition-all group cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${config.bg}`}>
                        <config.icon size={18} className={config.color} />
                      </div>
                      <div>
                        <h3 className={`font-bold ${theme.textPrimary} group-hover:text-emerald-400 transition-colors`}>{campaign.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                          <span className={`text-[10px] ${theme.textMuted}`}>
                            {campaign.channel === 'WHATSAPP' && '📱 WhatsApp'} {campaign.channel === 'INSTAGRAM' && '📸 Instagram'} {campaign.channel === 'AMBOS' && '📱📸 Ambos'}
                          </span>
                          {campaign.scheduled_at && (
                            <span className={`text-[10px] ${theme.textMuted} flex items-center gap-1`}>
                              <Calendar size={10} /> {new Date(campaign.scheduled_at).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={18} className={`${theme.textMuted} group-hover:text-emerald-500 transition-colors`} />
                  </div>

                  {/* Segment */}
                  {campaign.segment && (
                    <div className={`mb-4 p-3 ${theme.bgCardSolid} rounded-xl flex items-center gap-2`}>
                      <Filter size={12} className={theme.textMuted} />
                      <span className={`text-xs ${theme.textMuted}`}>Segmento: <span className={`font-bold ${theme.textPrimary}`}>{JSON.stringify(campaign.segment)}</span></span>
                    </div>
                  )}

                  {/* Metrics */}
                  {campaign.total_sent > 0 && (
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {[
                        { label: 'Enviadas', value: campaign.total_sent },
                        { label: 'Entregues', value: campaign.total_delivered, rate: `${deliveryRate}%` },
                        { label: 'Respostas', value: campaign.total_replied, rate: `${replyRate}%` },
                        { label: 'Conversões', value: campaign.total_converted, rate: `${convRate}%` },
                      ].map((m) => (
                        <div key={m.label} className="text-center">
                          <p className={`text-[10px] ${theme.textMuted} uppercase font-bold tracking-widest mb-1`}>{m.label}</p>
                          <p className={`text-lg font-black ${theme.textPrimary}`}>{m.value}</p>
                          {m.rate && <p className={`text-[10px] text-emerald-500 font-bold`}>{m.rate}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons for drafts/scheduled */}
                  {(campaign.status === 'RASCUNHO' || campaign.status === 'AGENDADA') && (
                    <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800/50">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleActivateCampaign(campaign.id, campaign.name) }}
                        className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-colors flex items-center gap-2"
                      >
                        <Zap size={14} /> {campaign.status === 'RASCUNHO' ? 'Ativar Campanha' : 'Disparar Agora'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingCampaignId(campaign.id) }}
                        className={`${theme.bgCardSolid} ${theme.border} border px-4 py-2 rounded-xl text-xs font-bold ${theme.textMuted} ${theme.bgHover} transition-colors flex items-center gap-2`}
                      >
                        <Pencil size={14} /> Editar
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* New Campaign Modal */}
        {showNewCampaign && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowNewCampaign(false)}>
            <div className={`${theme.bgCard} p-8 rounded-3xl ${theme.border} border w-full max-w-2xl`} onClick={e => e.stopPropagation()}>
              <h3 className={`text-xl font-bold ${theme.textPrimary} mb-6 flex items-center gap-2`}>
                <Megaphone className="text-emerald-500" size={24} />
                Nova Campanha
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>Nome da Campanha</label>
                  <input
                    type="text"
                    placeholder="Ex: Follow-up leads quentes"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} outline-none focus:border-emerald-500/50 transition-colors`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>Canal</label>
                    <select
                      value={newCampaign.channel}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewCampaign({ ...newCampaign, channel: e.target.value as any })}
                      className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} outline-none focus:border-emerald-500/50 transition-colors`}
                    >
                      <option value="WHATSAPP">WhatsApp</option>
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="AMBOS">Ambos</option>
                    </select>
                  </div>

                  <div>
                    <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>Agendamento</label>
                    <input
                      type="datetime-local"
                      value={newCampaign.scheduledAt}
                      onChange={(e) => setNewCampaign({ ...newCampaign, scheduledAt: e.target.value })}
                      className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} outline-none focus:border-emerald-500/50 transition-colors`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 flex items-center gap-2`}>
                    <Sparkles size={14} className="text-emerald-500" /> Prompt da IA
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva o objetivo da mensagem e a IA criará mensagens personalizadas para cada lead..."
                    value={newCampaign.aiPrompt}
                    onChange={(e) => setNewCampaign({ ...newCampaign, aiPrompt: e.target.value })}
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} placeholder:${theme.textMuted} outline-none focus:border-emerald-500/50 transition-colors resize-none`}
                  />
                </div>

                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>Segmento</label>
                  <input
                    type="text"
                    placeholder="Ex: QUENTE + score > 6"
                    value={newCampaign.segment}
                    onChange={(e) => setNewCampaign({ ...newCampaign, segment: e.target.value })}
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} outline-none focus:border-emerald-500/50 transition-colors`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleCreateCampaign}
                  className="flex-1 bg-emerald-500 text-slate-950 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Criar Campanha
                </button>
                <button
                  onClick={() => setShowNewCampaign(false)}
                  className={`${theme.bgMain} ${theme.border} border px-6 py-3 rounded-xl ${theme.textSecondary} font-medium ${theme.bgHover} transition-colors`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Editor de Campanha Completo */}
        {(editingCampaignId || showNewCampaign) && (
          <CampaignEditor
            campaignId={editingCampaignId || undefined}
            onClose={() => {
              setEditingCampaignId(null)
              setShowNewCampaign(false)
            }}
            onSave={() => {
              setEditingCampaignId(null)
              setShowNewCampaign(false)
              fetchCampaigns()
            }}
          />
        )}
      </main>
    </div>
  )
}

export default Campaigns
