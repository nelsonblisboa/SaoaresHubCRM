import React from 'react'
import { 
  Search,
  Plus,
  MoreVertical,
  Filter
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'

const Kanban: React.FC = () => {
  const { showSuccess, showInfo } = useToast()
  const theme = useThemeClasses()

  const columns = [
    { title: 'Prospecção', count: 12 },
    { title: 'Qualificação', count: 8 },
    { title: 'Proposta', count: 5 },
    { title: 'Negociação', count: 3 },
    { title: 'Fechamento', count: 2 },
  ]

  const leads = [
    { name: 'Ana Clara Silva', value: 'R$ 15.000', temp: 'QUENTE', channel: 'WhatsApp' },
    { name: 'Roberto Carlos', value: 'R$ 42.000', temp: 'QUENTE', channel: 'Instagram' },
    { name: 'Marcos Paulo', value: 'R$ 8.500', temp: 'MORNO', channel: 'WhatsApp' },
    { name: 'Juliana Lima', value: 'R$ 25.000', temp: 'FRIO', channel: 'WhatsApp' },
  ]

  return (
    <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
      <Sidebar />

      {/* Main Content */}
      <main className={`flex-1 flex flex-col ${theme.bgMain} overflow-hidden`}>
        <header className="p-8 pb-4 flex justify-between items-center">
          <div>
            <h2 className={`text-3xl font-black ${theme.textPrimary} tracking-tight`}>Pipeline de Vendas</h2>
            <p className={theme.textMuted}>Gerencie suas oportunidades em tempo real.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.iconMuted}`} size={18} />
              <input 
                type="text" 
                placeholder="Buscar lead..."
                className={`${theme.bgCard} ${theme.border} border pl-10 pr-4 py-2 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-64 ${theme.textPlaceholder}`}
              />
            </div>
            <button className={`${theme.bgCardSolid} ${theme.border} border p-2 rounded-xl ${theme.textMuted} hover:text-emerald-500 transition-colors`}>
              <Filter size={20} />
            </button>
            <button 
              onClick={() => showInfo('Funcionalidade em desenvolvimento')}
              className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-400 transition-all"
            >
              <Plus size={20} />
              Adicionar Card
            </button>
          </div>
        </header>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto p-8 pt-4 flex gap-6 scrollbar-hide">
          {columns.map((col) => (
            <div key={col.title} className="w-80 flex-shrink-0 flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold ${theme.textSecondary} uppercase text-xs tracking-widest`}>{col.title}</h3>
                  <span className={`${theme.bgCardSolid} ${theme.textMuted} text-[10px] px-2 py-0.5 rounded-full border ${theme.border}`}>
                    {col.count}
                  </span>
                </div>
                <button 
                  onClick={() => showInfo('Opções da coluna em desenvolvimento')}
                  className={`p-1 ${theme.bgHover} rounded-lg transition-colors`}
                >
                  <MoreVertical size={16} className={theme.iconMuted} />
                </button>
              </div>

              <div className={`flex-1 ${theme.bgCard} rounded-3xl border ${theme.border} p-3 space-y-3 overflow-y-auto scrollbar-hide`}>
                {col.title === 'Prospecção' && leads.map((lead, i) => (
                  <div 
                    key={i} 
                    onClick={() => showSuccess(`Lead ${lead.name} selecionado`)}
                    className={`${theme.bgCardSolid} ${theme.border} border p-4 rounded-2xl ${theme.borderHover} transition-all cursor-grab active:cursor-grabbing group shadow-sm`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        lead.temp === 'QUENTE' ? 'bg-orange-500/20 text-orange-500' : 
                        lead.temp === 'MORNO' ? 'bg-amber-500/20 text-amber-500' : 
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {lead.temp === 'QUENTE' ? '🔥 QUENTE' : lead.temp === 'MORNO' ? '🌡️ MORNO' : '❄️ FRIO'}
                      </span>
                      <span className={`text-[10px] ${theme.textMuted} font-medium`}>{lead.channel}</span>
                    </div>
                    <h4 className={`font-bold ${theme.textPrimary} group-hover:text-emerald-400 transition-colors mb-1`}>{lead.name}</h4>
                    <p className={`text-xs ${theme.textMuted} mb-3`}>Interesse em {lead.name === 'Ana Clara Silva' ? 'Imóvel Alto Padrão' : 'Consultoria'}</p>
                    <div className={`flex justify-between items-center pt-3 border-t ${theme.border}`}>
                      <span className={`text-sm font-black ${theme.textPrimary} italic`}>{lead.value}</span>
                      <div className={`w-6 h-6 rounded-full ${theme.bgButton} ${theme.border} border`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default Kanban
