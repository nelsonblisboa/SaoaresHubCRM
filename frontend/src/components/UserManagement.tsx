import React, { useState, useEffect } from 'react'
import { 
  Users, 
  X, 
  Plus, 
  Save, 
  Trash2, 
  Edit,
  UserCheck,
  Shield,
  Mail,
  UserPlus,
  AlertCircle
} from 'lucide-react'
import { useToast } from '../contexts/ToastContext'
import { useThemeClasses } from '../hooks/useThemeClasses'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

interface UserProfile {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'GERENTE' | 'VENDEDOR' | 'OPERADOR_IA'
  avatar_url: string | null
  created_at: string
}

interface UserManagementProps {
  onClose: () => void
}

export const UserManagement: React.FC<UserManagementProps> = ({ onClose }) => {
  const { showSuccess, showError } = useToast()
  const theme = useThemeClasses()
  const { profile } = useAuth()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'VENDEDOR' as const,
    password: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err: any) {
      showError(err.message || 'Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.name || !newUser.password) {
      showError('Preencha todos os campos')
      return
    }

    try {
      // Criar usuário via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
            role: newUser.role
          }
        }
      })

      if (authError) throw authError

      // Criar perfil
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            organization_id: profile?.organization_id
          })

        if (profileError) throw profileError
      }

      showSuccess('Usuário criado!')
      setShowNewForm(false)
      setNewUser({ email: '', name: '', role: 'VENDEDOR', password: '' })
      fetchUsers()
    } catch (err: any) {
      showError(err.message || 'Erro ao criar usuário')
    }
  }

  const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

      if (error) throw error

      showSuccess('Usuário atualizado!')
      setEditingId(null)
      fetchUsers()
    } catch (err: any) {
      showError(err.message || 'Erro ao atualizar')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      showSuccess('Usuário excluído')
      fetchUsers()
    } catch (err: any) {
      showError(err.message || 'Erro ao excluir')
    }
  }

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-purple-500/10 text-purple-500',
    GERENTE: 'bg-blue-500/10 text-blue-500',
    VENDEDOR: 'bg-emerald-500/10 text-emerald-500',
    OPERADOR_IA: 'bg-amber-500/10 text-amber-500'
  }

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    GERENTE: 'Gerente',
    VENDEDOR: 'Vendedor',
    OPERADOR_IA: 'Operador IA'
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${theme.bgCard} border ${theme.border} rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${theme.border}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Users className="text-blue-500" size={24} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${theme.textPrimary}`}>Gestão de Usuários</h3>
              <p className={`text-xs ${theme.textMuted}`}>Gerencie usuários e permissões</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl font-bold text-sm"
            >
              <UserPlus size={16} />
              Novo Usuário
            </button>
            <button onClick={onClose} className={`p-2 ${theme.bgHover} rounded-lg`}>
              <X size={20} className={theme.textMuted} />
            </button>
          </div>
        </div>

        {/* New User Form */}
        {showNewForm && (
          <div className={`p-6 border-b ${theme.border} ${theme.bgCardSolid}`}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`text-xs ${theme.textMuted} font-bold uppercase mb-2 block`}>Nome</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="João Silva"
                  className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary}`}
                />
              </div>
              <div>
                <label className={`text-xs ${theme.textMuted} font-bold uppercase mb-2 block`}>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="joao@email.com"
                  className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`text-xs ${theme.textMuted} font-bold uppercase mb-2 block`}>Senha</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary}`}
                />
              </div>
              <div>
                <label className={`text-xs ${theme.textMuted} font-bold uppercase mb-2 block`}>Função</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                  className={`w-full ${theme.bgMain} ${theme.border} border rounded-xl px-4 py-3 ${theme.textPrimary}`}
                >
                  <option value="VENDEDOR">Vendedor</option>
                  <option value="GERENTE">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="OPERADOR_IA">Operador IA</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCreateUser}
                className="px-6 py-2 bg-emerald-500 text-slate-950 rounded-xl font-bold"
              >
                Criar Usuário
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                className={`px-6 py-2 ${theme.bgMain} ${theme.border} border rounded-xl ${theme.textSecondary}`}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className={theme.textMuted}>Carregando...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className={`mx-auto mb-4 ${theme.textMuted} opacity-50`} />
              <p className={theme.textMuted}>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className={`${theme.bgCardSolid} ${theme.border} border p-4 rounded-2xl`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        user.role === 'ADMIN' ? 'bg-purple-500 text-white' :
                        user.role === 'GERENTE' ? 'bg-blue-500 text-white' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        {editingId === user.id ? (
                          <input
                            type="text"
                            defaultValue={user.name}
                            onBlur={(e) => handleUpdateUser(user.id, { name: e.target.value })}
                            className={`${theme.bgMain} ${theme.border} border rounded px-2 py-1 ${theme.textPrimary} text-sm`}
                          />
                        ) : (
                          <p className={`font-bold ${theme.textPrimary}`}>{user.name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Mail size={12} className={theme.textMuted} />
                          <span className={`text-xs ${theme.textMuted}`}>{user.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${roleColors[user.role]}`}>
                        <Shield size={12} className="inline mr-1" />
                        {roleLabels[user.role]}
                      </span>

                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingId(editingId === user.id ? null : user.id)}
                          className={`p-2 ${theme.bgHover} rounded-lg text-slate-400 hover:text-blue-500`}
                        >
                          <Edit size={16} />
                        </button>
                        {user.id !== profile?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className={`p-2 ${theme.bgHover} rounded-lg text-slate-400 hover:text-rose-500`}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permissions Info */}
        <div className={`p-4 border-t ${theme.border} ${theme.bgCardSolid}`}>
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div className="text-center">
              <p className="font-bold text-purple-400 mb-1">ADMIN</p>
              <p className={theme.textMuted}>Tudo</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-blue-400 mb-1">GERENTE</p>
              <p className={theme.textMuted}>Usuários + Relatórios</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-emerald-400 mb-1">VENDEDOR</p>
              <p className={theme.textMuted}>Leads + Conversas</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-amber-400 mb-1">OPERADOR IA</p>
              <p className={theme.textMuted}>Monitoramento</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}