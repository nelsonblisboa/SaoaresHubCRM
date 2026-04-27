import React, { useState } from 'react'
import {
  ListOrdered,
  Plus,
  Play,
  Pause,
  Clock,
  MessageCircle,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Zap,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  Trash2
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'

interface SequenceStep {
  id: string
  order: number
  delayMinutes: number
  messageTemplate: string
  channel: string
  useAi: boolean
  aiPrompt?: string
}

interface Sequence {
  id: string
  name: string
  trigger: string
  isActive: boolean
  steps: SequenceStep[]
  totalEnrolled: number
  totalCompleted: number
}

const triggerLabels: Record<string, string> = {
  'lead_cold_5days': 'Lead frio há 5+ dias',
  'no_reply_48h': 'Sem resposta há 48h',
  'post_qualification': 'Após qualificação',
  'post_proposal': 'Após envio de proposta',
  'new_lead': 'Novo lead capturado',
  'handover_resolved': 'Após handover resolvido',
}

const Sequences: React.FC = () => {
  const { showSuccess, showInfo } = useToast()
  const theme = useThemeClasses()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)

  // Form state for new sequence
  const [newName, setNewName] = useState('')
  const [newTrigger, setNewTrigger] = useState('no_reply_48h')
  const [newSteps, setNewSteps] = useState<{ delayMinutes: number; messageTemplate: string; channel: string; useAi: boolean; aiPrompt: string }[]>([
    { delayMinutes: 60, messageTemplate: '', channel: 'WHATSAPP', useAi: true, aiPrompt: 'Envie uma mensagem amigável de follow-up' }
  ])

  const [sequences, setSequences] = useState<Sequence[]>([
    {
      id: '1', name: 'Reengajamento Leads Frios', trigger: 'lead_cold_5days', isActive: true,
      totalEnrolled: 87, totalCompleted: 34,
      steps: [
        { id: 's1', order: 1, delayMinutes: 0, messageTemplate: '', channel: 'WHATSAPP', useAi: true, aiPrompt: 'Envie mensagem de valor sem pedir nada' },
        { id: 's2', order: 2, delayMinutes: 2880, messageTemplate: '', channel: 'WHATSAPP', useAi: true, aiPrompt: 'Compartilhe case de sucesso relevante' },
        { id: 's3', order: 3, delayMinutes: 4320, messageTemplate: 'Oi {{nome}}, vi que você tinha interesse em {{interesse}}. Temos novidades! Quer saber mais?', channel: 'WHATSAPP', useAi: false },
      ]
    },
    {
      id: '2', name: 'Follow-up Sem Resposta', trigger: 'no_reply_48h', isActive: true,
      totalEnrolled: 156, totalCompleted: 89,
      steps: [
        { id: 's4', order: 1, delayMinutes: 0, messageTemplate: '', channel: 'WHATSAPP', useAi: true, aiPrompt: 'Pergunte se a pessoa ainda tem interesse' },
        { id: 's5', order: 2, delayMinutes: 1440, messageTemplate: '', channel: 'WHATSAPP', useAi: true, aiPrompt: 'Envie um benefício exclusivo por tempo limitado' },
      ]
    },
    {
      id: '3', name: 'Pós-Qualificação', trigger: 'post_qualification', isActive: false,
      totalEnrolled: 45, totalCompleted: 12,
      steps: [
        { id: 's6', order: 1, delayMinutes: 30, messageTemplate: '', channel: 'WHATSAPP', useAi: true, aiPrompt: 'Agradeça e envie resumo da conversa' },
        { id: 's7', order: 2, delayMinutes: 1440, messageTemplate: '', channel: 'WHATSAPP', useAi: true, aiPrompt: 'Envie proposta personalizada' },
        { id: 's8', order: 3, delayMinutes: 4320, messageTemplate: '', channel: 'WHATSAPP', useAi: true, aiPrompt: 'Follow-up da proposta' },
      ]
    },
  ])

  const toggleSequence = (id: string) => {
    setSequences(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s))
    showSuccess('Sequência atualizada!')
  }

  const addStep = () => {
    setNewSteps(prev => [...prev, {
      delayMinutes: 1440,
      messageTemplate: '',
      channel: 'WHATSAPP',
      useAi: true,
      aiPrompt: ''
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
            className="bg-emerald-500 text-slate-950 px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Nova Sequência
          </button>
        </header>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Sequências Ativas', value: sequences.filter(s => s.isActive).length, total: sequences.length },
            { label: 'Leads Inscritos', value: sequences.reduce((s, seq) => s + seq.totalEnrolled, 0) },
            { label: 'Concluídas', value: sequences.reduce((s, seq) => s + seq.totalCompleted, 0) },
          ].map((kpi) => (
            <div key={kpi.label} className={`${theme.bgCard} ${theme.border} border p-5 rounded-2xl`}>
              <p className={`text-[10px] ${theme.textMuted} font-bold uppercase tracking-wider mb-2`}>{kpi.label}</p>
              <p className={`text-2xl font-black ${theme.textPrimary}`}>
                {kpi.value}
                {'total' in kpi && <span className={`text-sm font-medium ${theme.textMuted}`}> / {kpi.total}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Sequences List */}
        <div className="space-y-4">
          {sequences.map((seq) => {
            const isExpanded = expandedId === seq.id
            return (
              <div key={seq.id} className={`${theme.bgCard} ${theme.border} border rounded-2xl overflow-hidden transition-all`}>
                {/* Header */}
                <div
                  className={`p-5 flex items-center justify-between cursor-pointer ${theme.bgHover} transition-colors`}
                  onClick={() => setExpandedId(isExpanded ? null : seq.id)}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSequence(seq.id) }}
                      className="transition-colors"
                    >
                      {seq.isActive ? (
                        <ToggleRight size={28} className="text-emerald-500" />
                      ) : (
                        <ToggleLeft size={28} className={theme.textMuted} />
                      )}
                    </button>
                    <div>
                      <h3 className={`font-bold ${theme.textPrimary}`}>{seq.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          seq.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'
                        }`}>
                          {seq.isActive ? 'Ativa' : 'Pausada'}
                        </span>
                        <span className={`text-[10px] ${theme.textMuted} flex items-center gap-1`}>
                          <Zap size={10} /> {triggerLabels[seq.trigger] || seq.trigger}
                        </span>
                        <span className={`text-[10px] ${theme.textMuted}`}>
                          {seq.steps.length} passos
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`text-xs ${theme.textMuted}`}>Inscritos</p>
                      <p className={`font-bold ${theme.textPrimary}`}>{seq.totalEnrolled}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs ${theme.textMuted}`}>Concluídos</p>
                      <p className="font-bold text-emerald-500">{seq.totalCompleted}</p>
                    </div>
                    {isExpanded ? <ChevronDown size={18} className={theme.textMuted} /> : <ChevronRight size={18} className={theme.textMuted} />}
                  </div>
                </div>

                {/* Expanded Steps */}
                {isExpanded && (
                  <div className={`px-5 pb-5 border-t ${theme.border}`}>
                    <div className="pt-4 space-y-3">
                      {seq.steps.map((step, i) => (
                        <div key={step.id} className="flex items-start gap-4">
                          {/* Timeline */}
                          <div className="flex flex-col items-center pt-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                              i === 0 ? 'bg-emerald-500 text-slate-950' : `${theme.bgCardSolid} ${theme.textMuted}`
                            }`}>
                              {step.order}
                            </div>
                            {i < seq.steps.length - 1 && (
                              <div className="w-px h-8 bg-slate-700 my-1" />
                            )}
                          </div>

                          {/* Step Content */}
                          <div className={`flex-1 ${theme.bgCardSolid} rounded-xl p-4`}>
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-500 flex items-center gap-1`}>
                                <Clock size={10} /> {formatDelay(step.delayMinutes)}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                step.useAi ? 'bg-purple-500/10 text-purple-500' : 'bg-slate-500/10 text-slate-500'
                              } flex items-center gap-1`}>
                                {step.useAi ? <><Sparkles size={10} /> IA</> : <><MessageCircle size={10} /> Template</>}
                              </span>
                              <span className={`text-[10px] ${theme.textMuted}`}>{step.channel}</span>
                            </div>
                            <p className={`text-sm ${theme.textPrimary}`}>
                              {step.useAi ? (
                                <span className="italic">{step.aiPrompt}</span>
                              ) : (
                                step.messageTemplate
                              )}
                            </p>
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

        {/* New Sequence Modal */}
        {showNewModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNewModal(false)}>
            <div className={`${theme.bgCardSolid} ${theme.border} border rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
              <h3 className={`text-xl font-black ${theme.textPrimary} mb-6 flex items-center gap-3`}>
                <ListOrdered className="text-emerald-500" size={24} />
                Nova Sequência de Follow-up
              </h3>

              <div className="space-y-5">
                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-wider mb-2 block`}>Nome da Sequência</label>
                  <input
                    type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="Ex: Reengajamento de leads frios"
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none`}
                  />
                </div>

                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-wider mb-2 block`}>Gatilho (Trigger)</label>
                  <select
                    value={newTrigger} onChange={e => setNewTrigger(e.target.value)}
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} focus:border-emerald-500/50 focus:outline-none`}
                  >
                    {Object.entries(triggerLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Steps */}
                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-wider mb-3 block`}>Passos da Sequência</label>
                  <div className="space-y-4">
                    {newSteps.map((step, i) => (
                      <div key={i} className={`${theme.bgMain} ${theme.border} border rounded-xl p-4`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-bold ${theme.textPrimary} flex items-center gap-2`}>
                            <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">{i + 1}</span>
                            Passo {i + 1}
                          </span>
                          {newSteps.length > 1 && (
                            <button onClick={() => removeStep(i)} className="text-rose-500 hover:text-rose-400">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div>
                            <label className={`text-[10px] ${theme.textMuted} font-bold uppercase mb-1 block`}>Delay</label>
                            <select
                              value={step.delayMinutes} onChange={e => updateStep(i, 'delayMinutes', Number(e.target.value))}
                              className={`w-full ${theme.bgCardSolid} ${theme.border} border rounded-lg px-3 py-2 text-sm ${theme.textPrimary} focus:outline-none`}
                            >
                              <option value={0}>Imediato</option>
                              <option value={30}>30 min</option>
                              <option value={60}>1 hora</option>
                              <option value={180}>3 horas</option>
                              <option value={720}>12 horas</option>
                              <option value={1440}>1 dia</option>
                              <option value={2880}>2 dias</option>
                              <option value={4320}>3 dias</option>
                              <option value={10080}>7 dias</option>
                            </select>
                          </div>
                          <div>
                            <label className={`text-[10px] ${theme.textMuted} font-bold uppercase mb-1 block`}>Canal</label>
                            <select
                              value={step.channel} onChange={e => updateStep(i, 'channel', e.target.value)}
                              className={`w-full ${theme.bgCardSolid} ${theme.border} border rounded-lg px-3 py-2 text-sm ${theme.textPrimary} focus:outline-none`}
                            >
                              <option value="WHATSAPP">WhatsApp</option>
                              <option value="INSTAGRAM">Instagram</option>
                            </select>
                          </div>
                          <div>
                            <label className={`text-[10px] ${theme.textMuted} font-bold uppercase mb-1 block`}>Tipo</label>
                            <select
                              value={step.useAi ? 'ai' : 'template'} onChange={e => updateStep(i, 'useAi', e.target.value === 'ai')}
                              className={`w-full ${theme.bgCardSolid} ${theme.border} border rounded-lg px-3 py-2 text-sm ${theme.textPrimary} focus:outline-none`}
                            >
                              <option value="ai">🤖 IA Gera</option>
                              <option value="template">📝 Template</option>
                            </select>
                          </div>
                        </div>

                        {step.useAi ? (
                          <div>
                            <label className={`text-[10px] ${theme.textMuted} font-bold uppercase mb-1 flex items-center gap-1`}>
                              <Sparkles size={10} className="text-purple-500" /> Prompt da IA
                            </label>
                            <input
                              type="text" value={step.aiPrompt} onChange={e => updateStep(i, 'aiPrompt', e.target.value)}
                              placeholder="Descreva o que a IA deve enviar..."
                              className={`w-full ${theme.bgCardSolid} ${theme.border} border rounded-lg px-3 py-2 text-sm ${theme.textPrimary} placeholder:text-slate-600 focus:outline-none`}
                            />
                          </div>
                        ) : (
                          <div>
                            <label className={`text-[10px] ${theme.textMuted} font-bold uppercase mb-1 block`}>Mensagem Template</label>
                            <textarea
                              rows={2} value={step.messageTemplate} onChange={e => updateStep(i, 'messageTemplate', e.target.value)}
                              placeholder="Use {{nome}}, {{interesse}} para personalizar..."
                              className={`w-full ${theme.bgCardSolid} ${theme.border} border rounded-lg px-3 py-2 text-sm ${theme.textPrimary} placeholder:text-slate-600 focus:outline-none resize-none`}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addStep}
                    className={`mt-3 w-full ${theme.bgMain} ${theme.border} border border-dashed rounded-xl py-3 text-xs font-bold ${theme.textMuted} hover:border-emerald-500/50 hover:text-emerald-500 transition-colors flex items-center justify-center gap-2`}
                  >
                    <Plus size={14} /> Adicionar Passo
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowNewModal(false)
                    showSuccess('Sequência criada com sucesso!')
                    setNewName('')
                    setNewSteps([{ delayMinutes: 60, messageTemplate: '', channel: 'WHATSAPP', useAi: true, aiPrompt: '' }])
                  }}
                  className="flex-1 bg-emerald-500 text-slate-950 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
                >
                  Criar Sequência
                </button>
                <button
                  onClick={() => setShowNewModal(false)}
                  className={`${theme.bgMain} ${theme.border} border px-6 py-3 rounded-xl ${theme.textMuted} font-bold ${theme.bgHover} transition-colors`}
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
