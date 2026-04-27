import React, { useState } from 'react'
import {
  Megaphone,
  Plus,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  MessageCircle,
  Zap,
  Filter,
  Calendar,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'

interface Campaign {
  id: string
  name: string
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused'
  channel: 'WhatsApp' | 'Instagram' | 'Ambos'
  sent: number
  delivered: number
  replied: number
  converted: number
  scheduledAt?: string
  segment: string
}

const Campaigns: React.FC = () => {
  const { showSuccess, showInfo } = useToast()
  const theme = useThemeClasses()
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all')

  const [campaigns] = useState<Campaign[]>([
    {
      id: '1', name: 'Black Friday — Leads Quentes', status: 'active', channel: 'WhatsApp',
      sent: 234, delivered: 228, replied: 89, converted: 23,
      segment: 'QUENTE + MORNO, score > 6'
    },
    {
      id: '2', name: 'Reengajamento — Leads Frios', status: 'active', channel: 'WhatsApp',
      sent: 156, delivered: 148, replied: 34, converted: 8,
      segment: 'FRIO, sem interação > 7 dias'
    },
    {
      id: '3', name: 'Follow-up Propostas', status: 'scheduled', channel: 'WhatsApp',
      sent: 0, delivered: 0, replied: 0, converted: 0,
      scheduledAt: '2026-04-28 09:00', segment: 'Estágio PROPOSTA, sem resposta > 2 dias'
    },
    {
      id: '4', name: 'Campanha Instagram — Novos Seguidores', status: 'draft', channel: 'Instagram',
      sent: 0, delivered: 0, replied: 0, converted: 0,
      segment: 'Seguidores minerados esta semana'
    },
    {
      id: '5', name: 'Lançamento Premium', status: 'completed', channel: 'Ambos',
      sent: 512, delivered: 498, replied: 187, converted: 45,
      segment: 'Todos os leads qualificados'
    },
  ])

  const statusConfig = {
    draft: { label: 'Rascunho', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500/10' },
    scheduled: { label: 'Agendada', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    active: { label: 'Ativa', icon: Send, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    completed: { label: 'Concluída', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    paused: { label: 'Pausada', icon: XCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  }

  const filtered = campaigns.filter(c => filter === 'all' || c.status === filter)

  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0)
  const totalDelivered = campaigns.reduce((s, c) => s + c.delivered, 0)
  const totalReplied = campaigns.reduce((s, c) => s + c.replied, 0)
  const totalConverted = campaigns.reduce((s, c) => s + c.converted, 0)

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
            className="bg-emerald-500 text-slate-950 px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Nova Campanha
          </button>
        </header>

        {/* Summary KPIs */}
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
                <p className={`text-[10px] ${theme.textMuted} font-bold uppercase tracking-wider`}>{kpi.label}</p>
              </div>
              <p className={`text-2xl font-black ${theme.textPrimary}`}>{kpi.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {([['all', 'Todas'], ['active', 'Ativas'], ['completed', 'Concluídas'], ['draft', 'Rascunhos']] as const).map(([key, label]) => (
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
        <div className="space-y-4">
          {filtered.map((campaign) => {
            const config = statusConfig[campaign.status]
            const deliveryRate = campaign.sent > 0 ? ((campaign.delivered / campaign.sent) * 100).toFixed(1) : '0'
            const replyRate = campaign.delivered > 0 ? ((campaign.replied / campaign.delivered) * 100).toFixed(1) : '0'
            const convRate = campaign.replied > 0 ? ((campaign.converted / campaign.replied) * 100).toFixed(1) : '0'

            return (
              <div
                key={campaign.id}
                className={`${theme.bgCard} ${theme.border} border rounded-2xl p-6 hover:border-emerald-500/30 transition-all group cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${config.bg}`}>
                      <config.icon size={18} className={config.color} />
                    </div>
                    <div>
                      <h3 className={`font-bold ${theme.textPrimary} group-hover:text-emerald-400 transition-colors`}>{campaign.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[10px] ${config.color} font-bold uppercase px-2 py-0.5 rounded-full ${config.bg}`}>
                          {config.label}
                        </span>
                        <span className={`text-[10px] ${theme.textMuted}`}>
                          {campaign.channel === 'WhatsApp' && '📱'} {campaign.channel === 'Instagram' && '📸'} {campaign.channel === 'Ambos' && '📱📸'} {campaign.channel}
                        </span>
                        {campaign.scheduledAt && (
                          <span className={`text-[10px] ${theme.textMuted} flex items-center gap-1`}>
                            <Clock size={10} /> {campaign.scheduledAt}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={18} className={`${theme.textMuted} group-hover:text-emerald-500 transition-colors`} />
                </div>

                {/* Segment */}
                <div className={`mb-4 p-3 ${theme.bgCardSolid} rounded-xl flex items-center gap-2`}>
                  <Filter size={12} className={theme.textMuted} />
                  <span className={`text-xs ${theme.textMuted}`}>Segmento: <span className={`font-bold ${theme.textPrimary}`}>{campaign.segment}</span></span>
                </div>

                {/* Metrics */}
                {campaign.sent > 0 && (
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Enviadas', value: campaign.sent, rate: null },
                      { label: 'Entregues', value: campaign.delivered, rate: `${deliveryRate}%` },
                      { label: 'Respostas', value: campaign.replied, rate: `${replyRate}%` },
                      { label: 'Conversões', value: campaign.converted, rate: `${convRate}%` },
                    ].map((m) => (
                      <div key={m.label} className="text-center">
                        <p className={`text-[10px] ${theme.textMuted} uppercase font-bold tracking-wider mb-1`}>{m.label}</p>
                        <p className={`text-lg font-black ${theme.textPrimary}`}>{m.value}</p>
                        {m.rate && <p className="text-[10px] text-emerald-500 font-bold">{m.rate}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons for drafts/scheduled */}
                {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800/50">
                    <button
                      onClick={(e) => { e.stopPropagation(); showSuccess(`Campanha "${campaign.name}" iniciada!`) }}
                      className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-colors flex items-center gap-2"
                    >
                      <Zap size={14} /> {campaign.status === 'draft' ? 'Ativar Campanha' : 'Disparar Agora'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); showInfo('Editor de campanha em desenvolvimento') }}
                      className={`${theme.bgCardSolid} ${theme.border} border px-4 py-2 rounded-xl text-xs font-bold ${theme.textMuted} ${theme.bgHover} transition-colors`}
                    >
                      Editar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* New Campaign Modal */}
        {showNewCampaign && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowNewCampaign(false)}>
            <div className={`${theme.bgCardSolid} ${theme.border} border rounded-3xl p-8 w-full max-w-lg shadow-2xl`} onClick={e => e.stopPropagation()}>
              <h3 className={`text-xl font-black ${theme.textPrimary} mb-6 flex items-center gap-3`}>
                <Megaphone className="text-emerald-500" size={24} />
                Nova Campanha
              </h3>

              <div className="space-y-5">
                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-wider mb-2 block`}>Nome da Campanha</label>
                  <input
                    type="text"
                    placeholder="Ex: Follow-up leads quentes"
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none transition-colors`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-wider mb-2 block`}>Canal</label>
                    <select className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} focus:border-emerald-500/50 focus:outline-none`}>
                      <option>WhatsApp</option>
                      <option>Instagram</option>
                      <option>Ambos</option>
                    </select>
                  </div>
                  <div>
                    <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-wider mb-2 block`}>Temperatura</label>
                    <select className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} focus:border-emerald-500/50 focus:outline-none`}>
                      <option>Todos</option>
                      <option>QUENTE</option>
                      <option>MORNO</option>
                      <option>FRIO</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-wider mb-2 block`}>Score Mínimo</label>
                  <input
                    type="number" min="0" max="10" defaultValue="0"
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} focus:border-emerald-500/50 focus:outline-none`}
                  />
                </div>

                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-wider mb-2 flex items-center gap-2`}>
                    <Sparkles size={14} className="text-emerald-500" /> Prompt da IA
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva o objetivo da mensagem e a IA criará mensagens personalizadas para cada lead..."
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none resize-none`}
                  />
                </div>

                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-wider mb-2 block`}>Agendamento</label>
                  <input
                    type="datetime-local"
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} focus:border-emerald-500/50 focus:outline-none`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => { setShowNewCampaign(false); showSuccess('Campanha criada como rascunho!') }}
                  className="flex-1 bg-emerald-500 text-slate-950 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
                >
                  Criar Campanha
                </button>
                <button
                  onClick={() => setShowNewCampaign(false)}
                  className={`${theme.bgMain} ${theme.border} border px-6 py-3 rounded-xl ${theme.textMuted} font-bold ${theme.bgHover} transition-colors`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Campaigns
