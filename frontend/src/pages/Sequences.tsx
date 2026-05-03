import React, { useState, useEffect, ChangeEvent } from 'react'
import {
  ListOrdered,
  Plus,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Zap,
  ToggleLeft,
  ToggleRight,
  Trash2
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { supabase } from '../lib/supabaseClient'

interface SequenceStep {
  id: string
  order: number
  delay_minutes: number
  message_template: string | null
  channel: string
  use_ai: boolean
  ai_prompt: string | null
}

interface Sequence {
  id: string
  name: string
  trigger: string
  is_active: boolean
  steps?: SequenceStep[]
  _count?: {
    enrollments: number
  }
}

const TRIGGER_LABELS: Record<string, string> = {
  'lead_cold_5days': 'Lead frio há 5+ dias',
  'no_reply_48h': 'Sem resposta há 48h',
  'post_qualification': 'Após qualificação',
  'post_proposal': 'Após envio de proposta',
  'new_lead': 'Novo lead capturado',
  'handover_resolved': 'Após handover resolvido',
}

const Sequences: React.FC = () => {
  const { showSuccess, showError, showInfo } = useToast()
  const theme = useThemeClasses()
  
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  
  // Form state for new sequence
  const [newName, setNewName] = useState('')
  const [newTrigger, setNewTrigger] = useState('no_reply_48h')
  const [newSteps, setNewSteps] = useState<{
    delay_minutes: number
    message_template: string
    channel: string
    use_ai: boolean
    ai_prompt: string
  }[]>([
    { delay_minutes: 60, message_template: '', channel: 'WHATSAPP', use_ai: true, ai_prompt: 'Envie uma mensagem amigável de follow-up' }
  ])

  useEffect(() => {
    fetchSequences()
  }, [])

  const fetchSequences = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sequences')
        .select(`
          *,
          steps:sequence_steps(*)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Buscar enrollments separadamente
      if (data && data.length > 0) {
        const sequenceIds = data.map(s => s.id)
        const { data: enrollData } = await supabase
          .from('sequence_enrollments')
          .select('sequence_id, status')
          .in('sequence_id', sequenceIds)
        
        // Calcular totais por sequência
        const enrollCounts: Record<string, { total: number, completed: number }> = {}
        enrollData?.forEach(e => {
          if (!enrollCounts[e.sequence_id]) {
            enrollCounts[e.sequence_id] = { total: 0, completed: 0 }
          }
          enrollCounts[e.sequence_id].total++
          if (e.status === 'COMPLETED') {
            enrollCounts[e.sequence_id].completed++
          }
        })
        
        // Adicionar contagens aos dados
        data.forEach(seq => {
          seq._count = { enrollments: enrollCounts[seq.id]?.total || 0 }
        })
      }
      
      setSequences(data || [])
    } catch (error: any) {
      showInfo(error.message || 'Erro ao carregar sequências')
    } finally {
      setLoading(false)
    }
  }

  const toggleSequence = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('sequences')
        .update({ is_active: !currentActive })
        .eq('id', id)
      
      if (error) throw error
      
      showSuccess(`Sequência ${!currentActive ? 'ativada' : 'pausada'}!`)
      fetchSequences()
    } catch (error: any) {
      showError(error.message || 'Erro ao atualizar sequência')
    }
  }

  const handleCreateSequence = async () => {
    if (!newName) {
      showError('Digite o nome da sequência')
      return
    }

    try {
      // Create sequence
      const { data, error } = await supabase
        .from('sequences')
        .insert({
          name: newName,
          trigger: newTrigger,
          is_active: true
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Create steps
      if (data && newSteps.length > 0) {
        const { error: stepsError } = await supabase
          .from('sequence_steps')
          .insert(
            newSteps.map((step, index) => ({
              sequence_id: data.id,
              order: index + 1,
              delay_minutes: step.delay_minutes,
              message_template: step.message_template || null,
              channel: step.channel,
              use_ai: step.use_ai,
              ai_prompt: step.use_ai ? step.ai_prompt : null
            }))
          )
        
        if (stepsError) throw stepsError
      }
      
      showSuccess('Sequência criada com sucesso!')
      setShowNewModal(false)
      setNewName('')
      setNewSteps([{ delay_minutes: 60, message_template: '', channel: 'WHATSAPP', use_ai: true, ai_prompt: '' }])
      fetchSequences()
    } catch (error: any) {
      showError(error.message || 'Erro ao criar sequência')
    }
  }

  const handleDeleteSequence = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a sequência "${name}"?`)) return
    
    try {
      const { error } = await supabase
        .from('sequences')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      showSuccess('Sequência excluída com sucesso!')
      fetchSequences()
    } catch (error: any) {
      showError(error.message || 'Erro ao excluir sequência')
    }
  }

  const addStep = () => {
    setNewSteps(prev => [...prev, {
      delay_minutes: 1440,
      message_template: '',
      channel: 'WHATSAPP',
      use_ai: true,
      ai_prompt: ''
    }])
  }

  const removeStep = (index: number) => {
    if (newSteps.length > 1) {
      setNewSteps(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateStep = (index: number, field: string, value: any) => {
    setNewSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const formatDelay = (mins: number) => {
    if (mins === 0) return 'Imediato'
    if (mins < 60) return `${mins}min`
    if (mins < 1440) return `${Math.round(mins / 60)}h`
    return `${Math.round(mins / 1440)}d`
  }

  const totalEnrolled = sequences.reduce((s, seq) => s + (seq._count?.enrollments || 0), 0)
  const totalCompleted = 0 // Calculado separadamente se necessário
  const activeSequences = sequences.filter(s => s.is_active).length

  return (
    <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
      <Sidebar />
      
      <main className={`flex-1 overflow-y-auto p-8 ${theme.bgMain} scrollbar-hide`}>
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className={`text-3xl font-black ${theme.textPrimary} tracking-tight`}>Sequências de Follow-up</h2>
            <p className={theme.textMuted}>Automações multi-step com mensagens geradas por IA.</p>
          </div>
          <button 
            onClick={() => setShowNewModal(true)}
            className="bg-emerald-500 text-slate-950 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={18} />
            Nova Sequência
          </button>
        </header>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Sequências Ativas', value: activeSequences, total: sequences.length },
            { label: 'Leads Inscritos', value: totalEnrolled },
            { label: 'Concluídas', value: totalCompleted },
          ].map((kpi) => (
            <div key={kpi.label} className={`${theme.bgCard} ${theme.border} border p-5 rounded-2xl`}>
              <p className={`text-[10px] ${theme.textMuted} font-bold uppercase tracking-widest mb-2`}>{kpi.label}</p>
              <p className={`text-2xl font-black ${theme.textPrimary}`}>{kpi.value}</p>
              {kpi.total !== undefined && (
                <p className={`text-[10px] ${theme.textMuted} mt-1`}>/{kpi.total}</p>
              )}
            </div>
          ))}
        </div>

        {/* Sequences List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className={theme.textMuted}>Carregando sequências...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sequences.map((seq) => {
              const isExpanded = expandedId === seq.id
              return (
                <div
                  key={seq.id}
                  className={`${theme.bgCard} ${theme.border} border rounded-3xl overflow-hidden transition-all`}
                >
                  {/* Header */}
                  <div
                    className="p-5 flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : seq.id)}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSequence(seq.id, seq.is_active) }}
                        className="transition-colors"
                      >
                        {seq.is_active ? (
                          <ToggleRight size={28} className="text-emerald-500" />
                        ) : (
                          <ToggleLeft size={28} className={theme.textMuted} />
                        )}
                      </button>
                      <div>
                        <h3 className={`font-bold ${theme.textPrimary}`}>{seq.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            seq.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                          }`}>
                            {seq.is_active ? 'Ativa' : 'Pausada'}
                          </span>
                          <span className={`text-[10px] ${theme.textMuted} flex items-center gap-1`}>
                            <Zap size={10} /> {TRIGGER_LABELS[seq.trigger] || seq.trigger}
                          </span>
                          <span className={`text-[10px] ${theme.textMuted}`}>
                            {seq.steps?.length || 0} passos
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-xs ${theme.textPrimary} font-black`}>{seq._count?.enrollments || 0}</p>
                        <p className={`text-[10px] ${theme.textMuted}`}>inscritos</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSequence(seq.id, seq.name) }}
                        className="p-2 text-rose-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      {isExpanded ? <ChevronDown size={18} className={theme.textMuted} /> : <ChevronRight size={18} className={theme.textMuted} />}
                    </div>
                  </div>

                  {/* Expanded Steps */}
                  {isExpanded && (
                    <div className={`px-5 pb-5 border-t ${theme.border}`}>
                      <div className="pt-4 space-y-3">
                        {seq.steps?.map((step) => (
                          <div key={step.id} className={`${theme.bgCardSolid} rounded-xl p-4`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500`}>
                                Passo {step.order}
                              </span>
                              <span className={`text-[10px] ${theme.textMuted} flex items-center gap-1`}>
                                <Clock size={10} /> {formatDelay(step.delay_minutes)}
                              </span>
                            </div>
                            <p className={`text-sm ${theme.textPrimary}`}>
                              {step.use_ai ? (
                                <span className="italic flex items-center gap-1">
                                  <Sparkles size={12} className="text-purple-500" /> {step.ai_prompt}
                                </span>
                              ) : (
                                step.message_template
                              )}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                step.use_ai ? 'bg-purple-500/10 text-purple-500' : 'bg-slate-500/10 text-slate-500'
                              }`}>
                                {step.use_ai ? '🤖 IA Gera' : '📝 Template'}
                              </span>
                              <span className={`text-[10px] ${theme.textMuted}`}>{step.channel}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* New Sequence Modal */}
        {showNewModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowNewModal(false)}>
            <div className={`${theme.bgCardSolid} ${theme.border} border rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
              <h3 className={`text-xl font-bold ${theme.textPrimary} mb-6 flex items-center gap-2`}>
                <ListOrdered className="text-emerald-500" size={24} />
                Nova Sequência de Follow-up
              </h3>
             
              <div className="space-y-5">
                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>Nome da Sequência</label>
                  <input
                    type="text"
                    placeholder="Ex: Reengajamento de leads frios"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} outline-none focus:border-emerald-500/50 transition-colors`}
                  />
                </div>

                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>Gatilho (Trigger)</label>
                  <select
                    value={newTrigger}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewTrigger(e.target.value)}
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} outline-none focus:border-emerald-500/50 transition-colors`}
                  >
                    {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Steps */}
                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-3 block`}>Passos da Sequência</label>
                  <div className="space-y-3">
                    {newSteps.map((step, i) => (
                      <div key={i} className={`${theme.bgCard} ${theme.border} border p-4 rounded-2xl`}>
                        <div className="flex items-start justify-between mb-3">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500`}>
                            Passo {i + 1}
                          </span>
                          {newSteps.length > 1 && (
                            <button 
                              onClick={() => removeStep(i)}
                              className="text-rose-500 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className={`text-[10px] ${theme.textMuted} font-bold uppercase mb-1 block`}>Delay</label>
                            <select
                              value={step.delay_minutes}
                              onChange={(e: ChangeEvent<HTMLSelectElement>) => updateStep(i, 'delay_minutes', Number(e.target.value))}
                              className={`w-full ${theme.bgMain} ${theme.border} border rounded-lg px-3 py-2 text-xs ${theme.textPrimary} outline-none`}
                            >
                              <option value={0}>Imediato</option>
                              <option value={30}>30 min</option>
                              <option value={60}>1 hora</option>
                              <option value={180}>3 horas</option>
                              <option value={1440}>1 dia</option>
                              <option value={2880}>2 dias</option>
                              <option value={4320}>3 dias</option>
                              <option value={10080}>7 dias</option>
                            </select>
                          </div>
                          <div>
                            <label className={`text-[10px] ${theme.textMuted} font-bold uppercase mb-1 block`}>Canal</label>
                            <select
                              value={step.channel}
                              onChange={(e: ChangeEvent<HTMLSelectElement>) => updateStep(i, 'channel', e.target.value)}
                              className={`w-full ${theme.bgMain} ${theme.border} border rounded-lg px-3 py-2 text-xs ${theme.textPrimary} outline-none`}
                            >
                              <option value="WHATSAPP">WhatsApp</option>
                              <option value="INSTAGRAM">Instagram</option>
                            </select>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className={`text-[10px] ${theme.textMuted} font-bold uppercase mb-1 flex items-center gap-1`}>
                            <Sparkles size={10} className="text-purple-500" /> Prompt da IA
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Descreva o que a IA deve enviar..."
                            value={step.ai_prompt}
                            onChange={(e) => updateStep(i, 'ai_prompt', e.target.value)}
                            className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 text-sm ${theme.textPrimary} placeholder:${theme.textMuted} outline-none focus:border-emerald-500/50 transition-colors resize-none`}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={step.use_ai}
                            onChange={(e) => updateStep(i, 'use_ai', e.target.checked)}
                            className="rounded border-emerald-500 text-emerald-500 focus:ring-emerald-500"
                          />
                          <span className={`text-xs ${theme.textMuted}`}>Usar IA para gerar mensagem</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={addStep}
                    className={`mt-3 w-full ${theme.bgMain} ${theme.border} border border-dashed rounded-xl py-2 text-xs font-bold ${theme.textMuted} hover:text-emerald-500 transition-colors flex items-center justify-center gap-2`}
                  >
                    <Plus size={14} />
                    Adicionar Passo
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={handleCreateSequence}
                  className="flex-1 bg-emerald-500 text-slate-950 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Criar Sequência
                </button>
                <button 
                  onClick={() => setShowNewModal(false)}
                  className={`${theme.bgMain} ${theme.border} border px-6 py-3 rounded-xl ${theme.textSecondary} font-medium ${theme.bgHover} transition-colors`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default Sequences
