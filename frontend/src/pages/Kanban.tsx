import React, { useState, useRef } from 'react'
import { 
  Search,
  Plus,
  MoreVertical,
  Filter
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'

interface Lead {
  id: number
  name: string
  value: string
  temp: 'QUENTE' | 'MORNO' | 'FRIO'
  channel: string
  interest: string
  column: string
}

const COLUMNS = [
  { id: 'prospeccao',   title: 'Prospecção' },
  { id: 'qualificacao', title: 'Qualificação' },
  { id: 'proposta',     title: 'Proposta' },
  { id: 'negociacao',   title: 'Negociação' },
  { id: 'fechamento',   title: 'Fechamento' },
]

const INITIAL_LEADS: Lead[] = [
  { id: 1, name: 'Ana Clara Silva',  value: 'R$ 15.000', temp: 'QUENTE', channel: 'WhatsApp', interest: 'Imóvel Alto Padrão', column: 'prospeccao' },
  { id: 2, name: 'Roberto Carlos',   value: 'R$ 42.000', temp: 'QUENTE', channel: 'Instagram', interest: 'Consultoria',       column: 'prospeccao' },
  { id: 3, name: 'Marcos Paulo',     value: 'R$ 8.500',  temp: 'MORNO',  channel: 'WhatsApp', interest: 'Consultoria',       column: 'prospeccao' },
  { id: 4, name: 'Juliana Lima',     value: 'R$ 25.000', temp: 'FRIO',   channel: 'WhatsApp', interest: 'Consultoria',       column: 'prospeccao' },
]

const Kanban: React.FC = () => {
  const { showSuccess, showInfo } = useToast()
  const theme = useThemeClasses()

  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const dragLeadId = useRef<number | null>(null)

  /* ── Drag handlers ── */
  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    dragLeadId.current = leadId
    setDraggingId(leadId)
    e.dataTransfer.effectAllowed = 'move'
    // small delay so the ghost image renders before the element fades
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
    // only clear if leaving the column container itself
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault()
    const id = dragLeadId.current
    if (id === null) return

    setLeads(prev => {
      const lead = prev.find(l => l.id === id)
      if (!lead || lead.column === targetColumn) return prev
      showSuccess(`${lead.name} movido para ${COLUMNS.find(c => c.id === targetColumn)?.title}`)
      return prev.map(l => l.id === id ? { ...l, column: targetColumn } : l)
    })

    setDragOverColumn(null)
    setDraggingId(null)
    dragLeadId.current = null
  }

  /* ── Helpers ── */
  const leadsInColumn = (colId: string) =>
    leads.filter(l => l.column === colId && (
      searchQuery === '' ||
      l.name.toLowerCase().includes(searchQuery.toLowerCase())
    ))

  const tempStyle = (temp: string) =>
    temp === 'QUENTE' ? 'bg-orange-500/20 text-orange-500' :
    temp === 'MORNO'  ? 'bg-amber-500/20 text-amber-500'  :
                        'bg-blue-500/20 text-blue-500'

  const tempLabel = (temp: string) =>
    temp === 'QUENTE' ? '🔥 QUENTE' : temp === 'MORNO' ? '🌡️ MORNO' : '❄️ FRIO'

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
                      onClick={() => showSuccess(`Lead ${lead.name} selecionado`)}
                      className={`
                        ${theme.bgCardSolid} ${theme.border} border p-4 rounded-2xl
                        ${theme.borderHover} transition-all cursor-grab active:cursor-grabbing
                        group shadow-sm select-none
                        ${draggingId === lead.id ? 'opacity-40 scale-95' : 'opacity-100 hover:-translate-y-0.5 hover:shadow-md'}
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${tempStyle(lead.temp)}`}>
                          {tempLabel(lead.temp)}
                        </span>
                        <span className={`text-[10px] ${theme.textMuted} font-medium`}>{lead.channel}</span>
                      </div>
                      <h4 className={`font-bold ${theme.textPrimary} group-hover:text-emerald-400 transition-colors mb-1`}>{lead.name}</h4>
                      <p className={`text-xs ${theme.textMuted} mb-3`}>Interesse em {lead.interest}</p>
                      <div className={`flex justify-between items-center pt-3 border-t ${theme.border}`}>
                        <span className={`text-sm font-black ${theme.textPrimary} italic`}>{lead.value}</span>
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
