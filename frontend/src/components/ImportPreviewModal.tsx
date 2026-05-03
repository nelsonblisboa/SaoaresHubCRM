/**
 * SOARES HUB CRM - ImportPreviewModal Component
 * Exibe preview dos dados antes da importação
 */

import React, { useState } from 'react'
import { 
  X, 
  Check, 
  AlertTriangle, 
  FileSpreadsheet,
  Upload
} from 'lucide-react'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { useToast } from '../contexts/ToastContext'

interface ImportPreviewModalProps {
  data: any[]
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({ 
  data, 
  onConfirm, 
  onClose,
  loading = false 
}) => {
  const theme = useThemeClasses()
  const { showError } = useToast()
  const [selectedRows, setSelectedRows] = useState<number[]>(
    data.map((_, idx) => idx) // Todos selecionados por padrão
  )

  const headers = data.length > 0 ? Object.keys(data[0]) : []

  const toggleRow = (idx: number) => {
    if (selectedRows.includes(idx)) {
      setSelectedRows(prev => prev.filter(i => i !== idx))
    } else {
      setSelectedRows(prev => [...prev, idx])
    }
  }

  const toggleAll = () => {
    if (selectedRows.length === data.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(data.map((_, idx) => idx))
    }
  }

  const handleConfirm = () => {
    if (selectedRows.length === 0) {
      showError('Selecione pelo menos um registro para importar')
      return
    }
    onConfirm()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${theme.bgCard} w-full max-w-4xl mx-4 rounded-3xl ${theme.border} border overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 ${theme.border} border-b`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className={`font-bold ${theme.textPrimary}`}>Preview da Importação</h3>
              <p className={`text-sm ${theme.textMuted}`}>
                {selectedRows.length} de {data.length} registros selecionados
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

        {/* Alert */}
        <div className="mx-6 mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className={`text-sm font-bold ${theme.textPrimary} mb-1`}>Atenção</p>
            <p className={`text-xs ${theme.textMuted}`}>
              Revise os dados antes de confirmar. A importação irá criar contatos e leads automaticamente.
              Certifique-se de que os campos obrigatórios (nome, telefone) estão preenchidos.
            </p>
          </div>
        </div>

        {/* Tabela de Preview */}
        <div className="mx-6 mt-4 overflow-x-auto" style={{ maxHeight: '50vh' }}>
          <table className="w-full text-left">
            <thead className={`${theme.headerBorder} border-b sticky top-0 ${theme.bgCardSolid}`}>
              <tr>
                <th className="p-3 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedRows.length === data.length}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-emerald-500" 
                  />
                </th>
                {headers.map(header => (
                  <th key={header} className={`p-3 text-xs font-bold uppercase tracking-widest ${theme.textMuted}`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.divider}`}>
              {data.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`${selectedRows.includes(idx) ? 'bg-emerald-500/5' : ''} ${theme.bgHover} transition-colors`}
                >
                  <td className="p-3">
                    <input 
                      type="checkbox" 
                      checked={selectedRows.includes(idx)}
                      onChange={() => toggleRow(idx)}
                      className="w-4 h-4 accent-emerald-500" 
                    />
                  </td>
                  {headers.map(header => (
                    <td key={header} className={`p-3 text-sm ${theme.textPrimary}`}>
                      {row[header] || <span className={theme.textMuted}>-</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-6 ${theme.border} border-t`}>
          <div className={`text-xs ${theme.textMuted}`}>
            {selectedRows.length} registros serão importados
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${theme.bgCardSolid} ${theme.border} border ${theme.textSecondary} ${theme.bgHover} transition-colors`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || selectedRows.length === 0}
              onClick={handleConfirm}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Upload size={16} className="animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Confirmar Importação ({selectedRows.length})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
