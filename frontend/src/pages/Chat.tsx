import React from 'react'
import { 
  Search,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  Info,
  Circle,
  Zap
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'

const Chat: React.FC = () => {
  const { showSuccess, showInfo } = useToast()
  const theme = useThemeClasses()
  const contacts = [
    { name: 'Ana Clara Silva', lastMsg: 'Qual o valor da entrada?', time: '10:42', active: true, online: true, unread: 2 },
    { name: 'Roberto Carlos', lastMsg: 'Vou enviar os documentos.', time: '09:15', online: true },
    { name: 'Marcos Paulo', lastMsg: 'Pode me ligar mais tarde?', time: 'Ontem' },
    { name: 'Juliana Lima', lastMsg: 'Obrigada pelo retorno!', time: 'Ontem' },
  ]

  const messages = [
    { text: 'Olá Ana! Sou o assistente IA do Soares Hub. Como posso te ajudar hoje?', type: 'ai', time: '10:30' },
    { text: 'Oi! Tenho interesse no imóvel de alto padrão que vi no anúncio.', type: 'user', time: '10:35' },
    { text: 'Excelente escolha! Esse imóvel possui 4 suítes e vista definitiva para o mar. Qual o valor da entrada que você planeja?', type: 'ai', time: '10:36' },
    { text: 'Qual o valor da entrada?', type: 'user', time: '10:42' },
  ]

  return (
    <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
      <Sidebar />

      {/* Conversations List Panel */}
      <div className={`w-80 ${theme.bgCard} ${theme.border} border-r flex flex-col shrink-0`}>
        <div className="p-6 pb-4">
          <h2 className={`text-xl font-bold ${theme.textPrimary} mb-4`}>Conversas</h2>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={16} />
            <input 
              type="text" 
              placeholder="Buscar chat..."
              className={`w-full bg-slate-800/50 border border-slate-700 pl-10 pr-4 py-2 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {contacts.map((c, i) => (
            <div 
              key={i} 
              className={`p-4 flex items-center gap-4 cursor-pointer border-b ${theme.border} transition-colors ${
                c.active ? 'bg-emerald-500/10 border-r-2 border-r-emerald-500' : 'hover:bg-slate-800/30'
              }`}
            >
              <div className="relative">
                <div className={`w-12 h-12 rounded-full bg-slate-800 border border-slate-700`} />
                {c.online && <div className={`absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 ${theme.bgMain}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <h4 className={`text-sm font-bold ${theme.textPrimary} truncate`}>{c.name}</h4>
                  <span className={`text-[10px] ${theme.textMuted}`}>{c.time}</span>
                </div>
                <p className={`text-xs ${theme.textMuted} truncate`}>{c.lastMsg}</p>
              </div>
              {c.unread && (
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {c.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Window */}
      <main className={`flex-1 flex flex-col ${theme.bgMain} relative`}>
        <header className={`p-6 border-b ${theme.border} flex justify-between items-center ${theme.bgMain}/80 backdrop-blur-md z-10`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full bg-slate-800 border border-slate-700`} />
            <div>
              <h3 className={`font-bold ${theme.textPrimary}`}>Ana Clara Silva</h3>
              <div className="flex items-center gap-2">
                <Circle size={8} className="fill-emerald-500 text-emerald-500" />
                <span className={`text-[10px] ${theme.textMuted} uppercase font-bold tracking-widest`}>IA Ativa • Qualificando</span>
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-4 ${theme.textMuted}`}>
            <button 
              onClick={() => showInfo('Chamada de voz em desenvolvimento')}
              className="hover:text-emerald-400 transition-colors"
            ><Phone size={20} /></button>
            <button 
              onClick={() => showInfo('Videochamada em desenvolvimento')}
              className="hover:text-emerald-400 transition-colors"
            ><Video size={20} /></button>
            <button 
              onClick={() => showInfo('Informações do contato')}
              className="hover:text-emerald-400 transition-colors"
            ><Info size={20} /></button>
            <button 
              onClick={() => showInfo('Mais opções')}
              className="hover:text-emerald-400 transition-colors"
            ><MoreVertical size={20} /></button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] space-y-1`}>
                <div className={`p-4 rounded-2xl relative ${
                  m.type === 'user' 
                    ? `bg-slate-800 ${theme.textPrimary} rounded-tr-none shadow-sm` 
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-slate-200 rounded-tl-none'
                }`}>
                  {m.type === 'ai' && (
                    <span className="absolute -top-6 left-0 text-[10px] font-black text-emerald-500 tracking-widest flex items-center gap-1 uppercase">
                      <Zap size={10} /> Soares Hub AI
                    </span>
                  )}
                  <p className="text-sm leading-relaxed">{m.text}</p>
                </div>
                <p className={`text-[10px] text-slate-600 ${m.type === 'user' ? 'text-right' : 'text-left'}`}>
                  {m.time}
                </p>
              </div>
            </div>
          ))}
          
          {/* AI Typing Indicator */}
          <div className="flex justify-start">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">IA processando...</span>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className={`p-6 ${theme.bgMain}`}>
          <div className={`${theme.bgCard} ${theme.border} rounded-3xl p-2 flex items-center gap-2 shadow-2xl`}>
            <button 
              onClick={() => showInfo('Anexo em desenvolvimento')}
              className={`p-3 ${theme.textMuted} hover:text-emerald-500 transition-colors`}
            >
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              placeholder="Digite uma mensagem ou deixe a IA responder..."
              className={`flex-1 bg-transparent border-none outline-none text-sm ${theme.textPrimary} px-2`}
            />
            <button 
              onClick={() => showInfo('Emojis em desenvolvimento')}
              className={`p-3 ${theme.textMuted} hover:text-emerald-500 transition-colors`}
            >
              <Smile size={20} />
            </button>
            <button 
              onClick={() => showSuccess('Mensagem enviada!')}
              className="bg-emerald-500 text-slate-950 p-3 rounded-2xl font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="mt-4 flex justify-center">
            <div className={`${theme.bgCard} ${theme.border} px-4 py-2 rounded-full flex items-center gap-3`}>
              <span className={`text-[10px] ${theme.textMuted} uppercase font-bold tracking-widest`}>Modo Ativo:</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => showSuccess('Modo IA Piloto ativado')}
                  className="text-[10px] px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black uppercase"
                >IA Piloto</button>
                <button 
                  onClick={() => showSuccess('Modo Manual ativado')}
                  className={`text-[10px] px-3 py-1 rounded-full bg-slate-800 ${theme.textMuted} font-black uppercase hover:${theme.textPrimary} transition-colors`}
                >Manual</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Chat
