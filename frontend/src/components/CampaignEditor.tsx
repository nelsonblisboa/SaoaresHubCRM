import React, { useState, useEffect } from 'react'
import { 
  X, 
  Save, 
  Trash2, 
  Plus, 
  MessageSquare, 
  Sparkles,
  Users,
  Clock,
  Send,
  Pause,
  Play,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Copy,
  Download
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

interface CampaignStep {
  id?: string
  delay_hours: number
  message_template: string
  use_ai: boolean
  ai_prompt: string
}

interface CampaignEditorProps {
  campaignId?: string
  onClose: () => void
  onSave: () => void
}

export const CampaignEditor: React.FC<CampaignEditorProps> = ({ 
  campaignId, 
  onClose, 
  onSave 
}) => {
  const { showSuccess, showError } = useToast()
  const theme = useThemeClasses()
  const { profile } = useAuth()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'audience' | 'schedule' | 'stats'>('content')

  const [campaign, setCampaign] = useState({
    name: '',
    status: 'RASCUNHO' as const,
    channel: 'WHATSAPP' as const,
    ai_prompt: '',
    segment: {
      temperature: [] as string[],
      stage: [] as string[],
      score_min: 0,
      score_max: 10,
      tags: [] as string[]
    }
  })

  const [steps, setSteps] = useState<CampaignStep[]>([
    { delay_hours: 0, message_template: '', use_ai: true, ai_prompt: '' }
  ])

  const [scheduling, setScheduling] = useState({
    start_date: '',
    end_date: '',
    timezone: 'America/Sao_Paulo',
    sending_window_start: '09:00',
    sending_window_end: '18:00'
  })

  const [stats, setStats] = useState({
    total_recipients: 0,
    sent: 0,
    delivered: 0,
    opened: 0,
    replied: 0,
    converted: 0
  })

  useEffect(() => {
    if (campaignId) {
      loadCampaign()
    }
  }, [campaignId])

  const loadCampaign = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (error) throw error

      if (data) {
        setCampaign({
          name: data.name || '',
          status: data.status || 'RASCUNHO',
          channel: data.channel || 'WHATSAPP',
          ai_prompt: data.ai_prompt || '',
          segment: data.segment || {}
        })

        if (data.segment) {
          setScheduling(prev => ({
            ...prev,
            start_date: data.scheduled_at || ''
          }))
        }
      }
    } catch (err: any) {
      showError(err.message || 'Erro ao carregar campanha')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!campaign.name.trim()) {
      showError('Nome da campanha é obrigatório')
      return
    }

    try {
      setSaving(true)

      const campaignData = {
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        ai_prompt: campaign.ai_prompt,
        segment: campaign.segment,
        scheduled_at: scheduling.start_date || null
      }

      if (campaignId) {
        const { error } = await supabase
          .from('campanhas')
          .update(campaignData)
          .eq('id', campaignId)

        if (error) throw error
        showSuccess('Campanha atualizada!')
      } else {
        const { data, error } = await supabase
          .from('campanhas')
          .insert({
            ...campaignData,
            organization_id: profile?.organization_id
          })
          .select()
          .single()

        if (error) throw error
        showSuccess('Campanha criada!')
        onSave()
      }

      onSave()
    } catch (err: any) {
      showError(err.message || 'Erro ao salvar campanha')
    } finally {
      setSaving(false)
    }
  }

  const handleSendNow = async () => {
    if (!campaignId) {
      showError('Salve a campanha primeiro')
      return
    }

    try {
      setLoading(true)
      
      const { data: contacts, error: contactError } = await supabase
        .from('contacts')
        .select('id, phone_number')
        .eq('organization_id', profile?.organization_id)

      if (contactError) throw contactError

      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const response = await fetch(`${backendUrl}/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ 
          contact_ids: contacts?.map(c => c.id) || []
        })
      })

      if (!response.ok) throw new Error('Erro ao enviar')

      showSuccess('Campanha sendo enviada!')
      setCampaign(prev => ({ ...prev, status: 'ATIVA' }))
    } catch (err: any) {
      showError(err.message || 'Erro ao enviar campanha')
    } finally {
      setLoading(false)
    }
  }

  const addStep = () => {
    setSteps(prev => [...prev, { 
      delay_hours: prev.length > 0 ? prev[prev.length - 1].delay_hours + 24 : 0,
      message_template: '',
      use_ai: true,
      ai_prompt: ''
    }])
  }

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateStep = (index: number, field: string, value: any) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const previewAudience = async () => {
    try {
      let query = supabase
        .from('leads')
        .select('id, contact:contacts(name, phone_number)', { count: 'exact' })
        .eq('organization_id', profile?.organization_id)

      if (campaign.segment.temperature?.length > 0) {
        query = query.in('temperature', campaign.segment.temperature)
      }
      if (campaign.segment.stage?.length > 0) {
        query = query.in('stage', campaign.segment.stage)
      }

      const { count, error } = await query
      if (error) throw error

      setStats(prev => ({ ...prev, total_recipients: count || 0 }))
      return count || 0
    } catch (err: any) {
      console.error('Erro ao buscar audiência:', err)
      return 0
    }
  }

  useEffect(() => {
    if (activeTab === 'audience') {
      previewAudience()
    }
  }, [activeTab, campaign.segment])

  const tabs = [
    { id: 'content', label: 'Conteúdo', icon: MessageSquare },
    { id: 'audience', label: 'Audiência', icon: Users },
    { id: 'schedule', label: 'Agendamento', icon: Clock },
    { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${theme.bgCard} border ${theme.border} rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <MessageSquare className="text-emerald-500" size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${theme.textPrimary}`}>
                {campaignId ? 'Editar Campanha' : 'Nova Campanha'}
              </h3>
              <p className={`text-xs ${theme.textMuted}`}>
                {campaign.status === 'ATIVA' ? '🔴 Ativa' : 
                 campaign.status === 'AGENDADA' ? '🔵 Agendada' : '📝 Rascunho'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 ${theme.bgHover} rounded-lg`}>
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${theme.border} px-6`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <tab.icon size={16} />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB: Conteúdo */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div>
                <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>
                  Nome da Campanha
                </label>
                <input
                  type="text"
                  value={campaign.name}
                  onChange={e => setCampaign({ ...campaign, name: e.target.value })}
                  placeholder="Ex: Follow-up de urgência"
                  className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} outline-none focus:border-emerald-500`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>
                    Canal
                  </label>
                  <select
                    value={campaign.channel}
                    onChange={e => setCampaign({ ...campaign, channel: e.target.value as any })}
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} outline-none`}
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="AMBOS">Ambos</option>
                  </select>
                </div>
                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>
                    Status
                  </label>
                  <select
                    value={campaign.status}
                    onChange={e => setCampaign({ ...campaign, status: e.target.value as any })}
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} outline-none`}
                  >
                    <option value="RASCUNHO">Rascunho</option>
                    <option value="AGENDADA">Agendada</option>
                    <option value="ATIVA">Ativa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 flex items-center gap-2`}>
                  <Sparkles size={14} className="text-purple-500" />
                  Prompt Global da IA
                </label>
                <textarea
                  value={campaign.ai_prompt}
                  onChange={e => setCampaign({ ...campaign, ai_prompt: e.target.value })}
                  rows={3}
                  placeholder="Instruções gerais para a IA gerar as mensagens..."
                  className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary} outline-none resize-none`}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest`}>
                    Mensagens da Campanha
                  </label>
                  <button
                    onClick={addStep}
                    className="text-xs text-emerald-500 hover:text-emerald-400 flex items-center gap-1"
                  >
                    <Plus size={14} /> Adicionar passo
                  </button>
                </div>

                <div className="space-y-4">
                  {steps.map((step, idx) => (
                    <div key={idx} className={`${theme.bgCardSolid} ${theme.border} border p-4 rounded-2xl`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500`}>
                          Passo {idx + 1}
                        </span>
                        {steps.length > 1 && (
                          <button
                            onClick={() => removeStep(idx)}
                            className="text-rose-500 hover:text-rose-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="mb-3">
                        <label className={`text-[10px] ${theme.textMuted} font-bold uppercase mb-1 block`}>
                          Delay (horas após envio anterior)
                        </label>
                        <input
                          type="number"
                          value={step.delay_hours}
                          onChange={e => updateStep(idx, 'delay_hours', parseInt(e.target.value) || 0)}
                          className={`w-full ${theme.bgMain} ${theme.border} border rounded-lg px-3 py-2 ${theme.textPrimary} text-sm`}
                          min={0}
                        />
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <input
                          type="checkbox"
                          checked={step.use_ai}
                          onChange={e => updateStep(idx, 'use_ai', e.target.checked)}
                          className="rounded border-emerald-500"
                        />
                        <span className={`text-xs ${theme.textMuted}`}>Gerar com IA</span>
                      </div>

                      {step.use_ai ? (
                        <div>
                          <label className={`text-[10px] ${theme.textMuted} font-bold uppercase mb-1 block`}>
                            Prompt para esta mensagem
                          </label>
                          <textarea
                            value={step.ai_prompt}
                            onChange={e => updateStep(idx, 'ai_prompt', e.target.value)}
                            rows={2}
                            placeholder="O que a IA deve dizer neste passo..."
                            className={`w-full ${theme.bgMain} ${theme.border} border rounded-lg px-3 py-2 ${theme.textPrimary} text-sm resize-none`}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className={`text-[10px] ${theme.textMuted} font-bold uppercase mb-1 block`}>
                            Template da mensagem
                          </label>
                          <textarea
                            value={step.message_template}
                            onChange={e => updateStep(idx, 'message_template', e.target.value)}
                            rows={2}
                            placeholder="Digite a mensagem fixa..."
                            className={`w-full ${theme.bgMain} ${theme.border} border rounded-lg px-3 py-2 ${theme.textPrimary} text-sm resize-none`}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Audiência */}
          {activeTab === 'audience' && (
            <div className="space-y-6">
              <div className={`p-4 ${theme.bgCardSolid} rounded-xl flex items-center justify-between`}>
                <div>
                  <p className={`text-xs ${theme.textMuted} uppercase font-bold`}>Público Estimado</p>
                  <p className={`text-2xl font-black ${theme.textPrimary}`}>{stats.total_recipients}</p>
                </div>
                <Users size={32} className={theme.textMuted} />
              </div>

              <div>
                <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-3 block`}>
                  Temperatura do Lead
                </label>
                <div className="flex gap-3">
                  {['QUENTE', 'MORNO', 'FRIO'].map(temp => (
                    <label key={temp} className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={campaign.segment.temperature.includes(temp)}
                        onChange={e => {
                          const temps = e.target.checked
                            ? [...campaign.segment.temperature, temp]
                            : campaign.segment.temperature.filter(t => t !== temp)
                          setCampaign({ ...campaign, segment: { ...campaign.segment, temperature: temps } })
                        }}
                        className="rounded border-emerald-500"
                      />
                      <span className={`text-sm ${theme.textSecondary} ${
                        temp === 'QUENTE' ? 'text-orange-400' :
                        temp === 'MORNO' ? 'text-amber-400' : 'text-blue-400'
                      }`}>{temp}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-3 block`}>
                  Estágio do Funil
                </label>
                <div className="flex gap-3 flex-wrap">
                  {['NOVO', 'QUALIFICADO', 'PROPOSTA', 'NEGOCIACAO'].map(stage => (
                    <label key={stage} className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={campaign.segment.stage.includes(stage)}
                        onChange={e => {
                          const stages = e.target.checked
                            ? [...campaign.segment.stage, stage]
                            : campaign.segment.stage.filter(s => s !== stage)
                          setCampaign({ ...campaign, segment: { ...campaign.segment, stage: stages } })
                        }}
                        className="rounded border-emerald-500"
                      />
                      <span className={`text-sm ${theme.textSecondary}`}>{stage}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>
                    Score Mínimo
                  </label>
                  <input
                    type="number"
                    value={campaign.segment.score_min}
                    onChange={e => setCampaign({ 
                      ...campaign, 
                      segment: { ...campaign.segment, score_min: parseInt(e.target.value) || 0 } 
                    })}
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary}`}
                    min={0}
                    max={10}
                  />
                </div>
                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>
                    Score Máximo
                  </label>
                  <input
                    type="number"
                    value={campaign.segment.score_max}
                    onChange={e => setCampaign({ 
                      ...campaign, 
                      segment: { ...campaign.segment, score_max: parseInt(e.target.value) || 10 } 
                    })}
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary}`}
                    min={0}
                    max={10}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: Agendamento */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>
                    Data de Início
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduling.start_date}
                    onChange={e => setScheduling({ ...scheduling, start_date: e.target.value })}
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary}`}
                  />
                </div>
                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>
                    Data de Término (opcional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduling.end_date}
                    onChange={e => setScheduling({ ...scheduling, end_date: e.target.value })}
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>
                    Início do Envio
                  </label>
                  <input
                    type="time"
                    value={scheduling.sending_window_start}
                    onChange={e => setScheduling({ ...scheduling, sending_window_start: e.target.value })}
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary}`}
                  />
                </div>
                <div>
                  <label className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest mb-2 block`}>
                    Término do Envio
                  </label>
                  <input
                    type="time"
                    value={scheduling.sending_window_end}
                    onChange={e => setScheduling({ ...scheduling, sending_window_end: e.target.value })}
                    className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary}`}
                  />
                </div>
              </div>

              <div className={`p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl`}>
                <p className={`text-sm text-blue-400`}>
                  💡 Os envios serão distribuídos dentro da janela de horário definida para evitar bloqueios.
                </p>
              </div>
            </div>
          )}

          {/* TAB: Estatísticas */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className={`${theme.bgCardSolid} p-4 rounded-xl text-center`}>
                  <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-1`}>Enviadas</p>
                  <p className={`text-2xl font-black ${theme.textPrimary}`}>{stats.sent}</p>
                </div>
                <div className={`${theme.bgCardSolid} p-4 rounded-xl text-center`}>
                  <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-1`}>Entregues</p>
                  <p className={`text-2xl font-black ${theme.textPrimary}`}>{stats.delivered}</p>
                </div>
                <div className={`${theme.bgCardSolid} p-4 rounded-xl text-center`}>
                  <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-1`}>Respondidas</p>
                  <p className={`text-2xl font-black ${theme.textPrimary}`}>{stats.replied}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={`${theme.bgCardSolid} p-4 rounded-xl text-center`}>
                  <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-1`}>Taxa de Abertura</p>
                  <p className={`text-2xl font-black text-blue-400`}>
                    {stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className={`${theme.bgCardSolid} p-4 rounded-xl text-center`}>
                  <p className={`text-xs ${theme.textMuted} uppercase font-bold mb-1`}>Taxa de Conversão</p>
                  <p className={`text-2xl font-black text-emerald-400`}>
                    {stats.delivered > 0 ? ((stats.converted / stats.delivered) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              <div className={`p-4 ${theme.bgCardSolid} rounded-xl`}>
                <p className={`text-xs ${theme.textMuted} mb-2`}>Progresso</p>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${stats.sent > 0 ? (stats.sent / stats.total_recipients) * 100 : 0}%` }}
                  />
                </div>
                <p className={`text-xs ${theme.textMuted} mt-2`}>
                  {stats.sent} de {stats.total_recipients} mensagens enviadas
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-between gap-3 p-6 border-t ${theme.border}`}>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl ${theme.textMuted} hover:${theme.textSecondary} transition-colors`}
            >
              Cancelar
            </button>
          </div>
          <div className="flex gap-2">
            {campaignId && campaign.status === 'RASCUNHO' && (
              <button
                onClick={handleSendNow}
                disabled={loading || saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-bold transition-colors"
              >
                <Send size={16} />
                {loading ? 'Enviando...' : 'Enviar Agora'}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition-colors"
            >
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}