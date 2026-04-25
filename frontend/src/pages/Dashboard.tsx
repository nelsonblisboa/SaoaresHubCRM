import React from 'react'
import { 
  Flame,
  Zap
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'

const Dashboard: React.FC = () => {
  const { showSuccess, showInfo } = useToast()
  const theme = useThemeClasses()

  return (
    <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
      <Sidebar />

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto p-8 ${theme.bgMain} scrollbar-hide`}>
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className={`text-3xl font-black ${theme.textPrimary} tracking-tight`}>Dashboard</h2>
            <p className={theme.textMuted}>Bem-vindo de volta, Nelson.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => showInfo('Exportação em desenvolvimento')}
              className={`${theme.bgCardSolid} ${theme.border} border px-4 py-2 rounded-xl ${theme.textSecondary} font-medium ${theme.bgHover} transition-colors`}
            >
              Exportar Relatório
            </button>
            <button 
              onClick={() => showInfo('Novo Lead em desenvolvimento')}
              className="bg-emerald-500 text-slate-950 px-6 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
            >
              Novo Lead
            </button>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Total de Vendas', value: 'R$ 124.500', change: '+12% este mês', trend: 'up' },
            { label: 'Leads Ativos', value: '1.284', change: '+5.4% hoje', trend: 'up' },
            { label: 'Taxa de Conversão', value: '18.2%', change: '-2% vs ontem', trend: 'down' },
            { label: 'Tempo de Resposta', value: '4m 22s', change: 'Melhor que média', trend: 'up' },
          ].map((stat) => (
            <div key={stat.label} className={`${theme.bgCard} p-6 rounded-3xl ${theme.border} border shadow-sm backdrop-blur-sm`}>
              <p className={`${theme.textMuted} text-xs font-bold uppercase tracking-wider mb-2`}>{stat.label}</p>
              <h3 className={`text-3xl font-black ${theme.textPrimary} italic tracking-tight`}>{stat.value}</h3>
              <span className={`text-xs font-bold ${stat.trend === 'up' ? theme.success : theme.error}`}>
                {stat.change}
              </span>
            </div>
          ))}
        </div>

        {/* Attention Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className={`text-xl font-bold flex items-center gap-2 ${theme.textPrimary}`}>
              <Zap className="text-emerald-500" size={20} />
              Atenção Necessária
            </h3>
            
            <div className="space-y-4">
              {[
                { title: 'Bot: Qualificação falhou', time: '04:22 restantes', type: 'error' },
                { title: 'Humano Solicitado', time: '01:15 restantes', type: 'warning' },
              ].map((alert, i) => (
                <div key={i} className={`${theme.bgCardSolid} ${theme.border} border p-4 rounded-2xl flex items-center justify-between group ${theme.borderHover} transition-all`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${alert.type === 'error' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className={`font-medium ${theme.textPrimary}`}>{alert.title}</span>
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
          </div>

          {/* Hot Leads Sidebar */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className={`text-xl font-bold flex items-center gap-2 ${theme.textPrimary}`}>
                <Flame className="text-orange-500" size={20} />
                Leads Quentes
              </h3>
              <button 
                onClick={() => showInfo('Redirecionando para pipeline...')}
                className="text-emerald-500 text-xs font-bold hover:underline"
              >Ver Pipeline</button>
            </div>
            
            <div className="space-y-4">
              {[
                { name: 'Ana Clara Silva', desc: 'Imóvel Alto Padrão', temp: 'QUENTE' },
                { name: 'Roberto Carlos', desc: 'Investimento', temp: 'QUENTE' },
                { name: 'Marcos Paulo', desc: 'Dúvida Financiamento', temp: 'MORNO' },
              ].map((lead, i) => (
                <div 
                  key={i} 
                  onClick={() => showSuccess(`Lead ${lead.name} selecionado`)}
                  className={`${theme.bgCard} p-4 rounded-2xl ${theme.border} border ${theme.borderHover} transition-all cursor-pointer group`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-bold group-hover:text-emerald-400 transition-colors ${theme.textPrimary}`}>{lead.name}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      lead.temp === 'QUENTE' ? 'bg-orange-500/20 text-orange-500' : 'bg-amber-500/20 text-amber-500'
                    }`}>
                      {lead.temp}
                    </span>
                  </div>
                  <p className={`text-xs ${theme.textMuted}`}>{lead.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
