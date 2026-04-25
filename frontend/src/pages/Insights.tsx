import React from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Zap,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'

const Insights: React.FC = () => {
  const { showInfo } = useToast()
  const theme = useThemeClasses()
  const metrics = [
    { label: 'Custo por Lead', value: 'R$ 4,12', trend: 'down', change: '15%', desc: 'Melhoria na qualificação IA' },
    { label: 'Taxa de Retenção', value: '84%', trend: 'up', change: '5%', desc: 'Baseado em reengajamento' },
    { label: 'ROI Estimado', value: '3.4x', trend: 'up', change: '12%', desc: 'Campanhas de WhatsApp' },
    { label: 'Conversão Final', value: '12.8%', trend: 'down', change: '2%', desc: 'Vs média do mercado' },
  ]

  return (
    <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
      <Sidebar />

      <main className={`flex-1 overflow-y-auto p-8 ${theme.bgMain} scrollbar-hide`}>
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className={`text-3xl font-black ${theme.textPrimary} tracking-tight`}>Insights & Analytics</h2>
            <p className={theme.textMuted}>Análise profunda de desempenho e eficiência da IA.</p>
          </div>
          <button 
            onClick={() => showInfo('Seletor de período em desenvolvimento')}
            className={`${theme.bgCard} ${theme.border} px-4 py-2 rounded-xl ${theme.textSecondary} font-medium flex items-center gap-2 ${theme.bgHover} transition-colors`}
          >
            <Calendar size={18} />
            Últimos 30 Dias
          </button>
        </header>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {metrics.map((m, i) => (
            <div key={i} className={`${theme.bgCard} p-6 rounded-3xl ${theme.border} shadow-sm backdrop-blur-sm`}>
              <div className="flex justify-between items-start mb-4">
                <p className={`${theme.textMuted} text-xs font-bold uppercase tracking-wider`}>{m.label}</p>
                {m.trend === 'up' ? (
                  <ArrowUpRight className="text-emerald-500" size={20} />
                ) : (
                  <ArrowDownRight className="text-rose-500" size={20} />
                )}
              </div>
              <h3 className={`text-3xl font-black ${theme.textPrimary} italic tracking-tight mb-1`}>{m.value}</h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${m.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {m.trend === 'up' ? '+' : '-'}{m.change}
                </span>
                <span className="text-[10px] text-slate-600 font-medium">{m.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className={`${theme.bgCard} ${theme.border} rounded-3xl p-8 h-[400px] flex flex-col justify-between`}>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="text-emerald-500" size={20} />
                  Performance do Funil
                </h3>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className={`text-[10px] ${theme.textMuted} font-bold uppercase`}>IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-700" />
                    <span className={`text-[10px] ${theme.textMuted} font-bold uppercase`}>Manual</span>
                  </div>
                </div>
              </div>
              <div className={`flex-1 flex items-center justify-center italic ${theme.textMuted}`}>
                Gráfico Linear de Conversão (Agendado vs Realizado)
              </div>
            </div>
          </div>

          <div className={`${theme.bgCard} ${theme.border} rounded-3xl p-8 flex flex-col gap-8`}>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Target className="text-emerald-500" size={20} />
              Eficiência por Canal
            </h3>
            <div className="space-y-6">
              {[
                { label: 'WhatsApp', value: 85, color: 'bg-emerald-500' },
                { label: 'Instagram', value: 62, color: 'bg-purple-500' },
                { label: 'Landing Page', value: 45, color: 'bg-blue-500' },
                { label: 'E-mail', value: 28, color: 'bg-slate-700' },
              ].map((c, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className={theme.textMuted}>{c.label}</span>
                    <span className={theme.textPrimary}>{c.value}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`${c.color} h-full rounded-full shadow-lg shadow-current/20`} style={{ width: `${c.value}%` }} />
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
      </main>
    </div>
  )
}

export default Insights
