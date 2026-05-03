import React, { useState, useEffect, useRef } from 'react'
import { 
  Search,
  Plus,
  MoreVertical,
  Filter
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { supabase } from '../lib/supabaseClient'
import { supabaseService, Lead } from '../services/supabaseService'
import { useAuth } from '../contexts/AuthContext'

const COLUMNS = [
  { id: 'NOVO',           title: 'Novo',           color: 'bg-blue-500' },
  { id: 'QUALIFICADO',   title: 'Qualificado',     color: 'bg-amber-500' },
  { id: 'PROPOSTA',      title: 'Proposta',       color: 'bg-orange-500' },
  { id: 'NEGOCIACAO',   title: 'Negociação',     color: 'bg-rose-500' },
  { id: 'GANHO',         title: 'Ganho',          color: 'bg-emerald-500' },
]

const Kanban: React.FC = () => {
  const { showSuccess, showInfo } = useToast()
  const theme = useThemeClasses()
  const { profile } = useAuth()
  
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
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
    const previousStage = lead.stage
    
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
                      onClick={() => showSuccess(`Lead "${lead.contact?.name || lead.id}" selecionado`)}
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
                        <span className={`text-[10px] ${theme.textMuted} font-medium`}>Score: {lead.score}</span>
                      </div>
<h4 className={`font-bold ${theme.textPrimary} group-hover:text-emerald-400 transition-colors mb-1`}>
                          {lead.contact?.name || `Lead ${lead.id.slice(0, 8)}`}
                        </h4>
                      <p className={`text-xs ${theme.textMuted} mb-3`}>
                        Estágio: {lead.stage} | Temp: {lead.temperature}
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
    </div>
  )
}

export default Kanban
