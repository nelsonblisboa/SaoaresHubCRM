/**
 * SOARES HUB CRM - LeadForm Component
 * Formulário para cadastro manual de Leads
 */

import React, { useState, useEffect } from 'react'
import { 
  X, 
  Save,
  UserPlus,
  Phone,
  Instagram,
  Mail,
  MapPin,
  DollarSign
} from 'lucide-react'
import { supabaseService, Lead } from '../services/supabaseService'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../contexts/AuthContext'
import { useThemeClasses } from '../hooks/useThemeClasses'

interface LeadFormProps {
  lead?: Lead | null  // Se provided, modo edição
  onClose: () => void
  onSave: () => void
}

interface FormData {
  // Dados do Contato
  name: string
  phone: string
  instagram: string
  email: string
  source: string
  
  // Dados do Lead
  stage: 'NOVO' | 'QUALIFICADO' | 'PROPOSTA' | 'NEGOCIACAO' | 'GANHO' | 'PERDIDO'
  score: number
  temperature: 'QUENTE' | 'MORNO' | 'FRIO'
  deal_value: string
  notes: string
  funnel_stage: string
}

const STAGES = [
  { value: 'NOVO', label: 'Novo', color: 'text-blue-500' },
  { value: 'QUALIFICADO', label: 'Qualificado', color: 'text-amber-500' },
  { value: 'PROPOSTA', label: 'Proposta', color: 'text-orange-500' },
  { value: 'NEGOCIACAO', label: 'Negociação', color: 'text-rose-500' },
  { value: 'GANHO', label: 'Ganho', color: 'text-emerald-500' },
  { value: 'PERDIDO', label: 'Perdido', color: 'text-slate-500' },
]

const TEMPERATURES = [
  { value: 'QUENTE', label: '🔥 Quente', color: 'text-orange-500' },
  { value: 'MORNO', label: '🌡️ Morno', color: 'text-amber-500' },
  { value: 'FRIO', label: '❄️ Frio', color: 'text-blue-500' },
]

const SOURCES = [
  { value: 'manual', label: 'Manual' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'referral', label: 'Indicação' },
  { value: 'website', label: 'Site' },
]

const FUNNEL_STAGES = [
  { value: 'QUALIFICACAO', label: 'Qualificação' },
  { value: 'OBJECOES', label: 'Objeções' },
  { value: 'PROPOSTA', label: 'Proposta' },
  { value: 'FOLLOWUP', label: 'Follow-up' },
  { value: 'FECHAMENTO', label: 'Fechamento' },
]

