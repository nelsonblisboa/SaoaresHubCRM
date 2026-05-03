import React, { useState, useEffect, useRef } from 'react'
import { 
  Search,
  Plus,
  MoreVertical,
  Filter,
  Trash2,
  Calendar,
  Pencil,
  X
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { supabase } from '../lib/supabaseClient'
import { supabaseService, Lead } from '../services/supabaseService'
import { useAuth } from '../contexts/AuthContext'
import { LeadForm } from '../components/LeadForm'

const COLUMNS = [
  { id: 'NOVO',           title: 'Novo',           color: 'bg-blue-500' },
  { id: 'QUALIFICADO',   title: 'Qualificado',     color: 'bg-amber-500' },
  { id: 'PROPOSTA',      title: 'Proposta',       color: 'bg-orange-500' },
  { id: 'NEGOCIACAO',   title: 'Negociação',     color: 'bg-rose-500' },
  { id: 'GANHO',         title: 'Ganho',          color: 'bg-emerald-500' },
]

const Kanban: React.FC = () => {
  const { showSuccess, showInfo, showError } = useToast()
  const theme = useThemeClasses()
  const { profile } = useAuth()
  
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showLeadModal, setShowLeadModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [schedulingLead, setSchedulingLead] = useState<Lead | null>(null)
  const dragLeadId = useRef<string | null>(null)

  useEffect(() => {
    if (!profile?.organization_id) return
    
    fetchLeads()
    const channel = supabase
      .channel('leads-kanban')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `organization_id=eq.${profile.organization_id}` // Filtrar por organização
      }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedLead = payload.new as Lead
          setLeads(prev => {
            const exists = prev.find(l => l.id === updatedLead.id)
            if (exists) {
              return prev.map(l => l.id === updatedLead.id ? updatedLead : l)
            }
            return [...prev, updatedLead]
          })
        } else if (payload.eventType === 'DELETE') {
          setLeads(prev => prev.filter(l => l.id !== (payload.old as Lead).id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.organization_id])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const data = await supabaseService.fetchLeads(profile?.organization_id || '')
      setLeads(data || [])
    } catch (error: any) {
      showInfo(error.message || 'Erro ao carregar leads')
    } finally {
      setLoading(false)
    }
  }

  /* ── Drag Handlers ── */
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    dragLeadId.current = leadId
    setDraggingId(leadId)
    e.dataTransfer.effectAllowed = 'move'
    setTimeout(() => {}, 0)
  }

  const handleDragEnd = () => {
    dragLeadId.current = null
    setDraggingId(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    const id = dragLeadId.current
    if (!id) return
    
    const lead = leads.find(l => l.id === id)
    if (!lead || lead.stage === targetStage) return
    
    // Salvar estado anterior para rollback
    const previousLeads = [...leads]
    
    try {
      // Optimistic update - atualizar UI imediatamente
      setLeads(prev => prev.map(l => 
        l.id === id ? { ...l, stage: targetStage as Lead['stage'] } : l
      ))
      
      // Fazer requisição
      await supabaseService.updateLead(id, { stage: targetStage as Lead['stage'] })
      showSuccess(`Lead movido para ${COLUMNS.find(c => c.id === targetStage)?.title}`)
    } catch (error: any) {
      // Rollback - reverter para estado anterior
      setLeads(previousLeads)
      showInfo(error.message || 'Erro ao atualizar lead')
    } finally {
      setDragOverColumn(null)
      setDraggingId(null)
      dragLeadId.current = null
    }
  }

  /* ── Helpers ── */
  const leadsInColumn = (stage: string) =>
    leads.filter(l => l.stage === stage && (
      searchQuery === '' ||
      l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.contact?.name && l.contact.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.contact?.phone_number && l.contact.phone_number.includes(searchQuery)) ||
      (l.contact?.instagram_username && l.contact.instagram_username.toLowerCase().includes(searchQuery.toLowerCase()))
    ))

  const tempStyle = (temp: string) =>
    temp === 'QUENTE' ? 'bg-orange-500/20 text-orange-500' :
    temp === 'MORNO'  ? 'bg-amber-500/20 text-amber-500' :
    'bg-blue-500/20 text-blue-500'

  const tempLabel = (temp: string) =>
    temp === 'QUENTE' ? '🔥 QUENTE' : temp === 'MORNO' ? '🌡️ MORNO' : '❄️ FRIO'

  const handleDelete = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead do Kanban?')) return
    try {
      await supabaseService.updateLead(leadId, { is_deleted: true } as any)
      showSuccess('Lead excluído do Kanban!')
      fetchLeads()
    } catch (error: any) {
      showError(error.message || 'Erro ao excluir lead')
    }
  }

  const handleSchedule = (lead: Lead) => {
    setSchedulingLead(lead)
    setShowScheduleModal(true)
  }

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead)
    setShowLeadModal(true)
  }

  if (loading) {
    return (
      <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className={theme.textMuted}>Carregando pipeline...</p>
        </main>
      </div>
    )
  }

  return (
    <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
      <Sidebar />
      
      <main className={`flex-1 flex flex-col ${theme.bgMain} overflow-hidden`}>
        {/* Header */}
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
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
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

        {/* Board */}
        <div className="flex-1 overflow-x-auto p-8 pt-4 flex gap-6 scrollbar-hide">
          {COLUMNS.map(col => {
            const colLeads = leadsInColumn(col.id)
            const isOver = dragOverColumn === col.id
            return (
              <div
                key={col.id}
                className="w-80 flex-shrink-0 flex flex-col gap-4"
                onDragOver={e => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, col.id)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold ${theme.textSecondary} uppercase text-xs tracking-widest`}>{col.title}</h3>
                    <span className={`${theme.bgCardSolid} ${theme.textMuted} text-[10px] px-2 py-0.5 rounded-full border ${theme.border}`}>
                      {colLeads.length}
                    </span>
                  </div>
                  <button 
                    onClick={() => showInfo('Opções da coluna em desenvolvimento')}
                    className={`p-1 ${theme.bgHover} rounded-lg transition-colors`}
                  >
                    <MoreVertical size={16} className={theme.iconMuted} />
                  </button>
                </div>

                {/* Drop zone */}
                <div
                  className={`
                    flex-1 rounded-3xl border p-3 space-y-3 overflow-y-auto scrollbar-hide
                    transition-all duration-200
                    ${isOver
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_0_2px_rgba(16,185,129,0.3)]'
                      : `${theme.bgCard} ${theme.border}`
                    }
                  `}
                  style={{ minHeight: '120px' }}
                >
                  {colLeads.length === 0 && (
                    <div className={`flex items-center justify-center h-20 text-xs ${theme.textMuted} opacity-50 select-none`}>
                      {isOver ? '✦ Soltar aqui' : 'Sem cards'}
                    </div>
                  )}

{colLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={e => handleDragStart(e, lead.id)}
                      onDragEnd={handleDragEnd}
                      className={`
                        ${theme.bgCardSolid} ${theme.border} border p-4 rounded-2xl
                        ${theme.borderHover} transition-all cursor-grab active:cursor-grabbing
                        group shadow-sm select-none
                        ${draggingId === lead.id ? 'opacity-40 scale-95' : 'opacity-100 hover:-translate-y-0.5 hover:shadow-md'}
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tempStyle(lead.temperature)}`}>
                          {tempLabel(lead.temperature)}
                        </span>
                        <div className="flex gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(lead) }}
                            className={`p-1.5 rounded-lg ${theme.bgHover} hover:text-emerald-500 transition-colors`}
                            title="Editar"
                          >
                            <Pencil size={12} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSchedule(lead) }}
                            className={`p-1.5 rounded-lg ${theme.bgHover} hover:text-blue-500 transition-colors`}
                            title="Agendar mensagem"
                          >
                            <Calendar size={12} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(lead.id) }}
                            className={`p-1.5 rounded-lg ${theme.bgHover} hover:text-rose-500 transition-colors`}
                            title="Excluir"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <h4 className={`font-bold ${theme.textPrimary} group-hover:text-emerald-400 transition-colors mb-1`}>
                        {lead.contact?.name || `Lead ${lead.id.slice(0, 8)}`}
                      </h4>
                      <p className={`text-xs ${theme.textMuted} mb-3`}>
                        {lead.contact?.phone_number || 'Sem telefone'}
                      </p>
                      <div className={`flex justify-between items-center pt-3 border-t ${theme.border}`}>
                        <span className={`text-sm font-black ${theme.textPrimary} italic`}>
                          Score: {lead.score}/10
                        </span>
                        <div className={`w-6 h-6 rounded-full ${theme.bgButton} ${theme.border} border`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Modal de Edição de Lead */}
      {showLeadModal && (
        <LeadForm
          lead={editingLead}
          onClose={() => { setShowLeadModal(false); setEditingLead(null) }}
          onSave={() => { setShowLeadModal(false); setEditingLead(null); fetchLeads() }}
        />
      )}

      {/* Modal de Agendamento de Mensagem */}
      {showScheduleModal && schedulingLead && (
        <ScheduleMessageModal
          lead={schedulingLead}
          onClose={() => { setShowScheduleModal(false); setSchedulingLead(null) }}
        />
      )}
    </div>
  )
}

// Modal de Agendamento de Mensagem
interface ScheduleMessageModalProps {
  lead: Lead
  onClose: () => void
}

const ScheduleMessageModal: React.FC<ScheduleMessageModalProps> = ({ lead, onClose }) => {
  const { showSuccess, showError } = useToast()
  const theme = useThemeClasses()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.organization_id || !message || !scheduleDate || !scheduleTime) return

    try {
      setLoading(true)
      
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()

      // Buscar contact_id do lead
      const { data: leadData } = await supabase
        .from('leads')
        .select('contact_id')
        .eq('id', lead.id)
        .single()

      if (!leadData?.contact_id) {
        throw new Error('Contato não encontrado para este lead')
      }

      const { error } = await supabase
        .from('scheduled_messages')
        .insert({
          content: message,
          channel: 'WHATSAPP',
          status: 'PENDING',
          scheduled_at: scheduledAt,
          contact_id: leadData.contact_id,
        })

      if (error) throw error

      showSuccess(`Mensagem agendada para ${new Date(scheduledAt).toLocaleString('pt-BR')}`)
      onClose()
    } catch (error: any) {
      showError(error.message || 'Erro ao agendar mensagem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${theme.bgCard} w-full max-w-md mx-4 rounded-3xl ${theme.border} border overflow-hidden`}>
        <div className={`flex items-center justify-between p-6 ${theme.border} border-b`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Calendar size={20} className="text-blue-400" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${theme.textPrimary}`}>Agendar Mensagem</h3>
              <p className={`text-xs ${theme.textMuted}`}>Para: {lead.contact?.name || 'Lead'}</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.bgHover} transition-colors`}>
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>Data</label>
            <input
              type="date"
              required
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-2.5 ${theme.bgCardSolid} ${theme.border} border rounded-xl text-sm ${theme.textPrimary} focus:ring-2 focus:ring-blue-500/50 focus:outline-none`}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>Horário</label>
            <input
              type="time"
              required
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className={`w-full px-4 py-2.5 ${theme.bgCardSolid} ${theme.border} border rounded-xl text-sm ${theme.textPrimary} focus:ring-2 focus:ring-blue-500/50 focus:outline-none`}
            />
          </div>
          <div>
            <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>Mensagem</label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite a mensagem a ser enviada..."
              rows={4}
              className={`w-full px-4 py-2.5 ${theme.bgCardSolid} ${theme.border} border rounded-xl text-sm ${theme.textPrimary} placeholder:${theme.textPlaceholder} focus:ring-2 focus:ring-blue-500/50 focus:outline-none resize-none`}
            />
          </div>
          <div className={`flex justify-end gap-3 pt-4 border-t ${theme.border}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2.5 rounded-xl ${theme.bgCardSolid} ${theme.border} border text-sm font-medium ${theme.textSecondary} ${theme.bgHover} transition-colors`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !message || !scheduleDate || !scheduleTime}
              className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Calendar size={16} />
              {loading ? 'Agendando...' : 'Agendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Kanban
