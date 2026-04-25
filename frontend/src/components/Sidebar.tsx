import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  KanbanSquare, 
  Settings, 
  BarChart3 
} from 'lucide-react'
import { useThemeClasses } from '../hooks/useThemeClasses'

const Sidebar: React.FC = () => {
  const location = useLocation()
  const theme = useThemeClasses()

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Leads', path: '/leads' },
    { icon: KanbanSquare, label: 'Kanban', path: '/kanban' },
    { icon: MessageSquare, label: 'Chat', path: '/conversations' },
    { icon: BarChart3, label: 'Insights', path: '/insights' },
  ]

  return (
    <aside className={`w-64 ${theme.bgSidebar} ${theme.sidebarBorder} border-r backdrop-blur-xl flex flex-col h-screen shrink-0`}>
      <div className="p-6">
        <h1 className={`text-2xl font-black ${theme.textPrimary} tracking-tighter italic`}>SOARES HUB</h1>
        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Emerald Sanctuary</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                  : `${theme.textMuted} ${theme.bgHover} hover:text-emerald-500`
              }`}
            >
              <item.icon size={20} />
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className={`p-4 border-t ${theme.border}`}>
        <Link 
          to="/settings"
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
            location.pathname === '/settings'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
              : `${theme.textMuted} ${theme.bgHover} hover:text-emerald-500`
          }`}
        >
          <Settings size={20} />
          <span className="text-sm">Configurações</span>
        </Link>
      </div>
    </aside>
  )
}

export default Sidebar
