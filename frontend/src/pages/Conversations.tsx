import React from 'react'
import { 
  Search,
  Filter,
  MoreVertical,
  CheckCheck
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'

const Conversations: React.FC = () => {
  const { showSuccess, showInfo } = useToast()
  const theme = useThemeClasses()
  const conversations = [
    { name: 'Ana Clara Silva', lastMsg: 'Qual o valor da entrada?', time: '10:42', status: 'ai', unread: 2 },
    { name: 'Roberto Carlos', lastMsg: 'Vou enviar os documentos agora.', time: '09:15', status: 'human' },
    { name: 'Marcos Paulo', lastMsg: 'Pode me ligar mais tarde?', time: 'Ontem', status: 'ai' },
    { name: 'Juliana Lima', lastMsg: 'Obrigada pelo retorno!', time: 'Ontem', status: 'human' },
    { name: 'Ricardo Santos', lastMsg: 'Quanto custa a mensalidade?', time: 'Ontem', status: 'ai' },
    { name: 'Beatriz Costa', lastMsg: 'Quero agendar uma visita.', time: '2 dias ago', status: 'handover' },
  ]

  return (
    <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
      <Sidebar />

      {/* Main Content */}
      <main className={`flex-1 flex flex-col ${theme.bgMain}`}>
        <header className="p-8 pb-4 flex justify-between items-center">
          <div>
            <h2 className={`text-3xl font-black ${theme.textPrimary} tracking-tight`}>Conversas</h2>
            <p className={theme.textMuted}>Central de atendimento e qualificação AI.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={18} />
              <input 
                type="text" 
                placeholder="Filtrar conversas..."
                className={`${theme.bgCard} ${theme.border} pl-10 pr-4 py-2 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-64`}
              />
            </div>
            <button className={`${theme.bgCard} ${theme.border} px-4 py-2 rounded-xl ${theme.textSecondary} font-medium flex items-center gap-2 ${theme.bgHover} transition-colors`}>
              <Filter size={18} />
              Filtros
            </button>
          </div>
        </header>

        {/* Filters Tabs */}
        <div className={`px-8 py-4 flex gap-4 border-b ${theme.border}`}>
          {['Todas', 'Aguardando IA', 'Humano Necessário', 'Finalizadas'].map((tab, i) => (
             <button 
              key={tab} 
              onClick={() => showInfo(`Filtro: ${tab}`)}
              className={`text-xs font-bold uppercase tracking-widest pb-2 px-1 transition-all ${
              i === 0 ? 'text-emerald-500 border-b-2 border-emerald-500' : `${theme.textMuted} hover:${theme.textSecondary}`
            }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-3">
          {conversations.map((c, i) => (
            <a 
              key={i}
              href={`/chat/${i}`}
              onClick={() => showSuccess(`Abrindo conversa com ${c.name}`)}
              className={`${theme.bgCard} ${theme.border} p-4 rounded-3xl flex items-center gap-6 ${theme.bgHover} hover:border-slate-800 transition-all group`}
            >
              <div className="relative">
                <div className={`w-14 h-14 rounded-full bg-slate-800 border border-slate-700 shadow-inner`} />
                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 ${theme.bgMain} ${
                  c.status === 'ai' ? 'bg-emerald-500' : c.status === 'handover' ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'
                }`} />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className={`text-lg font-bold ${theme.textPrimary} group-hover:text-emerald-400 transition-colors`}>{c.name}</h4>
                  <span className={`text-xs ${theme.textMuted} font-mono`}>{c.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCheck size={14} className="text-emerald-500" />
                  <p className={`text-sm ${theme.textMuted} truncate max-w-md`}>{c.lastMsg}</p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${
                  c.status === 'ai' ? 'bg-emerald-500/10 text-emerald-500' : 
                  c.status === 'handover' ? 'bg-rose-500/10 text-rose-500' : 
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  {c.status === 'ai' ? 'IA Pilotando' : c.status === 'handover' ? 'Handover' : 'Humano'}
                </span>
                {c.unread && (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center">
                    {c.unread}
                  </div>
                )}
              </div>
              
              <button 
                onClick={(e) => {
                  e.preventDefault()
                  showInfo('Opções da conversa em desenvolvimento')
                }}
                className={`p-2 text-slate-700 hover:${theme.textPrimary} transition-colors`}
              >
                <MoreVertical size={20} />
              </button>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}

export default Conversations
