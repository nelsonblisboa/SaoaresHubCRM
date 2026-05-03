import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  X, 
  Download, 
  Calendar,
  TrendingUp,
  Users,
  MessageCircle,
  Target,
  DollarSign,
  PieChart,
  BarChart3,
  Filter,
  Printer,
  Mail
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

interface ReportConfig {
  type: 'pipeline' | 'conversations' | 'leads' | 'revenue' | 'team'
  period: '7d' | '30d' | '90d' | 'custom'
  startDate?: string
  endDate?: string
  filters: {
    assignedTo?: string
    stage?: string[]
    channel?: string[]
  }
}

interface ReportsProps {
  onClose: () => void
}

export const Reports: React.FC<ReportsProps> = ({ onClose }) => {
  const { showSuccess, showError } = useToast()
  const theme = useThemeClasses()
  const { profile } = useAuth()

  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState<'pipeline' | 'conversations' | 'leads' | 'revenue' | 'team'>('pipeline')
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  
  const [reportData, setReportData] = useState<any>({})

  useEffect(() => {
    generateReport()
  }, [reportType, period])

  const getDateRange = () => {
    const now = new Date()
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return { start: start.toISOString(), end: now.toISOString() }
  }

  const generateReport = async () => {
    try {
      setLoading(true)
      const { start, end } = getDateRange()

      if (reportType === 'pipeline') {
        const stages = ['NOVO', 'QUALIFICADO', 'PROPOSTA', 'NEGOCIACAO', 'GANHO', 'PERDIDO']
        
        const stageData = await Promise.all(
          stages.map(async (stage) => {
            const { count: total } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', profile?.organization_id)
              .eq('stage', stage)

            const { count: created } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', profile?.organization_id)
              .eq('stage', stage)
              .gte('created_at', start)

            const { count: converted } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', profile?.organization_id)
              .eq('stage', stage)
              .eq('stage', 'GANHO')
              .gte('updated_at', start)

            return { stage, total: total || 0, created: created || 0, converted: converted || 0 }
          })
        )

        setReportData({ stages: stageData })
      }

      if (reportType === 'conversations') {
        const { data: contacts } = await supabase
          .from('contacts')
          .select('id')
          .eq('organization_id', profile?.organization_id)

        const contactIds = contacts?.map(c => c.id) || []
        
        let total = 0, active = 0, withHandover = 0
        let channelStats: Record<string, number> = {}

        if (contactIds.length > 0) {
          const { count: t } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .in('contact_id', contactIds)
          total = t || 0

          const { count: a } = await supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .in('contact_id', contactIds)
            .eq('status', 'ATIVA')
          active = a || 0

          const { data: convs } = await supabase
            .from('conversations')
            .select('id')
            .in('contact_id', contactIds)
          
          const convIds = convs?.map(c => c.id) || []
          if (convIds.length > 0) {
            const { count: wh } = await supabase
              .from('handovers')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', start)
              .in('conversation_id', convIds)
            withHandover = wh || 0
          }

          const { data: channelData } = await supabase
            .from('conversations')
            .select('channel, status')
            .in('contact_id', contactIds)

          channelData?.forEach(c => {
            channelStats[c.channel] = (channelStats[c.channel] || 0) + 1
          })
        }

        setReportData({ 
          total, 
          active, 
          withHandover,
          channels: channelStats 
        })
      }

      if (reportType === 'leads') {
        const { count: totalLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', profile?.organization_id)
          .gte('created_at', start)

        const { count: newLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', profile?.organization_id)
          .gte('created_at', start)

        const { count: hotLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', profile?.organization_id)
          .eq('temperature', 'QUENTE')

        const { count: wonLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', profile?.organization_id)
          .eq('stage', 'GANHO')
          .gte('updated_at', start)

        setReportData({
          total: totalLeads || 0,
          new: newLeads || 0,
          hot: hotLeads || 0,
          won: wonLeads || 0,
          conversionRate: totalLeads ? ((wonLeads || 0) / totalLeads * 100).toFixed(1) : 0
        })
      }

      if (reportType === 'revenue') {
        const { data: leads } = await supabase
          .from('leads')
          .select('stage, deal_value')
          .eq('organization_id', profile?.organization_id)
          .in('stage', ['NEGOCIACAO', 'GANHO'])

        const totalRevenue = leads?.reduce((sum, l) => sum + (l.deal_value || 0), 0) || 0
        const wonRevenue = leads?.filter(l => l.stage === 'GANHO').reduce((sum, l) => sum + (l.deal_value || 0), 0) || 0
        const pipelineValue = leads?.filter(l => l.stage === 'NEGOCIACAO').reduce((sum, l) => sum + (l.deal_value || 0), 0) || 0

        setReportData({
          totalRevenue,
          wonRevenue,
          pipelineValue,
          avgDeal: leads?.length ? Math.round(totalRevenue / leads.length) : 0
        })
      }

      if (reportType === 'team') {
        const { data: users } = await supabase
          .from('profiles')
          .select('id, name, role')
          .eq('organization_id', profile?.organization_id)

        const { data: contacts } = await supabase
          .from('contacts')
          .select('id')
          .eq('organization_id', profile?.organization_id)
        
        const contactIds = contacts?.map(c => c.id) || []

        const userStats = await Promise.all(
          (users || []).map(async (user) => {
            const { count: assignedLeads } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('assigned_to_id', user.id)

            let conversations = 0
            if (contactIds.length > 0) {
              const { count: convs } = await supabase
                .from('conversations')
                .select('*', { count: 'exact', head: true })
                .in('contact_id', contactIds)
              conversations = convs || 0
            }

            return { ...user, assignedLeads: assignedLeads || 0, conversations }
          })
        )

        setReportData({ users: userStats })
      }

    } catch (err: any) {
      console.error('Erro ao gerar relatório:', err)
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    let csv = ''

    if (reportType === 'pipeline' && reportData.stages) {
      csv = 'Estágio,Total,Criados,Convertidos\n'
      reportData.stages.forEach((s: any) => {
        csv += `${s.stage},${s.total},${s.created},${s.converted}\n`
      })
    }

    if (reportType === 'leads') {
      csv = `Métrica,Valor\nTotal de Leads,${reportData.total}\nNovos,${reportData.new}\nQuentes,${reportData.hot}\nGanhos,${reportData.won}\nTaxa de Conversão,${reportData.conversionRate}%`
    }

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${reportType}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    showSuccess('Relatório baixado!')
  }

  const reportTypes = [
    { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
    { id: 'conversations', label: 'Conversas', icon: MessageCircle },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'revenue', label: 'Receita', icon: DollarSign },
    { id: 'team', label: 'Equipe', icon: Target }
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${theme.bgCard} border ${theme.border} rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <FileText className="text-blue-500" size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${theme.textPrimary}`}>Relatórios</h3>
              <p className={`text-xs ${theme.textMuted}`}>Análise e exportação de dados</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl font-bold text-sm"
            >
              <Download size={16} />
              Exportar
            </button>
            <button onClick={onClose} className={`p-2 ${theme.bgHover} rounded-lg`}>
              <X size={20} className={theme.textMuted} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`p-4 border-b ${theme.border} flex items-center gap-4`}>
          {/* Report Type */}
          <div className="flex gap-2">
            {reportTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setReportType(type.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  reportType === type.id
                    ? 'bg-blue-500 text-white'
                    : `${theme.bgCardSolid} ${theme.textMuted} hover:text-white`
                }`}
              >
                <type.icon size={14} />
                {type.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Period */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className={theme.textMuted} />
            {['7d', '30d', '90d'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  period === p 
                    ? 'bg-blue-500 text-white' 
                    : `${theme.textMuted} hover:text-white`
                }`}
              >
                {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
              </button>
            ))}
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Pipeline Report */}
              {reportType === 'pipeline' && reportData.stages && (
                <div className="space-y-4">
                  <h4 className={`text-lg font-bold ${theme.textPrimary}`}>Pipeline de Vendas</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {['NOVO', 'QUALIFICADO', 'PROPOSTA', 'NEGOCIACAO', 'GANHO', 'PERDIDO'].map((stage, idx) => {
                      const data = reportData.stages[idx]
                      return (
                        <div key={stage} className={`${theme.bgCardSolid} p-4 rounded-xl text-center`}>
                          <p className={`text-[10px] ${theme.textMuted} uppercase font-bold mb-2`}>{stage}</p>
                          <p className={`text-2xl font-black ${theme.textPrimary}`}>{data?.total || 0}</p>
                          <p className={`text-[10px] ${theme.textMuted}`}>+{data?.created || 0} novos</p>
                        </div>
                      )
                    })}
                  </div>

                  <div className={`mt-6 p-4 ${theme.bgCardSolid} rounded-xl`}>
                    <h5 className={`text-sm font-bold ${theme.textSecondary} mb-3`}>Visualização</h5>
                    <div className="space-y-2">
                      {reportData.stages.map((s: any) => {
                        const max = Math.max(...reportData.stages.map((x: any) => x.total))
                        const pct = max ? (s.total / max) * 100 : 0
                        return (
                          <div key={s.stage} className="flex items-center gap-3">
                            <span className={`w-20 text-xs font-bold ${theme.textMuted}`}>{s.stage}</span>
                            <div className="flex-1 h-6 bg-slate-800 rounded overflow-hidden">
                              <div 
                                className={`h-full rounded ${
                                  s.stage === 'GANHO' ? 'bg-emerald-500' :
                                  s.stage === 'PERDIDO' ? 'bg-rose-500' :
                                  'bg-blue-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-black ${theme.textPrimary} w-8`}>{s.total}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Leads Report */}
              {reportType === 'leads' && (
                <div className="space-y-4">
                  <h4 className={`text-lg font-bold ${theme.textPrimary}`}>Performance de Leads</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className={`${theme.bgCardSolid} p-6 rounded-xl text-center`}>
                      <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-2`}>Total</p>
                      <p className={`text-3xl font-black ${theme.textPrimary}`}>{reportData.total}</p>
                    </div>
                    <div className={`${theme.bgCardSolid} p-6 rounded-xl text-center`}>
                      <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-2`}>Novos</p>
                      <p className={`text-3xl font-black text-blue-400`}>{reportData.new}</p>
                    </div>
                    <div className={`${theme.bgCardSolid} p-6 rounded-xl text-center`}>
                      <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-2`}>Quentes</p>
                      <p className={`text-3xl font-black text-orange-400`}>{reportData.hot}</p>
                    </div>
                    <div className={`${theme.bgCardSolid} p-6 rounded-xl text-center`}>
                      <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-2`}>Ganhos</p>
                      <p className={`text-3xl font-black text-emerald-400`}>{reportData.won}</p>
                    </div>
                  </div>

                  <div className={`mt-6 p-6 ${theme.bgCardSolid} rounded-xl`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs ${theme.textMuted} uppercase font-bold`}>Taxa de Conversão</p>
                        <p className={`text-4xl font-black text-emerald-500`}>{reportData.conversionRate}%</p>
                      </div>
                      <PieChart size={48} className={theme.textMuted} />
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Report */}
              {reportType === 'revenue' && (
                <div className="space-y-4">
                  <h4 className={`text-lg font-bold ${theme.textPrimary}`}>Receita</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`${theme.bgCardSolid} p-6 rounded-xl`}>
                      <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-2`}>Total Pipeline</p>
                      <p className={`text-3xl font-black text-blue-400`}>R$ {reportData.totalRevenue?.toLocaleString() || 0}</p>
                    </div>
                    <div className={`${theme.bgCardSolid} p-6 rounded-xl`}>
                      <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-2`}>Fechado</p>
                      <p className={`text-3xl font-black text-emerald-400`}>R$ {reportData.wonRevenue?.toLocaleString() || 0}</p>
                    </div>
                    <div className={`${theme.bgCardSolid} p-6 rounded-xl`}>
                      <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-2`}>Média por Deal</p>
                      <p className={`text-3xl font-black text-purple-400`}>R$ {reportData.avgDeal?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Conversations Report */}
              {reportType === 'conversations' && (
                <div className="space-y-4">
                  <h4 className={`text-lg font-bold ${theme.textPrimary}`}>Conversas</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`${theme.bgCardSolid} p-6 rounded-xl text-center`}>
                      <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-2`}>Total</p>
                      <p className={`text-3xl font-black ${theme.textPrimary}`}>{reportData.total}</p>
                    </div>
                    <div className={`${theme.bgCardSolid} p-6 rounded-xl text-center`}>
                      <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-2`}>Ativas</p>
                      <p className={`text-3xl font-black text-emerald-400`}>{reportData.active}</p>
                    </div>
                    <div className={`${theme.bgCardSolid} p-6 rounded-xl text-center`}>
                      <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-2`}>Handovers</p>
                      <p className={`text-3xl font-black text-amber-400`}>{reportData.withHandover}</p>
                    </div>
                  </div>

                  <div className={`mt-4 p-4 ${theme.bgCardSolid} rounded-xl`}>
                    <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-3`}>Por Canal</p>
                    <div className="flex gap-4">
                      {Object.entries(reportData.channels || {}).map(([channel, count]: any) => (
                        <div key={channel} className="flex-1 text-center">
                          <p className={`text-lg font-bold ${theme.textPrimary}`}>{channel}</p>
                          <p className={`text-xs ${theme.textMuted}`}>{count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Team Report */}
              {reportType === 'team' && reportData.users && (
                <div className="space-y-4">
                  <h4 className={`text-lg font-bold ${theme.textPrimary}`}>Desempenho da Equipe</h4>
                  <div className="space-y-3">
                    {reportData.users.map((user: any) => (
                      <div key={user.id} className={`${theme.bgCardSolid} ${theme.border} border p-4 rounded-xl flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            user.role === 'ADMIN' ? 'bg-purple-500 text-white' :
                            user.role === 'GERENTE' ? 'bg-blue-500 text-white' :
                            'bg-slate-700 text-slate-300'
                          }`}>
                            {user.name?.charAt(0)}
                          </div>
                          <div>
                            <p className={`font-bold ${theme.textPrimary}`}>{user.name}</p>
                            <p className={`text-xs ${theme.textMuted}`}>{user.role}</p>
                          </div>
                        </div>
                        <div className="flex gap-6 text-center">
                          <div>
                            <p className={`text-lg font-black ${theme.textPrimary}`}>{user.assignedLeads}</p>
                            <p className={`text-[10px] ${theme.textMuted}`}>Leads</p>
                          </div>
                          <div>
                            <p className={`text-lg font-black ${theme.textPrimary}`}>{user.conversations}</p>
                            <p className={`text-[10px] ${theme.textMuted}`}>Conversas</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}