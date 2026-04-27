import React, { useState } from 'react'
import { 
  TrendingUp, 
  Target, 
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  MessageCircle,
  Clock,
  Sparkles
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { FunnelPerformanceChart, PipelineStageChart, AgentDistributionChart } from '../components/Charts'

const Insights: React.FC = () => {
  const { showInfo } = useToast()
  const theme = useThemeClasses()
  const [period, setPeriod] = useState('30d')

  const metrics = [
    { label: 'Custo por Lead', value: 'R$ 4,12', trend: 'down' as const, change: '15%', desc: 'Melhoria na qualificação IA', icon: Target },
    { label: 'Taxa de Retenção', value: '84%', trend: 'up' as const, change: '5%', desc: 'Baseado em reengajamento', icon: TrendingUp },
    { label: 'ROI Estimado', value: '3.4x', trend: 'up' as const, change: '12%', desc: 'Campanhas de WhatsApp', icon: Sparkles },
    { label: 'Tempo Médio IA', value: '2.3s', trend: 'down' as const, change: '40%', desc: 'Resposta multi-agentes', icon: Clock },
  ]

  const channelData = [
    { label: 'WhatsApp', value: 85, leads: 892, conversions: 128, color: 'bg-emerald-500' },
    { label: 'Instagram', value: 62, leads: 456, conversions: 67, color: 'bg-purple-500' },
    { label: 'Landing Page', value: 45, leads: 234, conversions: 45, color: 'bg-blue-500' },
    { label: 'Indicação', value: 78, leads: 112, conversions: 56, color: 'bg-amber-500' },
  ]

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

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((m, i) => (
            <div key={i} className={`${theme.bgCard} p-6 rounded-3xl ${theme.border} border shadow-sm backdrop-blur-sm hover:border-emerald-500/30 transition-all`}>
              <div className="flex justify-between items-start mb-3">
                <p className={`${theme.textMuted} text-xs font-bold uppercase tracking-wider`}>{m.label}</p>
                <m.icon size={18} className={m.trend === 'up' || m.label.includes('Custo') || m.label.includes('Tempo') ? 'text-emerald-500' : 'text-rose-500'} />
              </div>
              <h3 className={`text-3xl font-black ${theme.textPrimary} italic tracking-tight mb-1`}>{m.value}</h3>
              <div className="flex items-center gap-2">
                {m.trend === 'up' ? <ArrowUpRight size={14} className="text-emerald-500" /> : <ArrowDownRight size={14} className="text-emerald-500" />}
                <span className="text-xs font-bold text-emerald-500">{m.trend === 'down' ? '-' : '+'}{m.change}</span>
                <span className={`text-[10px] ${theme.textMuted} font-medium`}>{m.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Chart */}
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
            <div className="h-[320px]">
              <FunnelPerformanceChart />
            </div>
          </div>

          {/* Channel Efficiency */}
          <div className={`${theme.bgCard} ${theme.border} border rounded-3xl p-6 flex flex-col`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 mb-6 ${theme.textPrimary}`}>
              <Target className="text-emerald-500" size={18} />
              Eficiência por Canal
            </h3>
            <div className="space-y-5 flex-1">
              {channelData.map((c, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={`${theme.textMuted} font-bold`}>{c.label}</span>
                    <span className={`${theme.textPrimary} font-black`}>{c.value}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`${c.color} h-full rounded-full shadow-lg transition-all duration-1000`} style={{ width: `${c.value}%` }} />
                  </div>
                  <div className="flex gap-4 text-[10px]">
                    <span className={theme.textMuted}>{c.leads} leads</span>
                    <span className="text-emerald-500 font-bold">{c.conversions} conversões</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
              <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                <Zap size={12} /> Sugestão da IA
              </p>
              <p className={`text-xs ${theme.textMuted} leading-relaxed`}>
                Aumente o investimento em WhatsApp Ads; a taxa de conversão da IA é 30% maior nesse canal.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Row: Pipeline + Agent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pipeline Health */}
          <div className={`${theme.bgCard} ${theme.border} border rounded-3xl p-6`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${theme.textPrimary}`}>
              <MessageCircle className="text-emerald-500" size={18} />
              Pipeline por Estágio
            </h3>
            <div className="h-[250px]">
              <PipelineStageChart />
            </div>
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className={`text-[10px] ${theme.textMuted} font-bold`}>Ativos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className={`text-[10px] ${theme.textMuted} font-bold`}>Estagnados</span>
              </div>
            </div>
          </div>

          {/* Agent Performance */}
          <div className={`${theme.bgCard} ${theme.border} border rounded-3xl p-6`}>
            <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${theme.textPrimary}`}>
              <Bot className="text-emerald-500" size={18} />
              Atividade dos Agentes IA
            </h3>
            <div className="h-[200px]">
              <AgentDistributionChart />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {[
                { label: 'Total Mensagens', value: '719', change: '+18%' },
                { label: 'Handovers', value: '12', change: '-25%' },
                { label: 'Satisfação', value: '94%', change: '+3%' },
              ].map((s) => (
                <div key={s.label} className={`p-3 ${theme.bgCardSolid} rounded-xl text-center`}>
                  <p className={`text-[10px] ${theme.textMuted} uppercase font-bold tracking-wider mb-1`}>{s.label}</p>
                  <p className={`text-lg font-black ${theme.textPrimary}`}>{s.value}</p>
                  <p className="text-[10px] text-emerald-500 font-bold">{s.change}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Insights
