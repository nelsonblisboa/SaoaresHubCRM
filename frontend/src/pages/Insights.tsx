import React, { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Target, 
  ArrowUpRight,
  ArrowDownRight,
  MessageCircle,
  Sparkles,
  Users,
  Clock,
  Phone,
  Zap,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

interface Metric {
  label: string
  value: string
  trend: 'up' | 'down'
  change: string
  desc: string
  icon: any
}

interface PipelineStage {
  stage: string
  count: number
  stagnant: number
  conversion_rate: number
}

const Insights: React.FC = () => {
  const theme = useThemeClasses()
  const { profile } = useAuth()
  const [period, setPeriod] = useState('30d')
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(false)
  const [pipelineData, setPipelineData] = useState<PipelineStage[]>([])
  const [channelStats, setChannelStats] = useState<{channel: string, total: number, active: number}[]>([])
  const [topAgents, setTopAgents] = useState<{name: string, messages: number}[]>([])
  const [handoverStats, setHandoverStats] = useState({ pending: 0, resolved: 0, avg_time: 0 })
  const [conversionFunnel, setConversionFunnel] = useState({ leads: 0, qualified: 0, proposta: 0, negotiation: 0, gained: 0 })

  useEffect(() => {
    console.log('[Insights] useEffect: EXECUTANDO', { period, orgId: profile?.organization_id })
    fetchMetrics()
    fetchPipelineData()
    fetchChannelStats()
    fetchTopAgents()
    fetchHandoverStats()
    fetchConversionFunnel()
  }, [period, profile?.organization_id])

  const fetchMetrics = async () => {
    console.log('[Insights] fetchMetrics: INICIO', { orgId: profile?.organization_id })
    if (!profile?.organization_id) {
      console.log('[Insights] fetchMetrics: SEM ORG ID')
      return
    }
    
    try {
      setLoading(true)
      console.log('[Insights] fetchMetrics: Chamando RPC get_dashboard_summary')
      
      const { data: summary, error: summaryError } = await supabase
        .rpc('get_dashboard_summary', { org_id: profile.organization_id })
      
      console.log('[Insights] fetchMetrics: RPC result', { summary, summaryError })
      
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      console.log('[Insights] fetchMetrics: Query leads')
      const { count: newLeadsThisMonth, error: leadsError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .gte('created_at', thirtyDaysAgo.toISOString())

      console.log('[Insights] fetchMetrics: leads result', { newLeadsThisMonth, leadsError })

      const newMetrics: Metric[] = [
        { 
          label: 'Leads Quentes', 
          value: summary?.leadsQuentes?.toString() || '0', 
          trend: summary?.leadsQuentes > 5 ? 'up' : 'down', 
          change: '+12%', 
          desc: 'Alta probabilidade', 
          icon: Target 
        },
        { 
          label: 'Conversas Ativas', 
          value: summary?.conversasAtivas?.toString() || '0', 
          trend: summary?.conversasAtivas > 10 ? 'up' : 'down', 
          change: '+8%', 
          desc: 'Em andamento', 
          icon: MessageCircle 
        },
        { 
          label: 'Total Leads', 
          value: summary?.totalLeads?.toString() || '0', 
          trend: 'up', 
          change: '+15%', 
          desc: 'Base total', 
          icon: Activity 
        },
        { 
          label: 'Novos (30d)', 
          value: newLeadsThisMonth?.toString() || '0', 
          trend: newLeadsThisMonth && newLeadsThisMonth > 10 ? 'up' : 'down', 
          change: '+20%', 
          desc: 'Este mês', 
          icon: Users 
        },
      ]
      
      setMetrics(newMetrics)
      setLoading(false)
      console.log('[Insights] fetchMetrics: COMPLETO', { newMetrics })
    } catch (error: any) {
      console.error('Erro ao carregar métricas:', error.message)
      setMetrics([])
      setLoading(false)
    }
  }

  const fetchPipelineData = async () => {
    if (!profile?.organization_id) return

    try {
      const stages = ['NOVO', 'QUALIFICADO', 'PROPOSTA', 'NEGOCIACAO', 'GANHO', 'PERDIDO']
      
      const data = await Promise.all(
        stages.map(async (stage) => {
          const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', profile.organization_id)
            .eq('stage', stage)

          const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          const { count: stagnant } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', profile.organization_id)
            .eq('stage', stage)
            .lt('updated_at', threeDaysAgo.toISOString())

          return { stage, count: count || 0, stagnant: stagnant || 0 }
        })
      )

      setPipelineData(data)
    } catch (err) {
      console.error('Erro pipeline:', err)
    }
  }

  const fetchChannelStats = async () => {
    console.log('[Insights] fetchChannelStats: INICIO', { orgId: profile?.organization_id })
    if (!profile?.organization_id) {
      console.log('[Insights] fetchChannelStats: SEM ORG ID')
      return
    }

    try {
      console.log('[Insights] fetchChannelStats: Query contacts')
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', profile.organization_id)

      console.log('[Insights] fetchChannelStats: contacts result', { contacts, contactsError })
      const contactIds = contacts?.map(c => c.id) || []
      console.log('[Insights] fetchChannelStats: contactIds', contactIds)
      
      if (contactIds.length === 0) {
        console.log('[Insights] fetchChannelStats: SEM CONTACTS')
        setChannelStats([
          { channel: 'WHATSAPP', total: 0, active: 0 },
          { channel: 'INSTAGRAM', total: 0, active: 0 }
        ])
        return
      }

      console.log('[Insights] fetchChannelStats: Query conversations')
      const { data: conversations, error: convsError } = await supabase
        .from('conversations')
        .select('channel, status')
        .in('contact_id', contactIds)

      console.log('[Insights] fetchChannelStats: conversations result', { conversations, convsError })

      const stats = [
        { channel: 'WHATSAPP', total: 0, active: 0 },
        { channel: 'INSTAGRAM', total: 0, active: 0 }
      ]

      conversations?.forEach(c => {
        const idx = stats.findIndex(s => s.channel === c.channel)
        if (idx >= 0) {
          stats[idx].total++
          if (c.status === 'ATIVA') stats[idx].active++
        }
      })

      console.log('[Insights] fetchChannelStats: RESULTADO', stats)
      setChannelStats(stats)
    } catch (err) {
      console.error('Erro canais:', err)
    }
  }

  const fetchTopAgents = async () => {
    console.log('[Insights] fetchTopAgents: INICIO', { orgId: profile?.organization_id })
    if (!profile?.organization_id) {
      console.log('[Insights] fetchTopAgents: SEM ORG ID')
      return
    }

    try {
      console.log('[Insights] fetchTopAgents: Query contacts')
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', profile.organization_id)

      console.log('[Insights] fetchTopAgents: contacts result', { contacts, contactsError })
      const contactIds = contacts?.map(c => c.id) || []
      console.log('[Insights] fetchTopAgents: contactIds', contactIds)
      
      if (contactIds.length === 0) {
        console.log('[Insights] fetchTopAgents: SEM CONTACTS')
        setTopAgents([])
        return
      }

      console.log('[Insights] fetchTopAgents: Query conversations')
      const { data: convs, error: convsError } = await supabase
        .from('conversations')
        .select('id')
        .in('contact_id', contactIds)

      console.log('[Insights] fetchTopAgents: convs result', { convs, convsError })
      const convIds = convs?.map(c => c.id) || []
      
      if (convIds.length === 0) {
        console.log('[Insights] fetchTopAgents: SEM CONVERSAS')
        setTopAgents([])
        return
      }

      console.log('[Insights] fetchTopAgents: Query messages', { convIds })
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('agent_key')
        .eq('is_ai_generated', true)
        .in('conversation_id', convIds)
        .limit(100)

      console.log('[Insights] fetchTopAgents: messages result', { messages, messagesError })

      const agentCounts: Record<string, number> = {}
      messages?.forEach(m => {
        const agent = m.agent_key || 'Default'
        agentCounts[agent] = (agentCounts[agent] || 0) + 1
      })

      const sorted = Object.entries(agentCounts)
        .map(([name, count]) => ({ name, messages: count }))
        .sort((a, b) => b.messages - a.messages)
        .slice(0, 5)

      console.log('[Insights] fetchTopAgents: RESULTADO', sorted)
      setTopAgents(sorted)
    } catch (err) {
      console.error('Erro agentes:', err)
    }
  }

  const fetchHandoverStats = async () => {
    console.log('[Insights] fetchHandoverStats: INICIO', { orgId: profile?.organization_id })
    if (!profile?.organization_id) {
      console.log('[Insights] fetchHandoverStats: SEM ORG ID')
      return
    }

    try {
      console.log('[Insights] fetchHandoverStats: Query contacts')
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', profile.organization_id)

      console.log('[Insights] fetchHandoverStats: contacts result', { contacts, contactsError })
      const contactIds = contacts?.map(c => c.id) || []
      
      if (contactIds.length === 0) {
        console.log('[Insights] fetchHandoverStats: SEM CONTACTS')
        setHandoverStats({ pending: 0, resolved: 0, avg_time: 0 })
        return
      }

      console.log('[Insights] fetchHandoverStats: Query conversations')
      const { data: convs, error: convsError } = await supabase
        .from('conversations')
        .select('id')
        .in('contact_id', contactIds)

      console.log('[Insights] fetchHandoverStats: convs result', { convs, convsError })
      const convIds = convs?.map(c => c.id) || []
      
      if (convIds.length === 0) {
        console.log('[Insights] fetchHandoverStats: SEM CONVERSAS')
        setHandoverStats({ pending: 0, resolved: 0, avg_time: 0 })
        return
      }

      console.log('[Insights] fetchHandoverStats: Query handovers', { convIds })

      const { data: handovers } = await supabase
        .from('handovers')
        .select('status')
        .in('conversation_id', convIds)

      const pending = handovers?.filter(h => h.status === 'PENDENTE').length || 0
      const resolved = handovers?.filter(h => h.status === 'CONCLUIDO').length || 0

      setHandoverStats({
        pending,
        resolved,
        avg_time: 15
      })
    } catch (err) {
      console.error('Erro handover:', err)
    }
  }

  const fetchConversionFunnel = async () => {
    if (!profile?.organization_id) return

    try {
      const [leads, qualified, proposta, negotiation, gained] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('organization_id', profile.organization_id),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('organization_id', profile.organization_id).eq('stage', 'QUALIFICADO'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('organization_id', profile.organization_id).eq('stage', 'PROPOSTA'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('organization_id', profile.organization_id).eq('stage', 'NEGOCIACAO'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('organization_id', profile.organization_id).eq('stage', 'GANHO')
      ])

      setConversionFunnel({
        leads: leads.count || 0,
        qualified: qualified.count || 0,
        proposta: proposta.count || 0,
        negotiation: negotiation.count || 0,
        gained: gained.count || 0
      })
    } catch (err) {
      console.error('Erro funil:', err)
    }
  }

  const stageLabels: Record<string, string> = {
    NOVO: 'Novos',
    QUALIFICADO: 'Qualificados',
    PROPOSTA: 'Proposta',
    NEGOCIACAO: 'Negociação',
    GANHO: 'Ganhos',
    PERDIDO: 'Perdidos'
  }

  const stageColors: Record<string, string> = {
    NOVO: 'bg-blue-500',
    QUALIFICADO: 'bg-amber-500',
    PROPOSTA: 'bg-orange-500',
    NEGOCIACAO: 'bg-purple-500',
    GANHO: 'bg-emerald-500',
    PERDIDO: 'bg-rose-500'
  }

  return (
    <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
      <Sidebar />
      
      <main className={`flex-1 overflow-y-auto p-8 ${theme.bgMain} scrollbar-hide`}>
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className={`text-3xl font-black ${theme.textPrimary} tracking-tight`}>Insights & Analytics</h2>
            <p className={theme.textMuted}>Análise profunda de desempenho e eficiência da IA.</p>
          </div>
          <div className="flex gap-3">
            {['7d', '30d', '90d'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  period === p ? 'bg-emerald-500 text-slate-950' : `${theme.bgCard} ${theme.border} border ${theme.textMuted} ${theme.bgHover}`
                }`}
              >
                {p === '7d' ? '7 Dias' : p === '30d' ? '30 Dias' : '90 Dias'}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {metrics.map((m, i) => (
                <div key={i} className={`${theme.bgCard} p-6 rounded-3xl ${theme.border} border shadow-sm backdrop-blur-sm hover:border-emerald-500/30 transition-all`}>
                  <div className="flex justify-between items-start mb-3">
                    <p className={`${theme.textMuted} text-xs font-bold uppercase tracking-widest`}>{m.label}</p>
                    <m.icon size={18} className={m.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'} />
                  </div>
                  <h3 className={`text-3xl font-black ${theme.textPrimary} italic tracking-tight`}>{m.value}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    {m.trend === 'up' ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-rose-500" />}
                    <span className={`text-xs font-bold ${m.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>{m.trend === 'down' ? '-' : '+'}{m.change}</span>
                    <span className={`text-[10px] ${theme.textMuted}`}>{m.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Pipeline */}
              <div className={`lg:col-span-2 ${theme.bgCard} ${theme.border} border rounded-3xl p-6`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${theme.textPrimary}`}>
                    <TrendingUp className="text-emerald-500" size={18} />
                    Pipeline de Vendas
                  </h3>
                  <span className={`text-xs ${theme.textMuted}`}>Por estágio</span>
                </div>
                
                <div className="space-y-3">
                  {pipelineData.filter(s => s.stage !== 'PERDIDO').map((stage, idx) => (
                    <div key={stage.stage}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={`font-bold ${theme.textSecondary}`}>{stageLabels[stage.stage]}</span>
                        <span className={`font-black ${theme.textPrimary}`}>{stage.count}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${stageColors[stage.stage]}`}
                          style={{ width: `${pipelineData[0]?.count ? (stage.count / pipelineData[0].count) * 100 : 0}%` }}
                        />
                      </div>
                      {stage.stagnant > 0 && (
                        <p className={`text-[10px] ${theme.textMuted} mt-1`}>
                          ⚠️ {stage.stagnant} estagnados há 3+ dias
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Channels */}
              <div className={`${theme.bgCard} ${theme.border} border rounded-3xl p-6`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 mb-6 ${theme.textPrimary}`}>
                  <Phone className="text-emerald-500" size={18} />
                  Canais
                </h3>
                <div className="space-y-5">
                  {channelStats.map((c, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className={`${theme.textMuted} font-bold`}>{c.channel}</span>
                        <span className={`${theme.textPrimary} font-black`}>{c.active}/{c.total}</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${c.channel === 'WHATSAPP' ? 'bg-emerald-500' : 'bg-purple-500'}`}
                          style={{ width: `${c.total > 0 ? (c.active / c.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Handover Stats */}
                <div className={`mt-6 pt-6 border-t ${theme.border}`}>
                  <h4 className={`text-sm font-bold ${theme.textMuted} mb-3`}>Transferências (Handover)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`${theme.bgCardSolid} p-3 rounded-xl text-center`}>
                      <p className={`text-xl font-black text-amber-500`}>{handoverStats.pending}</p>
                      <p className={`text-[10px] ${theme.textMuted}`}>Pendentes</p>
                    </div>
                    <div className={`${theme.bgCardSolid} p-3 rounded-xl text-center`}>
                      <p className={`text-xl font-black text-emerald-500`}>{handoverStats.resolved}</p>
                      <p className={`text-[10px] ${theme.textMuted}`}>Resolvidas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Funnel */}
              <div className={`${theme.bgCard} ${theme.border} border rounded-3xl p-6`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 mb-6 ${theme.textPrimary}`}>
                  <PieChart className="text-emerald-500" size={18} />
                  Funil de Conversão
                </h3>
                
                <div className="space-y-2">
                  {[
                    { label: 'Leads', value: conversionFunnel.leads, color: 'bg-blue-500' },
                    { label: 'Qualificados', value: conversionFunnel.qualified, color: 'bg-amber-500' },
                    { label: 'Proposta', value: conversionFunnel.proposta, color: 'bg-orange-500' },
                    { label: 'Negociação', value: conversionFunnel.negotiation, color: 'bg-purple-500' },
                    { label: 'Ganhos', value: conversionFunnel.gained, color: 'bg-emerald-500' },
                  ].map((step, i, arr) => {
                    const total = arr[0].value || 1
                    const pct = ((step.value / total) * 100).toFixed(1)
                    return (
                      <div key={step.label} className="flex items-center gap-3">
                        <span className={`w-20 text-xs font-bold ${theme.textMuted}`}>{step.label}</span>
                        <div className="flex-1 h-6 bg-slate-800 rounded-lg overflow-hidden">
                          <div 
                            className={`h-full ${step.color} flex items-center justify-end px-2`}
                            style={{ width: `${pct}%` }}
                          >
                            <span className="text-[10px] font-bold text-white">{step.value}</span>
                          </div>
                        </div>
                        <span className={`text-xs font-black ${theme.textPrimary} w-12 text-right`}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top Agents */}
              <div className={`${theme.bgCard} ${theme.border} border rounded-3xl p-6`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 mb-6 ${theme.textPrimary}`}>
                  <Zap className="text-emerald-500" size={18} />
                  Desempenho da IA
                </h3>
                
                <div className="space-y-3">
                  {topAgents.length === 0 ? (
                    <p className={`text-sm ${theme.textMuted} text-center py-4`}>Sem dados de agentes</p>
                  ) : (
                    topAgents.map((agent, i) => (
                      <div key={i} className={`flex items-center justify-between p-3 ${theme.bgCardSolid} rounded-xl`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                            i === 0 ? 'bg-emerald-500 text-slate-950' :
                            i === 1 ? 'bg-blue-500 text-white' :
                            'bg-slate-700 text-slate-300'
                          }`}>
                            {i + 1}
                          </div>
                          <span className={`text-sm font-bold ${theme.textPrimary}`}>{agent.name}</span>
                        </div>
                        <span className={`text-sm font-black ${theme.textMuted}`}>{agent.messages} msgs</span>
                      </div>
                    ))
                  )}
                </div>

                <div className={`mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl`}>
                  <p className={`text-xs text-emerald-400`}>
                    💡 A IA está processando as conversas automaticamente. Monitore os handovers para otimizar.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Insights