export const LeadForm: React.FC<LeadFormProps> = ({ lead, onClose, onSave }) => {
  const { showSuccess, showError } = useToast()
  const { profile } = useAuth()
  const theme = useThemeClasses()
  
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    instagram: '',
    email: '',
    source: 'manual',
    stage: 'NOVO',
    score: 1,
    temperature: 'FRIO',
    deal_value: '',
    notes: '',
    funnel_stage: 'QUALIFICACAO',
  })

  // Se está editando, carregar dados
  useEffect(() => {
    if (lead?.contact) {
      setFormData(prev => ({
        ...prev,
        name: lead.contact.name || '',
        phone: lead.contact.phone_number || '',
        instagram: lead.contact.instagram_username || '',
        stage: lead.stage,
        score: lead.score,
        temperature: lead.temperature,
        deal_value: lead.deal_value?.toString() || '',
        notes: lead.notes || '',
        funnel_stage: lead.funnel_stage || 'QUALIFICACAO',
      }))
    }
  }, [lead])

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.organization_id) return

    try {
      setLoading(true)

      let contactId = lead?.contact_id

      // 1. Criar ou buscar contato
      if (!contactId) {
        // Verificar se contato já existe
        if (formData.phone) {
          const { data: existingContacts } = await supabaseService['supabase']
            .from('contacts')
            .select('id')
            .eq('phone_number', formData.phone)
            .eq('organization_id', profile.organization_id)
            .single()

          if (existingContacts?.id) {
            contactId = existingContacts.id
          }
        }

        // Criar novo contato
        if (!contactId) {
          const { data: newContact, error: contactError } = await supabaseService['supabase']
            .from('contacts')
            .insert({
              name: formData.name,
              phone_number: formData.phone || null,
              instagram_username: formData.instagram || null,
              source: formData.source,
              tags: [formData.source],
              organization_id: profile.organization_id,
            })
            .select()
            .single()

          if (contactError) throw contactError
          contactId = newContact.id
        }
      }

      // 2. Criar ou atualizar lead
      if (lead) {
        // Atualizar lead existente
        await supabaseService.updateLead(lead.id, {
          stage: formData.stage,
          score: formData.score,
          temperature: formData.temperature,
          deal_value: formData.deal_value ? parseFloat(formData.deal_value) : null,
          notes: formData.notes || null,
          funnel_stage: formData.funnel_stage,
        })
        showSuccess('Lead atualizado com sucesso!')
      } else {
        // Criar novo lead
        await supabaseService.createLead({
          stage: formData.stage,
          score: formData.score,
          temperature: formData.temperature,
          deal_value: formData.deal_value ? parseFloat(formData.deal_value) : null,
          notes: formData.notes || null,
          funnel_stage: formData.funnel_stage,
          contact_id: contactId!,
          organization_id: profile.organization_id,
        })
        showSuccess('Lead cadastrado com sucesso!')
      }

      onSave()
      onClose()

    } catch (error: any) {
      showError(error.message || 'Erro ao salvar lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${theme.bgCard} w-full max-w-2xl mx-4 rounded-3xl ${theme.border} border overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 ${theme.border} border-b`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <UserPlus size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${theme.textPrimary}`}>
                {lead ? 'Editar Lead' : 'Novo Lead'}
              </h3>
              <p className={`text-xs ${theme.textMuted}`}>
                {lead ? 'Atualize os dados do lead' : 'Cadastre um novo lead manualmente'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.bgHover} transition-colors`}
          >
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Seção: Dados do Contato */}
          <div>
            <h4 className={`text-sm font-bold ${theme.textSecondary} mb-4 flex items-center gap-2`}>
              <Phone size={16} />
              Dados do Contato
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div>
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>
                  Nome Completo *
                </label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: João Silva"
                  className={`w-full px-4 py-2.5 ${theme.bgCardSolid} ${theme.border} border rounded-xl text-sm ${theme.textPrimary} placeholder:${theme.textPlaceholder} focus:ring-2 focus:ring-emerald-500/50 focus:outline-none`}
                />
              </div>

              {/* Telefone */}
              <div>
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>
                  WhatsApp / Telefone *
                </label>
                <input
                  required
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Ex: 5511999999999"
                  className={`w-full px-4 py-2.5 ${theme.bgCardSolid} ${theme.border} border rounded-xl text-sm ${theme.textPrimary} placeholder:${theme.textPlaceholder} focus:ring-2 focus:ring-emerald-500/50 focus:outline-none`}
                />
              </div>

              {/* Instagram */}
              <div>
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>
                  Instagram
                </label>
                <div className="relative">
                  <Instagram size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
                  <input
                    value={formData.instagram}
                    onChange={(e) => handleChange('instagram', e.target.value)}
                    placeholder="Ex: @usuario"
                    className={`w-full pl-10 pr-4 py-2.5 ${theme.bgCardSolid} ${theme.border} border rounded-xl text-sm ${theme.textPrimary} placeholder:${theme.textPlaceholder} focus:ring-2 focus:ring-emerald-500/50 focus:outline-none`}
                  />
                </div>
              </div>

              {/* Origem */}
              <div>
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>
                  Origem do Lead
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => handleChange('source', e.target.value)}
                  className={`w-full px-4 py-2.5 ${theme.bgCardSolid} ${theme.border} border rounded-xl text-sm ${theme.textPrimary} focus:ring-2 focus:ring-emerald-500/50 focus:outline-none appearance-none`}
                >
                  {SOURCES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Seção: Dados do Lead */}
          <div>
            <h4 className={`text-sm font-bold ${theme.textSecondary} mb-4 flex items-center gap-2`}>
              <DollarSign size={16} />
              Dados do Lead
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Estágio */}
              <div>
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>
                  Estágio do Funil
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => handleChange('stage', e.target.value)}
                  className={`w-full px-4 py-2.5 ${theme.bgCardSolid} ${theme.border} border rounded-xl text-sm ${theme.textPrimary} focus:ring-2 focus:ring-emerald-500/50 focus:outline-none appearance-none`}
                >
                  {STAGES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Temperatura */}
              <div>
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>
                  Temperatura
                </label>
                <select
                  value={formData.temperature}
                  onChange={(e) => handleChange('temperature', e.target.value)}
                  className={`w-full px-4 py-2.5 ${theme.bgCardSolid} ${theme.border} border rounded-xl text-sm ${theme.textPrimary} focus:ring-2 focus:ring-emerald-500/50 focus:outline-none appearance-none`}
                >
                  {TEMPERATURES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Score */}
              <div>
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>
                  Score (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formData.score}
                  onChange={(e) => handleChange('score', parseInt(e.target.value) || 0)}
                  className={`w-full px-4 py-2.5 ${theme.bgCardSolid} ${theme.border} border rounded-xl text-sm ${theme.textPrimary} focus:ring-2 focus:ring-emerald-500/50 focus:outline-none`}
                />
              </div>

              {/* Valor do Negócio */}
              <div>
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>
                  Valor do Negócio (R$)
                </label>
                <input
                  type="number"
                  value={formData.deal_value}
                  onChange={(e) => handleChange('deal_value', e.target.value)}
                  placeholder="Ex: 500000"
                  className={`w-full px-4 py-2.5 ${theme.bgCardSolid} ${theme.border} border rounded-xl text-sm ${theme.textPrimary} placeholder:${theme.textPlaceholder} focus:ring-2 focus:ring-emerald-500/50 focus:outline-none`}
                />
              </div>

              {/* Estágio Interno do Funil */}
              <div>
                <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>
                  Estágio Interno
                </label>
                <select
                  value={formData.funnel_stage}
                  onChange={(e) => handleChange('funnel_stage', e.target.value)}
                  className={`w-full px-4 py-2.5 ${theme.bgCardSolid} ${theme.border} border rounded-xl text-sm ${theme.textPrimary} focus:ring-2 focus:ring-emerald-500/50 focus:outline-none appearance-none`}
                >
                  {FUNNEL_STAGES.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className={`block text-xs font-medium ${theme.textMuted} mb-1.5`}>
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Anotações sobre o lead..."
                rows={3}
                className={`w-full px-4 py-2.5 ${theme.bgCardSolid} ${theme.border} border rounded-xl text-sm ${theme.textPrimary} placeholder:${theme.textPlaceholder} focus:ring-2 focus:ring-emerald-500/50 focus:outline-none resize-none`}
              />
            </div>
          </div>

          {/* Actions */}
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
              disabled={loading || !formData.name || !formData.phone}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Save size={16} />
              {loading ? 'Salvando...' : (lead ? 'Atualizar' : 'Cadastrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
