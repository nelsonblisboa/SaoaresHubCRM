import React from 'react'
import { 
  Users, 
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MessageCircle,
  Plus
} from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'

const Leads: React.FC = () => {
  const { showSuccess, showInfo } = useToast()
  const theme = useThemeClasses()

  const leads = [
    { name: 'Ana Clara Silva', company: 'Imobiliária Prime', email: 'ana@prime.com', phone: '(11) 99999-9999', status: 'Quente', temp: '🔥' },
    { name: 'Roberto Carlos', company: 'Logística SA', email: 'roberto@log.com', phone: '(11) 98888-8888', status: 'Quente', temp: '🔥' },
    { name: 'Marcos Paulo', company: 'Tech Solutions', email: 'marcos@tech.com', phone: '(11) 97777-7777', status: 'Morno', temp: '🌡️' },
    { name: 'Juliana Lima', company: 'Moda & Cia', email: 'juliana@moda.com', phone: '(11) 96666-6666', status: 'Frio', temp: '❄️' },
  ]

  return (
    <div className={`flex h-screen ${theme.bgMain} font-sans ${theme.textSecondary} overflow-hidden`}>
      <Sidebar />

      <main className={`flex-1 flex flex-col ${theme.bgMain} overflow-hidden`}>
        <header className="p-8 pb-4 flex justify-between items-center">
          <div>
            <h2 className={`text-3xl font-black ${theme.textPrimary} tracking-tight`}>Gestão de Leads</h2>
            <p className={theme.textMuted}>Visualize e gerencie sua base de contatos qualificados.</p>
          </div>
          <button 
            onClick={() => showInfo('Funcionalidade de novo lead em desenvolvimento')}
            className="bg-emerald-500 text-slate-950 px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={20} />
            Novo Lead
          </button>
        </header>

        <div className={`px-8 py-4 flex gap-4 border-b ${theme.headerBorder} items-center justify-between`}>
          <div className="flex gap-4">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.iconMuted}`} size={16} />
              <input 
                type="text" 
                placeholder="Buscar por nome, e-mail..."
                className={`${theme.bgCard} ${theme.border} border pl-10 pr-4 py-2 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none w-80 ${theme.textPlaceholder}`}
              />
            </div>
            <button className={`${theme.bgCardSolid} ${theme.border} border px-4 py-2 rounded-xl ${theme.textMuted} hover:text-emerald-500 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider`}>
              <Filter size={16} />
              Filtrar
            </button>
          </div>
          <div className={`text-xs ${theme.textMuted} font-bold uppercase tracking-widest`}>
            Total: {leads.length} Contatos
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-4">
          <div className={`${theme.bgCard} ${theme.border} border rounded-3xl overflow-hidden`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${theme.headerBorder} text-[10px] ${theme.textMuted} uppercase font-black tracking-widest`}>
                  <th className="p-4 pl-8">Lead</th>
                  <th className="p-4">Empresa</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-8 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme.divider}`}>
                {leads.map((lead, i) => (
                  <tr key={i} className={`${theme.bgHover} transition-colors group`}>
                    <td className="p-4 pl-8">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${theme.bgButton} ${theme.border} border flex items-center justify-center font-bold text-emerald-500`}>
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-bold ${theme.textPrimary} group-hover:text-emerald-400 transition-colors`}>{lead.name}</p>
                          <p className={`text-[10px] ${theme.textMuted}`}>{lead.temp} {lead.status}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`p-4 text-sm ${theme.textMuted}`}>{lead.company}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className={`flex items-center gap-2 text-xs ${theme.textMuted}`}>
                          <Mail size={12} className="text-emerald-500/50" />
                          {lead.email}
                        </div>
                        <div className={`flex items-center gap-2 text-xs ${theme.textMuted}`}>
                          <Phone size={12} className="text-emerald-500/50" />
                          {lead.phone}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${
                        lead.status === 'Quente' ? 'bg-orange-500/10 text-orange-500' : 
                        lead.status === 'Morno' ? 'bg-amber-500/10 text-amber-500' : 
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 pr-8 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => showSuccess(`Abrindo conversa com ${lead.name}`)}
                          className={`p-2 ${theme.textMuted} hover:text-emerald-500 transition-colors ${theme.bgButton} rounded-lg`}
                        >
                          <MessageCircle size={16} />
                        </button>
                        <button 
                          onClick={() => showInfo('Mais opções em desenvolvimento')}
                          className={`p-2 ${theme.textMuted} hover:text-emerald-500 transition-colors ${theme.bgButton} rounded-lg`}
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Leads
