import React, { useState, useEffect } from 'react'
import { 
  Search,
  Filter,
  MoreVertical,
  CheckCheck,
  Plus
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { supabaseService } from '../services/supabaseService'

interface Conversation {
  id: string
  status: string
  is_ai_active: boolean
  last_message: string | null
  last_message_at: string | null
  contact_id: string
  contact?: { name: string }
}

const Conversations: React.FC = () => {
  const navigate = useNavigate()
  const { showInfo } = useToast()
  const theme = useThemeClasses()
  const { profile } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!profile?.organization_id) return
    fetchConversations()
  }, [profile?.organization_id])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      console.log('[Conversations] Fetching for org:', profile?.organization_id)
      // Usar supabaseService que já filtra por organização
      const data = await supabaseService.fetchConversations(profile!.organization_id)
      console.log('[Conversations] Found conversations:', data?.length, JSON.stringify(data, null, 2))
      setConversations(data || [])
    } catch (error: any) {
      console.error('[Conversations] Error:', error)
      showInfo(error.message || 'Erro ao carregar conversas')
    } finally {
      setLoading(false)
    }
  }

  const filteredConv = conversations.filter(c => 
    c.contact?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (c.last_message || '').toLowerCase().includes(search.toLowerCase())
  )

  const createTestConversation = async () => {
    if (!profile?.organization_id) {
      showInfo('Aguarde o perfil carregar...')
      return
    }
    
    try {
      const contactId = `test-contact-${Date.now()}`
      const convId = `test-conversation-${Date.now()}`
      const orgId = profile.organization_id
      
      // Criar contato de teste
      const { error: contactError } = await supabase.from('contacts').insert({
        id: contactId,
        name: `Cliente Teste ${Date.now().toString().slice(-4)}`,
        phone_number: `+55119${Math.floor(Math.random() * 90000000 + 10000000)}`,
        organization_id: orgId
      })
      
      if (contactError) {
        console.error('Erro contato:', contactError)
        showInfo('Erro ao criar contato: ' + contactError.message)
        return
      }
      
      // Criar conversa de teste (organization_id vem do contact)
      const { error: convError } = await supabase.from('conversations').insert({
        id: convId,
        contact_id: contactId,
        channel: 'WHATSAPP',
        status: 'ATIVA',
        is_ai_active: true
      })
      
      if (convError) {
        console.error('Erro conversa:', convError)
        showInfo('Erro ao criar conversa: ' + convError.message)
        return
      }
      
      showInfo('Conversa de teste criada!')
      fetchConversations()
    } catch (error: any) {
      console.error('Erro geral:', error)
      showInfo('Erro ao criar teste: ' + error.message)
    }
  }

  const getStatusText = (c: Conversation) => {
    if (!c.is_ai_active && c.status === 'AGUARDANDO_HUMANO') return 'Handover'
    if (c.is_ai_active) return 'IA Pilotando'
    return 'Humano'
  }

  const getStatusColor = (c: Conversation) => {
    if (!c.is_ai_active && c.status === 'AGUARDANDO_HUMANO') return 'bg-rose-500/10 text-rose-500'
    if (c.is_ai_active) return 'bg-emerald-500/10 text-emerald-500'
    return 'bg-blue-500/10 text-blue-500'
  }

  const getIndicatorColor = (c: Conversation) => {
    if (!c.is_ai_active && c.status === 'AGUARDANDO_HUMANO') return 'bg-rose-500 animate-pulse'
    if (c.is_ai_active) return 'bg-emerald-500'
    return 'bg-blue-500'
  }

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays} dias atrás`
    return date.toLocaleDateString('pt-BR')
  }

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
                placeholder="Buscar conversas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${theme.bgCard} ${theme.border} pl-10 pr-4 py-2 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-64`}
              />
            </div>
            <button 
              onClick={createTestConversation}
              className={`${theme.bgCard} ${theme.border} px-4 py-2 rounded-xl ${theme.textSecondary} font-medium flex items-center gap-2 ${theme.bgHover} transition-colors`}
            >
              <Plus size={18} />
              Criar Teste
            </button>
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
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className={theme.textMuted}>Carregando...</p>
            </div>
          ) : (
            filteredConv.map((c) => (
              <div 
                key={c.id}
                onClick={() => navigate(`/chat/${c.id}`)}
                className={`${theme.bgCard} ${theme.border} p-4 rounded-3xl flex items-center gap-6 ${theme.bgHover} hover:border-slate-800 transition-all group cursor-pointer`}
              >
                <div className="relative">
                  <div className={`w-14 h-14 rounded-full bg-slate-800 border border-slate-700 shadow-inner flex items-center justify-center font-bold text-emerald-500`}>
                    {c.contact?.name?.charAt(0) || '?'}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 ${theme.bgMain} ${getIndicatorColor(c)}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className={`text-lg font-bold ${theme.textPrimary} group-hover:text-emerald-400 transition-colors truncate`}>{c.contact?.name || 'Sem nome'}</h4>
                    <span className={`text-xs ${theme.textMuted} font-mono shrink-0`}>{formatTime(c.last_message_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCheck size={14} className="text-emerald-500 shrink-0" />
                    <p className={`text-sm ${theme.textMuted} truncate`}>{c.last_message || 'Sem mensagens'}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${getStatusColor(c)}`}>
                    {getStatusText(c)}
                  </span>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    showInfo('Opções da conversa em desenvolvimento')
                  }}
                  className={`p-2 text-slate-700 hover:${theme.textPrimary} transition-colors`}
                >
                  <MoreVertical size={20} />
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

export default Conversations
