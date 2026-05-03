import React, { useState } from 'react'
import { 
  Flame,
  Zap,
  Bot,
  TrendingUp,
  Users,
  MessageCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  LogOut
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { useAuth } from '../contexts/AuthContext'
import { FunnelPerformanceChart, WeeklyComparisonChart, PipelineStageChart, AgentDistributionChart } from '../components/Charts'

const Dashboard: React.FC = () => {
  const { showSuccess, showInfo } = useToast()
  const theme = useThemeClasses()
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'agents'>('overview')

  const stats = [
    { label: 'Total de Vendas', value: 'R$ 124.500', change: '+12%', trend: 'up' as const, icon: TrendingUp },
    { label: 'Leads Ativos', value: '1.284', change: '+5.4%', trend: 'up' as const, icon: Users },
    { label: 'Taxa de Conversão', value: '18.2%', change: '-2%', trend: 'down' as const, icon: BarChart3 },
    { label: 'Conversas Ativas', value: '47', change: '+8', trend: 'up' as const, icon: MessageCircle },
  ]

  const agentStats = [
    { agent: 'Vendas', msgs: 342, conversions: 28, score: 8.5, color: '#10b981' },
    { agent: 'Qualificador', msgs: 198, conversions: 45, score: 7.8, color: '#3b82f6' },
    { agent: 'Suporte', msgs: 89, conversions: 0, score: 9.1, color: '#f59e0b' },
    { agent: 'Agendador', msgs: 56, conversions: 12, score: 8.2, color: '#8b5cf6' },
    { agent: 'Reengajamento', msgs: 34, conversions: 5, score: 6.4, color: '#ec4899' },
  ]

  return (
    <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
      <Sidebar />

      <main className={`flex-1 overflow-y-auto p-8 ${theme.bgMain} scrollbar-hide`}>
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className={`text-3xl font-black ${theme.textPrimary} tracking-tight`}>Dashboard</h2>
            <p className={theme.textMuted}>Bem-vindo de volta, {user?.email || 'Nelson'}.</p>
          </div>
          <div className="flex gap-3">
            {/* Tab switcher */}
            <div className={`${theme.bgCard} ${theme.border} border rounded-xl flex p-1`}>
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === 'overview' ? `${theme.accentBg} text-slate-950` : `${theme.textMuted} hover:${theme.textPrimary}`
                }`}
              >Visão Geral</button>
              <button
                onClick={() => setActiveTab('agents')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  activeTab === 'agents' ? `${theme.accentBg} text-slate-950` : `${theme.textMuted} hover:${theme.textPrimary}`
                }`}
              ><Bot size={14} /> Agentes IA</button>
            </div>
            <button 
              onClick={() => showInfo('Exportação em desenvolvimento')}
              className={`${theme.bgCardSolid} ${theme.border} border px-4 py-2 rounded-xl ${theme.textSecondary} font-medium ${theme.bgHover} transition-colors`}
            >
              Exportar
            </button>
            <button 
              onClick={() => signOut()}
              className={`${theme.bgCardSolid} ${theme.border} border px-4 py-2 rounded-xl ${theme.textSecondary} font-medium ${theme.bgHover} transition-colors flex items-center gap-2`}
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className={`${theme.bgCard} p-6 rounded-3xl ${theme.border} border shadow-sm backdrop-blur-sm group hover:border-emerald-500/30 transition-all`}>
              <div className="flex justify-between items-start mb-3">
                <p className={`${theme.textMuted} text-xs font-bold uppercase tracking-wider`}>{stat.label}</p>
                <stat.icon size={18} className={stat.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'} />
              </div>
              <h3 className={`text-3xl font-black ${theme.textPrimary} italic tracking-tight`}>{stat.value}</h3>
              <div className="flex items-center gap-1 mt-1">
                {stat.trend === 'up' ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-rose-500" />}
                <span className={`text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>{stat.change}</span>
                <span className={`text-[10px] ${theme.textMuted}`}>vs ontem</span>
              </div>
            </div>
          ))}
        </div>

        {activeTab === 'overview' ? (
          <>
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Funnel Performance */}
              <div className={`lg:col-span-2 ${theme.bgCard} ${theme.border} border rounded-3xl p-6`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${theme.textPrimary}`}>
                    <TrendingUp className="text-emerald-500" size={18} />
                    Performance do Funil
                  </h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className={`text-[10px] ${theme.textMuted} font-bold uppercase`}>IA</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-600" />
                      <span className={`text-[10px] ${theme.textMuted} font-bold uppercase`}>Manual</span>
                    </div>
                  </div>
                </div>
                <div>
                  <FunnelPerformanceChart />
                </div>
              </div>

              {/* Weekly Comparison */}
              <div className={`${theme.bgCard} ${theme.border} border rounded-3xl p-6`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${theme.textPrimary}`}>
                  <BarChart3 className="text-emerald-500" size={18} />
                  Semanal
                </h3>
                <div>
                  <WeeklyComparisonChart />
                </div>
              </div>
            </div>

            {/* Attention + Hot Leads */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${theme.textPrimary}`}>
                  <AlertTriangle className="text-amber-500" size={18} />
                  Atenção Necessária
                </h3>
                {[
                  { title: 'Bot: Qualificação falhou', subtitle: 'Ana Clara — WhatsApp', time: '04:22', type: 'error' },
                  { title: 'Humano Solicitado', subtitle: 'Roberto Carlos — Instagram', time: '01:15', type: 'warning' },
                  { title: 'Lead estagnado 5 dias', subtitle: 'Marcos Paulo — Proposta', time: '5d', type: 'info' },
                ].map((alert, i) => (
                  <div key={i} className={`${theme.bgCardSolid} ${theme.border} border p-4 rounded-2xl flex items-center justify-between group ${theme.borderHover} transition-all`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.type === 'error' ? 'bg-rose-500 animate-pulse' : 
                        alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <span className={`font-medium ${theme.textPrimary}`}>{alert.title}</span>
                        <p className={`text-[10px] ${theme.textMuted}`}>{alert.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-mono ${theme.textMuted}`}>{alert.time}</span>
                      <button 
                        onClick={() => showSuccess('Atendimento assumido com sucesso!')}
                        className={`${theme.bgButton} hover:bg-emerald-500 hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors`}
                      >
                        Assumir
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hot Leads */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${theme.textPrimary}`}>
                    <Flame className="text-orange-500" size={18} />
                    Leads Quentes
                  </h3>
                  <button onClick={() => showInfo('Redirecionando...')} className="text-emerald-500 text-xs font-bold hover:underline">
                    Ver Pipeline
                  </button>
                </div>
                {[
                  { name: 'Ana Clara Silva', desc: 'Imóvel Alto Padrão', temp: 'QUENTE', score: 9 },
                  { name: 'Roberto Carlos', desc: 'Investimento', temp: 'QUENTE', score: 8 },
                  { name: 'Marcos Paulo', desc: 'Financiamento', temp: 'MORNO', score: 6 },
                ].map((lead, i) => (
                  <div 
                    key={i}
                    onClick={() => showSuccess(`Lead ${lead.name} selecionado`)}
                    className={`${theme.bgCard} p-4 rounded-2xl ${theme.border} border ${theme.borderHover} transition-all cursor-pointer group`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-bold group-hover:text-emerald-400 transition-colors ${theme.textPrimary}`}>{lead.name}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        lead.temp === 'QUENTE' ? 'bg-orange-500/20 text-orange-500' : 'bg-amber-500/20 text-amber-500'
                      }`}>{lead.temp}</span>
                    </div>
                    <p className={`text-xs ${theme.textMuted} mb-2`}>{lead.desc}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${lead.score * 10}%` }} />
                      </div>
                      <span className={`text-[10px] font-bold ${theme.textMuted}`}>{lead.score}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Agents Tab */
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Agent Distribution */}
              <div className={`${theme.bgCard} ${theme.border} border rounded-3xl p-6`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${theme.textPrimary}`}>
                  <Bot className="text-emerald-500" size={18} />
                  Distribuição de Agentes
                </h3>
                <div>
                  <AgentDistributionChart />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { name: 'Vendas', color: '#10b981' },
                    { name: 'Qualificador', color: '#3b82f6' },
                    { name: 'Suporte', color: '#f59e0b' },
                    { name: 'Agendador', color: '#8b5cf6' },
                    { name: 'Reengajamento', color: '#ec4899' },
                  ].map((a) => (
                    <div key={a.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
                      <span className={`text-[10px] ${theme.textMuted} font-medium`}>{a.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pipeline Health */}
              <div className={`lg:col-span-2 ${theme.bgCard} ${theme.border} border rounded-3xl p-6`}>
                <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${theme.textPrimary}`}>
                  <Zap className="text-emerald-500" size={18} />
                  Saúde do Pipeline
                </h3>
                <div>
                  <PipelineStageChart />
                </div>
              </div>
            </div>

            {/* Agent Performance Table */}
            <div className={`${theme.bgCard} ${theme.border} border rounded-3xl overflow-hidden`}>
              <div className="p-6 pb-4">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${theme.textPrimary}`}>
                  <TrendingUp className="text-emerald-500" size={18} />
                  Performance dos Agentes IA
                </h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className={`border-t ${theme.border} text-[10px] ${theme.textMuted} uppercase font-black tracking-widest`}>
                    <th className="p-4 pl-6">Agente</th>
                    <th className="p-4 text-center">Mensagens</th>
                    <th className="p-4 text-center">Conversões</th>
                    <th className="p-4 text-center">Score Médio</th>
                    <th className="p-4 pr-6 text-right">Eficiência</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.divider}`}>
                  {agentStats.map((a) => (
                    <tr key={a.agent} className={`${theme.bgHover} transition-colors`}>
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: a.color }} />
                          <span className={`font-bold ${theme.textPrimary}`}>{a.agent}</span>
                        </div>
                      </td>
                      <td className={`p-4 text-center text-sm ${theme.textMuted}`}>{a.msgs}</td>
                      <td className="p-4 text-center text-sm font-bold text-emerald-500">{a.conversions}</td>
                      <td className="p-4 text-center">
                        <span className={`text-sm font-bold ${a.score >= 8 ? 'text-emerald-500' : a.score >= 6 ? 'text-amber-500' : 'text-rose-500'}`}>
                          {a.score}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${a.score * 10}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${theme.textMuted}`}>{(a.score * 10).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Dashboard
