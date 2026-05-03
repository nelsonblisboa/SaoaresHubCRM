import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  X,
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { supabaseService, Lead } from '../services/supabaseService'
import { useAuth } from '../contexts/AuthContext'
import { LeadForm } from '../components/LeadForm'
import { ImportPreviewModal } from '../components/ImportPreviewModal'

const Leads: React.FC = () => {
  const { showSuccess, showError } = useToast()
  const theme = useThemeClasses()
  const { profile } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importError, setImportError] = useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!profile?.organization_id) return
    fetchLeads()
  }, [profile?.organization_id])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const data = await supabaseService.fetchLeads(profile?.organization_id || '')
      setLeads(data || [])
    } catch (error: any) {
      showError(error.message || 'Erro ao carregar leads')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return
    try {
      await supabaseService.updateLead(id, { is_deleted: true } as any)
      showSuccess('Lead excluído com sucesso!')
      fetchLeads()
    } catch (error: any) {
      showError(error.message || 'Erro ao excluir lead')
    }
  }

  const filteredLeads = leads.filter(lead => 
    lead.stage.toLowerCase().includes(search.toLowerCase()) ||
    lead.temperature.toLowerCase().includes(search.toLowerCase()) ||
    (lead.contact?.name && lead.contact.name.toLowerCase().includes(search.toLowerCase())) ||
    (lead.contact?.phone_number && lead.contact.phone_number.includes(search)) ||
    (lead.contact?.instagram_username && lead.contact.instagram_username.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSave = () => {
    setShowModal(false)
    setEditingLead(null)
    fetchLeads()
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError('')
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data: any[] = []
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV melhorado
          const lines = content.split('\n').filter(l => l.trim())
          if (lines.length < 2) throw new Error('Arquivo vazio ou sem dados')
          
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
            const row: any = {}
            
            headers.forEach((h, idx) => {
              if (values[idx] !== undefined) {
                row[h] = values[idx]
              }
            })
            
            data.push(row)
          }
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          showError('📦 Arquivos Excel (.xlsx/.xls) requerem a biblioteca "xlsx". Instale com: npm install xlsx')
          return
        } else {
          throw new Error('Formato não suportado. Use .csv, .xlsx ou .xls')
        }

        if (data.length === 0) throw new Error('Nenhum dado encontrado no arquivo')
        
        setPreviewData(data)
        setShowPreviewModal(true)
        showSuccess(`${data.length} registros carregados para preview`)
      } catch (error: any) {
        setImportError(error.message || 'Erro ao ler arquivo')
        showError(error.message || 'Erro ao ler arquivo')
      }
    }

    reader.onerror = () => {
      setImportError('Erro ao ler arquivo')
      showError('Erro ao ler arquivo')
    }

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      showError('Formato não suportado. Use .csv, .xlsx ou .xls')
    }
    
    // Limpar input
    e.target.value = ''
  }

  const confirmImport = async () => {
    if (previewData.length === 0) return
    
    try {
      setLoading(true)
      let imported = 0
      let errors = 0

      for (const leadData of previewData) {
        try {
          await handleImportLead(leadData)
          imported++
        } catch (error) {
          errors++
          console.error('Erro ao importar lead:', error)
        }
      }

      showSuccess(`Importação concluída: ${imported} sucesso, ${errors} erros`)
      setShowPreviewModal(false)
      setPreviewData([])
      fetchLeads()
    } catch (error: any) {
      showError(error.message || 'Erro na importação')
    } finally {
      setLoading(false)
    }
  }


  const handleImportLead = async (data: any) => {
    try {
      // Verificar se contato existe
      let contactId = ''
      
      if (data.phone) {
        const { data: existingContacts } = await supabaseService['supabase']
          .from('contacts')
          .select('id')
          .eq('phone_number', data.phone)
          .eq('organization_id', profile?.organization_id || '')
          .single()
        
        if (existingContacts?.id) {
          contactId = existingContacts.id
        } else {
          // Criar novo contato
          const { data: newContact } = await supabaseService['supabase']
            .from('contacts')
            .insert({
              name: data.name || 'Lead Importado',
              phone_number: data.phone || null,
              instagram_username: data.instagram || null,
              source: data.source || 'import',
              tags: ['import'],
              organization_id: profile?.organization_id || ''
            })
            .select()
            .single()
          
          if (newContact) contactId = newContact.id
        }
      }
      
      if (contactId) {
        // Criar lead
        await supabaseService.createLead({
          stage: data.stage || 'NOVO',
          score: parseInt(data.score) || 1,
          temperature: data.temperature || 'FRIO',
          deal_value: data.deal_value ? parseFloat(data.deal_value) : null,
          notes: data.notes || 'Importado via CSV',
          contact_id: contactId,
          organization_id: profile?.organization_id || ''
        })
      }
    } catch (error: any) {
      console.error('Erro ao importar lead:', error)
    }
  }

  const downloadTemplate = () => {
    const csvContent = `name,phone,instagram,source,stage,score,temperature,deal_value,notes
João Silva,5511999999999,@joaosilva,whatsapp,NOVO,5,FRIO,500000,Cliente interessado em apartamentos
Maria Santos,5511888888888,@mariasantos,instagram,QUALIFICADO,7,MORNO,350000,Visita agendada
Pedro Lima,5511777777777,,referral,PROPOSTA,8,QUENTE,450000,Proposta enviada`

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'modelo_importacao_leads.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
      <Sidebar />
      
      <main className={`flex-1 flex flex-col ${theme.bgMain} overflow-hidden`}>
        <header className="p-8 pb-4 flex justify-between items-center">
          <div>
            <h2 className={`text-3xl font-black ${theme.textPrimary} tracking-tight`}>Gestão de Leads</h2>
            <p className={theme.textMuted}>Visualize e gerencie sua base de contatos qualificados.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowImportModal(true)}
              className={`${theme.bgCardSolid} ${theme.border} border px-4 py-2 rounded-xl ${theme.textSecondary} font-medium flex items-center gap-2 ${theme.bgHover} transition-colors`}
            >
              <Upload size={18} />
              Importar
            </button>
            <button 
              onClick={downloadTemplate}
              className={`${theme.bgCardSolid} ${theme.border} border px-4 py-2 rounded-xl ${theme.textSecondary} font-medium flex items-center gap-2 ${theme.bgHover} transition-colors`}
            >
              <Download size={18} />
              Modelo
            </button>
            <button 
              onClick={() => { setEditingLead(null); setShowModal(true) }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Novo Lead
            </button>
          </div>
        </header>

        <div className={`px-8 py-4 flex gap-4 border-b ${theme.headerBorder} items-center justify-between`}>
          <div className="flex gap-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.iconMuted}`} size={16} />
              <input 
                type="text" 
                placeholder="Buscar por estágio, temperatura..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${theme.bgCard} ${theme.border} border pl-10 pr-4 py-2 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none w-80 ${theme.textPlaceholder}`}
              />
            </div>
            <button className={`${theme.bgCardSolid} ${theme.border} border px-4 py-2 rounded-xl ${theme.textMuted} hover:text-emerald-500 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider`}>
              <Filter size={16} />
              Filtrar
            </button>
          </div>
          <div className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest`}>
            Total: {filteredLeads.length} Contatos
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className={theme.textMuted}>Carregando...</p>
            </div>
          ) : (
            <div className={`${theme.bgCard} ${theme.border} border rounded-3xl overflow-hidden`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`${theme.headerBorder} text-[10px] ${theme.textMuted} uppercase font-black tracking-widest`}>
                    <th className="p-4 pl-8">Contato</th>
                    <th className="p-4">Estágio</th>
                    <th className="p-4">Temperatura</th>
                    <th className="p-4">Score</th>
                    <th className="p-4 pr-8 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.divider}`}>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className={`${theme.bgHover} transition-colors group`}>
                      <td className="p-4 pl-8">
                        <div>
                          <p className={`font-bold ${theme.textPrimary} group-hover:text-emerald-400 transition-colors text-sm`}>
                            {lead.contact?.name || lead.id.slice(0, 8)}
                          </p>
                          <p className={`text-[10px] ${theme.textMuted}`}>{lead.temperature}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${
                          lead.stage === 'QUALIFICADO' ? 'bg-blue-500/10 text-blue-500' : 
                          lead.stage === 'PROPOSTA' ? 'bg-amber-500/10 text-amber-500' : 
                          lead.stage === 'NEGOCIACAO' ? 'bg-orange-500/10 text-orange-500' :
                          lead.stage === 'GANHO' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-slate-500/10 text-slate-500'
                        }`}>
                          {lead.stage}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-bold ${
                          lead.temperature === 'QUENTE' ? 'text-orange-500' :
                          lead.temperature === 'MORNO' ? 'text-amber-500' :
                          'text-blue-500'
                        }`}>
                          {lead.temperature}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${lead.score * 10}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold ${theme.textMuted}`}>{lead.score}/10</span>
                        </div>
                      </td>
                      <td className="p-4 pr-8 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => { setEditingLead(lead); setShowModal(true) }}
                            className={`p-2 ${theme.textMuted} hover:text-emerald-500 transition-colors ${theme.bgButton} rounded-lg`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(lead.id)}
                            className={`p-2 ${theme.textMuted} hover:text-rose-500 transition-colors ${theme.bgButton} rounded-lg`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>


        {/* Modal de Lead */}
        {showModal && (
          <LeadForm
            lead={editingLead}
            onClose={() => { setShowModal(false); setEditingLead(null) }}
            onSave={handleSave}
          />
        )}

        {/* Modal de Importação */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`${theme.bgCard} p-6 rounded-3xl ${theme.border} border w-96`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-bold ${theme.textPrimary}`}>Importar Leads</h3>
                <button 
                  onClick={() => setShowImportModal(false)}
                  className={`p-2 rounded-lg ${theme.bgHover} transition-colors`}
                >
                  <X size={20} className={theme.textMuted} />
                </button>
              </div>

              <div className="space-y-4">
                <p className={`text-sm ${theme.textMuted}`}>
                  Faça o upload de um arquivo <strong>.CSV</strong> ou <strong>.XLSX</strong> com os leads.
                  {' '}
                  <button onClick={downloadTemplate} className="text-emerald-500 hover:underline">
                    Baixe o modelo aqui
                  </button>
                </p>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed ${theme.border} rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 transition-colors`}
                >
                  <FileSpreadsheet size={48} className={`mx-auto mb-4 ${theme.textMuted}`} />
                  <p className={`text-sm font-medium ${theme.textPrimary} mb-2`}>
                    Clique para selecionar ou arraste o arquivo
                  </p>
                  <p className={`text-xs ${theme.textMuted}`}>
                    Suportado: .csv, .xlsx, .xls
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleImport}
                    className="hidden"
                  />
                </div>

                {importError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
                    <p className="text-sm text-rose-400">{importError}</p>
                  </div>
                )}

                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className={`text-xs font-bold ${theme.textMuted} mb-2 uppercase tracking-widest`}>
                    Formato esperado (CSV):
                  </p>
                  <code className={`text-xs ${theme.textMuted} block whitespace-pre-wrap`}>
{`name,phone,instagram,source,stage,score,temperature,deal_value,notes
João Silva,5511999999999,@joao_s,whatsapp,NOVO,5,FRIO,500000,Cliente interessado`}
                  </code>
                </div>
              </div>

              <button 
                onClick={() => setShowImportModal(false)}
                className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Modal de Preview */}
        {showPreviewModal && (
          <ImportPreviewModal
            data={previewData}
            onConfirm={confirmImport}
            onClose={() => {
              setShowPreviewModal(false)
              setPreviewData([])
            }}
            loading={loading}
          />
        )}
      </main>
    </div>
  )
}

export default Leads
