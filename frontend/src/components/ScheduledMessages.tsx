import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  Send, 
  X, 
  Plus, 
  Calendar,
  MessageSquare,
  Trash2,
  Edit,
  Play,
  Pause
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

interface ScheduledMessage {
  id: string
  content: string
  channel: string
  status: 'PENDING' | 'SENT' | 'CANCELLED' | 'FAILED'
  scheduled_at: string
  sent_at: string | null
  contact_id: string
  contact?: {
    name: string
    phone_number: string
  }
}

interface ScheduledMessagesProps {
  onClose: () => void
}

export const ScheduledMessages: React.FC<ScheduledMessagesProps> = ({ onClose }) => {
  const { showSuccess, showError } = useToast()
  const theme = useThemeClasses()
  const { profile } = useAuth()

  const [messages, setMessages] = useState<ScheduledMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)

  const [newMessage, setNewMessage] = useState({
    contact_id: '',
    content: '',
    channel: 'WHATSAPP',
    scheduled_at: ''
  })

  const [contacts, setContacts] = useState<{id: string, name: string, phone_number: string}[]>([])

  useEffect(() => {
    fetchScheduledMessages()
    fetchContacts()
  }, [])

  const fetchScheduledMessages = async () => {
    try {
      setLoading(true)
      
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', profile?.organization_id)

      const contactIds = contacts?.map(c => c.id) || []
      
      if (contactIds.length === 0) {
        setMessages([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('scheduled_messages')
        .select(`
          *,
          contact:contacts(name, phone_number)
        `)
        .in('contact_id', contactIds)
        .order('scheduled_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (err: any) {
      showError(err.message || 'Erro ao carregar mensagens agendadas')
    } finally {
      setLoading(false)
    }
  }

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, phone_number')
        .eq('organization_id', profile?.organization_id)
        .limit(100)

      if (error) throw error
      setContacts(data || [])
    } catch (err: any) {
      console.error('Erro ao buscar contatos:', err)
    }
  }

  const handleSchedule = async () => {
    if (!newMessage.contact_id || !newMessage.content || !newMessage.scheduled_at) {
      showError('Preencha todos os campos')
      return
    }

    try {
      const { error } = await supabase
        .from('scheduled_messages')
        .insert({
          content: newMessage.content,
          channel: newMessage.channel,
          status: 'PENDING',
          scheduled_at: newMessage.scheduled_at,
          contact_id: newMessage.contact_id
        })

      if (error) throw error

      showSuccess('Mensagem agendada!')
      setShowNewForm(false)
      setNewMessage({ contact_id: '', content: '', channel: 'WHATSAPP', scheduled_at: '' })
      fetchScheduledMessages()
    } catch (err: any) {
      showError(err.message || 'Erro ao agendar mensagem')
    }
  }

  const handleCancel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_messages')
        .update({ status: 'CANCELLED' })
        .eq('id', id)

      if (error) throw error
      showSuccess('Mensagem cancelada')
      fetchScheduledMessages()
    } catch (err: any) {
      showError(err.message || 'Erro ao cancelar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return
    
    try {
      const { error } = await supabase
        .from('scheduled_messages')
        .delete()
        .eq('id', id)

      if (error) throw error
      showSuccess('Mensagem excluída')
      fetchScheduledMessages()
    } catch (err: any) {
      showError(err.message || 'Erro ao excluir')
    }
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-blue-500/10 text-blue-500',
    SENT: 'bg-emerald-500/10 text-emerald-500',
    CANCELLED: 'bg-slate-500/10 text-slate-500',
    FAILED: 'bg-rose-500/10 text-rose-500'
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${theme.bgCard} border ${theme.border} rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Clock className="text-blue-500" size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${theme.textPrimary}`}>Mensagens Agendadas</h3>
              <p className={`text-xs ${theme.textMuted}`}>Gerencie envios programados</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl font-bold text-sm"
            >
              <Plus size={16} />
              Nova Mensagem
            </button>
            <button onClick={onClose} className={`p-2 ${theme.bgHover} rounded-lg`}>
              <X size={20} className={theme.textMuted} />
            </button>
          </div>
        </div>

        {/* New Message Form */}
        {showNewForm && (
          <div className={`p-6 border-b ${theme.border} ${theme.bgCardSolid}`}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`text-xs ${theme.textMuted} font-bold uppercase mb-2 block`}>Contato</label>
                <select
                  value={newMessage.contact_id}
                  onChange={e => setNewMessage({ ...newMessage, contact_id: e.target.value })}
                  className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary}`}
                >
                  <option value="">Selecione...</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone_number}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`text-xs ${theme.textMuted} font-bold uppercase mb-2 block`}>Canal</label>
                <select
                  value={newMessage.channel}
                  onChange={e => setNewMessage({ ...newMessage, channel: e.target.value })}
                  className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary}`}
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="INSTAGRAM">Instagram</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className={`text-xs ${theme.textMuted} font-bold uppercase mb-2 block`}>Data/Hora</label>
              <input
                type="datetime-local"
                value={newMessage.scheduled_at}
                onChange={e => setNewMessage({ ...newMessage, scheduled_at: e.target.value })}
                className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary}`}
              />
            </div>

            <div className="mb-4">
              <label className={`text-xs ${theme.textMuted} font-bold uppercase mb-2 block`}>Mensagem</label>
              <textarea
                value={newMessage.content}
                onChange={e => setNewMessage({ ...newMessage, content: e.target.value })}
                rows={3}
                placeholder="Digite a mensagem..."
                className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} resize-none`}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSchedule}
                className="px-6 py-2 bg-emerald-500 text-slate-950 rounded-xl font-bold"
              >
                Agendar
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                className={`px-6 py-2 ${theme.bgMain} ${theme.border} border rounded-xl ${theme.textSecondary}`}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className={theme.textMuted}>Carregando...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={48} className={`mx-auto mb-4 ${theme.textMuted} opacity-50`} />
              <p className={theme.textMuted}>Nenhuma mensagem agendada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`${theme.bgCardSolid} ${theme.border} border p-4 rounded-2xl`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className={`font-bold ${theme.textPrimary}`}>
                        {msg.contact?.name || 'Contato'}
                      </p>
                      <p className={`text-xs ${theme.textMuted}`}>
                        {msg.contact?.phone_number}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${statusColors[msg.status]}`}>
                      {msg.status}
                    </span>
                  </div>

                  <p className={`text-sm ${theme.textSecondary} mb-3 line-clamp-2`}>
                    {msg.content}
                  </p>

                  <div className={`flex items-center justify-between text-xs ${theme.textMuted}`}>
                    <div className="flex items-center gap-2">
                      <Calendar size={12} />
                      <span>
                        {new Date(msg.scheduled_at).toLocaleString('pt-BR')}
                      </span>
                      {msg.sent_at && (
                        <span className="text-emerald-500">
                          • Enviada: {new Date(msg.sent_at).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {msg.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(msg.id)}
                          className="p-1.5 text-amber-500 hover:text-amber-400"
                          title="Cancelar"
                        >
                          <Pause size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-400"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}